# ==============================================================================
# Variables
# ==============================================================================

# GCP Project Configuration
PROJECT_ID       := patoz-sandbox#vml-map-xd-volvo
PROJECT_NUMBER   := 948309917453#719852784419
PROJECT_LOCATION := europe-west4
SERVICE_ACCOUNT  := cymbal-direct-ai-sa@patoz-sandbox.iam.gserviceaccount.com
DOMAIN           := google.com#vml.com

# Service Names
AGENT_SERVICE_NAME := volvo-agent

# Service URLs
SERVICE_URL  := https://$(AGENT_SERVICE_NAME)-$(PROJECT_NUMBER).$(PROJECT_LOCATION).run.app

# ==============================================================================
# Targets
# ==============================================================================

.PHONY: all help install auth lint test clean kill \
        run-adk run-mcp run-car-info run-test-drive run-orchestrator \
        deploy-mcp deploy-car-info deploy-test-drive deploy-orchestrator

all: help

## ----------------------------------------------------------------------
## Helper
## ----------------------------------------------------------------------

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

## ----------------------------------------------------------------------
## Setup & Maintenance
## ----------------------------------------------------------------------

install: ## Install dependencies using uv
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing uv..."; curl -LsSf https://astral.sh/uv/0.6.12/install.sh | sh; source $HOME/.local/bin/env; }
	uv sync

auth: ## Authenticate with Google Cloud
	gcloud auth application-default login
	gcloud config set project $(PROJECT_ID)
	gcloud auth application-default set-quota-project $(PROJECT_ID)

setup-firestore: ## Create the default Firestore database (if it doesn't exist)
	gcloud firestore databases create --location=$(PROJECT_LOCATION) --database="(default)" --project=$(PROJECT_ID) || echo "Database might already exist or error occurred."

lint: ## Run linting and type checking
	uv sync --dev --extra lint
	uv run codespell
	uv run ruff check . --diff
	uv run ruff format . --check --diff
	uv run mypy .

clean: ## Clean up temporary files
	rm -rf .mypy_cache .ruff_cache .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +

kill: ## Kill local development processes (ports 8000-8004)
	lsof -ti :8000,8001,8002,8003,8004 | xargs -r kill

## ----------------------------------------------------------------------
## Local Development (Run)
## ----------------------------------------------------------------------

run-agent: # Run the agent with using the main (same as in Cloud Run) - Runs on port 8001
#	uv run -m app.main
	uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

run-debug: ## Run the agent and show debug link
	@echo "----------------------------------------------------------"
	@echo "Debug UI available at: http://127.0.0.1:8001/debug"
	@echo "Voice UI available at: http://127.0.0.1:8001/"
	@echo "----------------------------------------------------------"
	@$(MAKE) run-agent

run-adk: # Run the ADK Web UI to interact with the agent - Runs on port 8000
	uv run adk web agents --port 8000

## ----------------------------------------------------------------------
## Deployment
## ----------------------------------------------------------------------

deploy-agent: ## Deploy Volvo Agent to Cloud Run
	gcloud beta run deploy $(AGENT_SERVICE_NAME) \
	--source . \
	--port 8080 \
	--iap \
	--no-allow-unauthenticated \
	--region $(PROJECT_LOCATION) \
	--ingress all \
	--service-account $(SERVICE_ACCOUNT) \
	--set-env-vars GOOGLE_GENAI_USE_VERTEXAI=True \
	--set-env-vars GOOGLE_CLOUD_PROJECT=$(PROJECT_ID) \
	--set-env-vars GOOGLE_CLOUD_LOCATION=$(PROJECT_LOCATION) \
	--set-env-vars SERVICE_ACCOUNT=$(SERVICE_ACCOUNT) \
	--set-env-vars HOST_URL=${SERVICE_URL} \
	--min-instances 1
	@echo "Adding IAP binding..."
	gcloud beta iap web add-iam-policy-binding \
	--member domain:$(DOMAIN) \
	--role roles/iap.httpsResourceAccessor \
	--region $(PROJECT_LOCATION) \
	--resource-type cloud-run \
	--service $(AGENT_SERVICE_NAME) \
	--condition None