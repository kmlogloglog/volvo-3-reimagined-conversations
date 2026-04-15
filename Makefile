# ==============================================================================
# Volvo Freja — OpenAI Realtime API
# ==============================================================================

.PHONY: all help install lint clean kill run-agent build-ui init-db

all: help

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

## ----------------------------------------------------------------------
## Setup & Maintenance
## ----------------------------------------------------------------------

install: ## Install dependencies using uv
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing uv..."; curl -LsSf https://astral.sh/uv/0.6.12/install.sh | sh; source $HOME/.local/bin/env; }
	uv sync

init-db: ## Initialize the SQLite database
	uv run python -m app.init_db

lint: ## Run linting and type checking
	uv sync --dev --extra lint
	uv run codespell
	uv run ruff check . --diff
	uv run ruff format . --check --diff
	uv run mypy .

clean: ## Clean up temporary files
	rm -rf .mypy_cache .ruff_cache .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +

kill: ## Kill local development processes (ports 8080)
	lsof -ti :8080 | xargs -r kill

## ----------------------------------------------------------------------
## Local Development
## ----------------------------------------------------------------------

run-agent: ## Run the agent server on port 8080
	@echo "----------------------------------------------------------"
	@echo "Debug UI available at: http://127.0.0.1:8080/debug"
	@echo "----------------------------------------------------------"
	uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
