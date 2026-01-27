# Volvo Vän Service

A voice-first AI assistant for Volvo, demonstrating real-time bidirectional streaming with Google's Agent Development Kit (ADK). This application features a premium "Aurora" visualizer and seamless voice/text interaction.

![bidi-demo-screen](assets/bidi-demo-screen.png)

## Overview

Volvo Vän is designed to be a companion that helps users with car-related queries and tasks. It supports:

-   **Voice Interaction**: Real-time bidirectional audio streaming.
-   **Text Interaction**: Seamless inline text input for silent queries.
-   **Push-to-Talk**: Spacebar control for momentary microphone activation.
-   **Visual Feedback**: A dynamic "Aurora" visualizer that reacts to speaking/listening states.

## Architecture

-   **Backend**: Python (FastAPI + Google ADK)
-   **Frontend**: Vanilla JavaScript + HTML/CSS (No build step required)
-   **Protocol**: WebSocket for bidirectional audio/text streaming

## Prerequisites

-   Python 3.12 or higher
-   [uv](https://docs.astral.sh/uv/) (recommended package manager)
-   Google Cloud Project with Vertex AI enabled
-   **Optional**: Google Cloud Firestore (for production persistence)

## Quick Start

### 1. Installation

Clone the repository and install dependencies using `make`:

```bash
make install
```

### 2. Authentication

Authenticate with Google Cloud to access Vertex AI models:

```bash
make auth
```

### 3. Running Locally

Start the local development server with hot-reloading:

```bash
make run-debug
```

By default, the agent uses **File-based persistence** (`.sessions/` directory) for local development. No extra setup required.

To use Firestore locally:
1. Ensure your Google Cloud project has Firestore enabled.
2. Run with `USE_FIRESTORE=True`:
   ```bash
   USE_FIRESTORE=True make run-debug
   ```

-   **Voice UI**: http://127.0.0.1:8001/
-   **Debug UI**: http://127.0.0.1:8001/debug

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
│   ├── volvo_agent/              # Agent logic and prompts
│   └── static/                   # Frontend assets (served directly)
├── frontend/                     # Source frontend files
│   ├── css/                      # Styles
│   ├── js/                       # Application logic & audio processors
│   └── img/                      # Assets (logos, icons)
├── Makefile                      # Command shortcuts
├── pyproject.toml                # Dependencies
└── Dockerfile                    # Deployment container definition
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make run-debug` | Run local server with debug mode |
| `make deploy-agent` | Deploy to Cloud Run |
| `make lint` | Run code linting and type checking |
| `make kill` | Kill lingering local server processes |