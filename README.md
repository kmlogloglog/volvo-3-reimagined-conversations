# Volvo Vän Service

A voice-first AI assistant for Volvo, demonstrating real-time bidirectional streaming with Google's Agent Development Kit (ADK). This application features a premium "Aurora" visualizer and seamless voice/text interaction.

## Overview

Volvo Vän is designed to be a companion that helps users with car-related queries and tasks. It supports:

-   **Voice Interaction**: Real-time bidirectional audio streaming.
-   **Text Interaction**: Seamless inline text input for silent queries.
-   **Visual Feedback**: A dynamic "Aurora" visualizer that reacts to speaking/listening states.

## Architecture
-   **Backend**: Python (FastAPI + Google ADK)
-   **Frontend**: Vanilla JavaScript + HTML/CSS (No build step required)
-   **Protocol**: WebSocket for bidirectional audio/text streaming

## Prerequisites

-   Python 3.12 or higher
-   [make](https://www.gnu.org/software/make/) (GNU Make)
-   [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
-   [uv](https://docs.astral.sh/uv/) (recommended package manager)
-   **GCP Permissions**: Owner or Editor access to the project (required to setup IAM roles and IAP).
-   Google Cloud Project with the following APIs enabled:
    -   `aiplatform.googleapis.com` (Vertex AI)
    -   `firestore.googleapis.com` (Firestore)
    -   `run.googleapis.com` (Cloud Run)
    -   `cloudbuild.googleapis.com` (Cloud Build)
    -   `logging.googleapis.com` (Cloud Logging)
    -   `iam.googleapis.com` (Identity and Access Management)
    -   `iap.googleapis.com` (Identity-Aware Proxy)

    (These will be enabled in the Quick Start guide)

## Quick Start

### 1. Installation

Clone the repository and install dependencies using `make`:

```bash
make install
```

### 2. Configuration

Copy the example environment file and configure your project details:

```bash
cp app/.env-example app/.env
```

Edit `app/.env` with your specific configuration (Project ID, Region, etc.).

### 3. Authentication

Authenticate with Google Cloud to access Vertex AI models:

```bash
make auth
```

### 4. Enable APIs (Optional)

If your Google Cloud Project already has the required APIs enabled, you can skip this step.

Enable the required Google Cloud APIs for the project:

```bash
make setup-apis
```

### 5. Service Account Setup (Optional)

If you already have a configured service account with the necessary roles, you can skip this step.

If you plan to deploy or use Firestore features, set up the service account and permissions automatically:

```bash
make setup-sa
```

This will create the service account (if one doesn't exist already) and grant the following roles:
- `roles/aiplatform.user` (Gemini & Search)
- `roles/datastore.user` (Firestore Access)
- `roles/logging.logWriter` (Cloud Logging)
- `roles/iam.serviceAccountTokenCreator` (Service Account Token Creator)
- `roles/run.invoker` (Cloud Run Invoker)
- `roles/run.serviceAgent` (Cloud Run Service Agent)

### 6. Firestore Setup (Optional)

If you already have a Firestore database configured, you can skip this step.

If you plan to use Firestore for persistence, create the default database:

```bash
make setup-firestore
```

### 7. Running Locally

First, build the UI:

```bash
make build-ui
```

Then, start the local development server with hot-reloading:

```bash
make run-agent
```

By default, the agent uses **In-Memory persistence**. This way, sessions and memories are lost when the server restarts.

To use Firestore locally (requires `make auth` first):
1. Ensure your Google Cloud project has Firestore enabled.
2. Set `USE_FIRESTORE=True` in your `app/.env` file.
3. Run the agent:
   ```bash
   make run-agent
   ```

-   **New Voice UI**: http://127.0.0.1:8080/
-   **Old Voice UI**: http://127.0.0.1:8080/old-ui
-   **Debug UI**: http://127.0.0.1:8080/debug

## Persistence & Memory

The agent supports two modes of operation for storing conversation history and long-term memory.

### Configuration

Control persistence via the `USE_FIRESTORE` environment variable:

-   **In-Memory** (Default, `USE_FIRESTORE=False`):
    -   Ideal for local development and testing.
    -   Sessions and memories are stored in RAM.
    -   **Note**: All data is lost when the application stops.

-   **Google Cloud Firestore** (`USE_FIRESTORE=True`):
    -   Recommended for production and for realistic local development.
    -   **Hierarchy**:
        -   Sessions: `users/{user_id}/sessions/{session_id}`
        -   Memories: `users/{user_id}/memories/{field_key}`
    -   Requires `google-cloud-firestore` API and authenticated credentials.

### Memory Architecture

When a session ends (WebSocket disconnect), the **Memory Service** runs two steps:

1.  **Field-level persistence**: Each `user:` state field set by tools during the conversation (e.g., `user:full_name`, `user:email`, `user:car_config`) is saved as an individual Firestore document under `users/{user_id}/memories/`. This means each field can be updated independently across sessions.

2.  **LLM-powered summary consolidation**: The conversation transcript is sent to an LLM (Gemini 2.5 Flash) along with any existing summary from prior sessions. The LLM produces a consolidated summary that accumulates knowledge about the user across all sessions. This summary is stored as `users/{user_id}/memories/interactions_summary`.

When a new session starts, the **Preload Memory Callback** loads all stored fields back into session state and makes the consolidated summary available to the agent's prompt, enabling personalized greetings and context-aware conversations.

## Frontend Features

The frontend is built with pure web technologies for maximum performance and simplicity.

-   **Auto-Connect**: The application connects automatically on load.
-   **Inline Text Input**: Click "Ask Volvo Vän" to type messages. Focus is maintained for continuous conversation.
-   **Push-to-Talk (PTT)**: Hold **Spacebar** to speak, release to mute. (Disabled while typing).
-   **Microphone Toggle**: Click the mic icon to toggle mute/unmute permanently.

## Deployment

Deploy the agent to Google Cloud Run using the included Makefile target:

```bash
make deploy-agent
```

This command:
1.  Builds the container image (including the frontend).
2.  Deploys to Cloud Run in the configured region.
3.  Sets up IAP (Identity-Aware Proxy) permissions.

## Project Structure

```
.
├── app/
│   ├── main.py                       # FastAPI entry point & WebSocket handler
│   ├── .env                          # Environment variables
│   └── volvo_agent/                  # Agent logic
│       ├── volvo_agent.py            # Agent definition (model, tools, callbacks)
│       ├── callbacks/                # Lifecycle callbacks
│       │   └── preload_memory_callback.py  # Loads memories at session start
│       ├── config/                   # Prompts & configuration
│       │   └── prompts.py            # Agent system prompt
│       ├── knowledge/                # Static knowledge base (JSON)
│       ├── schemas/                  # Pydantic models (car config, test drive)
│       ├── services/                 # Session, Memory & service registry
│       │   ├── registry.py           # Service singletons (session, memory, genai)
│       │   ├── memory_service.py     # Memory persistence & LLM summary
│       │   └── firestore_session_service.py
│       ├── tools/                    # Agent tools
│       │   ├── update_and_display_car_configuration_tool.py
│       │   ├── find_retailer_tool.py
│       │   └── book_test_drive_tool.py
│       └── utils/                    # Shared utilities (JSON loading, fuzzy match)
│
├── ui/                               # Frontend (Nuxt)
├── debug_frontend/                   # Debug interface
├── Makefile                          # Command shortcuts
├── pyproject.toml                    # Dependencies
├── Dockerfile                        # Deployment container definition
└── README.md                         # Documentation
```

## Useful Commands

| Command | Description |
|---------|-------------
| `make help` | Show available commands |
| `make install` | Install all dependencies |
| `make auth` | Authenticate with Google Cloud |
| `make setup-apis` | Enable required Google Cloud APIs |
| `make setup-sa` | Create/Update Service Account & Roles |
| `make setup-firestore` | Create default Firestore database |
| `make build-ui` | Build the frontend UI |
| `make run-agent` | Run local server (Voice + Debug UI) |
| `make deploy-agent` | Deploy to Cloud Run |
| `make lint` | Run code linting and type checking for backend code |
| `make lint-ui` | Run code linting and type checking for frontend code |
| `make clean` | Clean up temporary files |
| `make kill` | Kill lingering local server processes |