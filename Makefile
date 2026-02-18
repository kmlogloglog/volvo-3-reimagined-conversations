# ==============================================================================
# Variables
# ==============================================================================

# GCP Project Configuration
PROJECT_ID       := vml-map-xd-volvo
PROJECT_NUMBER   := 719852784419
PROJECT_LOCATION := europe-west4
SERVICE_ACCOUNT  := volvo-vaen-sa@$(PROJECT_ID).iam.gserviceaccount.com
DOMAIN           := vml.com

# Service Names
AGENT_SERVICE_NAME := volvo-vaen

# Service URLs
SERVICE_URL  := https://$(AGENT_SERVICE_NAME)-$(PROJECT_NUMBER).$(PROJECT_LOCATION).run.app

# ==============================================================================
# Targets
# ==============================================================================

.PHONY: all help install auth lint test clean kill \
        run-agent build-ui setup-apis setup-firestore \
				setup-sa set-iap deploy-agent lint-ui

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
	uv sync && cd ui && npm install && cd ..

auth: ## Authenticate with Google Cloud
	gcloud auth application-default login
	gcloud config set project $(PROJECT_ID)
	gcloud auth application-default set-quota-project $(PROJECT_ID)
setup-apis: ## Enable required Google Cloud APIs
	gcloud services enable aiplatform.googleapis.com firestore.googleapis.com run.googleapis.com cloudbuild.googleapis.com logging.googleapis.com iam.googleapis.com iap.googleapis.com --project $(PROJECT_ID)

setup-firestore: ## Create the default Firestore database (if it doesn't exist)
	gcloud firestore databases create --location=$(PROJECT_LOCATION) --database="(default)" --project=$(PROJECT_ID) || echo "Database might already exist or error occurred."

setup-sa: ## Create or Update Service Account and grant necessary roles
	@echo "Checking service account $(SERVICE_ACCOUNT)..."
	@if gcloud iam service-accounts describe $(SERVICE_ACCOUNT) --project $(PROJECT_ID) >/dev/null 2>&1; then \
		echo "Service account exists. Updating..."; \
		gcloud iam service-accounts update $(SERVICE_ACCOUNT) --display-name "Volvo Vän Service Account" --project $(PROJECT_ID) --quiet >/dev/null; \
	else \
		echo "Creating service account..."; \
		gcloud iam service-accounts create $(shell echo $(SERVICE_ACCOUNT) | cut -d@ -f1) \
			--display-name "Volvo Vän Service Account" \
			--project $(PROJECT_ID) --quiet >/dev/null; \
	fi
	@echo "Granting roles..."
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/aiplatform.user" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/datastore.user" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/iam.serviceAccountTokenCreator" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/logging.logWriter" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/run.invoker" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/run.serviceAgent" --condition=None --quiet >/dev/null
	@gcloud projects add-iam-policy-binding $(PROJECT_ID) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/secretmanager.secretAccessor" --condition=None --quiet >/dev/null
	@echo "Done."

lint: ## Run linting and type checking
	uv sync --dev --extra lint
	uv run codespell
	uv run ruff check . --diff
	uv run ruff format . --check --diff
	uv run mypy .

lint-ui: ## Run linting for the frontend
	npm run lint --prefix ui

clean: ## Clean up temporary files
	rm -rf .mypy_cache .ruff_cache .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +

kill: ## Kill local development processes (ports 8000-8004)
	lsof -ti :8000,8001,8002,8003,8004,8080 | xargs -r kill

## ----------------------------------------------------------------------
## Local Development (Run)
## ----------------------------------------------------------------------

build-ui: ## Build the UI
	npm run generate --prefix ui

run-agent: # Run the agent with using the main (same as in Cloud Run) - Runs on port 8080
	@echo "----------------------------------------------------------"
	@echo "Debug UI available at: http://127.0.0.1:8080/debug"
	@echo "Nuxt UI available at: http://127.0.0.1:8080/"
	@echo "----------------------------------------------------------"
	uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8080

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
	--set-env-vars USE_FIRESTORE=True \
	--min 1
	@echo "Adding IAP binding..."
	gcloud beta iap web add-iam-policy-binding \
	--member domain:$(DOMAIN) \
	--role roles/iap.httpsResourceAccessor \
	--region $(PROJECT_LOCATION) \
	--resource-type cloud-run \
	--service $(AGENT_SERVICE_NAME) \
	--condition None

set-iap:
	gcloud beta iap web add-iam-policy-binding \
	--member domain:$(DOMAIN) \
	--role roles/iap.httpsResourceAccessor \
	--region $(PROJECT_LOCATION) \
	--resource-type cloud-run \
	--service $(AGENT_SERVICE_NAME) \
	--condition None