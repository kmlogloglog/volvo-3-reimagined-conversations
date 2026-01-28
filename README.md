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

### 4. Enable APIs

Enable the required Google Cloud APIs for the project:

```bash
make setup-apis
```

### 5. Service Account Setup

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

### 6. Running Locally

Start the local development server with hot-reloading:

```bash
make run-agent
```

By default, the agent uses **In-Memory persistence** (`USE_FIRESTORE=False`). Sessions and memories are lost when the server restarts.

To use Firestore locally (requires `make auth` first):
1. Ensure your Google Cloud project has Firestore enabled.
2. Run with `USE_FIRESTORE=True`:
   ```bash
   USE_FIRESTORE=True make run-agent
   ```

-   **Voice UI**: http://127.0.0.1:8001/
-   **Debug UI**: http://127.0.0.1:8001/debug

## Persistence & Memory

The agent supports two modes of operation for storing conversation history and long-term memory.

### Configuration

Control persistence via the `USE_FIRESTORE` environment variable:

-   **In-Memory** (Default, `USE_FIRESTORE=False`):
    -   Ideal for local development and testing.
    -   Sessions and memories are stored in RAM.
    -   **Note**: All data is lost when the application stops.

-   **Google Cloud Firestore** (`USE_FIRESTORE=True`):
    -   Recommended for production.
    -   **Hierarchy**:
        -   Sessions: `users/{user_id}/sessions/{session_id}`
        -   Memories: `users/{user_id}/memories/{memory_id}`
    -   Requires `google-cloud-firestore` API and authenticated credentials.

### Memory Features

The agent uses a hybrid **Memory Service**:

-   **Access**: The agent can search past memories to answer user questions (e.g., "What did I tell you about my car?").
-   **Fallback**: When Firestore is disabled, it behaves identically but stores "saved" facts in a temporary in-memory list.

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
│   ├── main.py                   # FastAPI entry point
│   ├── .env                      # Environment variables
│   ├── volvo_agent/              # Agent logic
│   │   ├── volvo_agent.py        # Agent definition
│   │   ├── config/               # Configuration & Prompts
│   │   ├── services/             # Session & Memory services (Firestore/InMemory)
│   │   └── tools/                # Agent tools (SaveMemory, Search, etc.)
│
├── frontend/                     # Source frontend files
│   ├── index.html                # Main Voice UI
│   ├── css/                      # Styles
│   ├── js/                       # Application logic & audio processors
│   ├── img/                      # Assets (logos, icons)
│   └── debug/                    # Debug Interface
│       ├── index.html
│       ├── css/
│       └── js/
│
├── Makefile                      # Command shortcuts
├── pyproject.toml                # Dependencies
├── Dockerfile                    # Deployment container definition
└── README.md                     # Documentation
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
| `make run-agent` | Run local server (Voice + Debug UI) |
| `make deploy-agent` | Deploy to Cloud Run |
| `make lint` | Run code linting and type checking |
| `make clean` | Clean up temporary files |
| `make kill` | Kill lingering local server processes |