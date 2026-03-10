# Volvo Vän – Copilot Instructions

## Project Overview

Volvo Vän is a voice-first AI assistant for Volvo built on **Google ADK (Agent Development Kit)** with **FastAPI** and **WebSockets** for real-time bidirectional audio/text streaming. The backend serves both a Nuxt.js frontend (`ui/`) and a raw debug frontend (`debug_frontend/`).

---

## Commands

### Install
```bash
make install          # uv sync + npm install in ui/
```

### Run locally
```bash
make build-ui         # Build Nuxt UI (required before run-agent)
make run-agent        # uvicorn on port 8080 (hot-reload)
# Debug UI: http://127.0.0.1:8080/debug
# Nuxt UI:  http://127.0.0.1:8080/
```

### Lint (backend)
```bash
make lint             # codespell + ruff check + ruff format + mypy
uv run ruff check .   # check only
uv run ruff format .  # format only
uv run mypy .         # type check only
```

### Lint (frontend)
```bash
make lint-ui          # npm run lint --prefix ui
```

### Tests
```bash
uv run pytest                        # full test suite
uv run pytest path/to/test_file.py   # single test file
uv run pytest -k "test_name"         # single test by name
```

### Deploy
```bash
make deploy-agent     # Build + deploy to Cloud Run with IAP
```

---

## Architecture

```
app/
├── main.py                              # FastAPI app, WebSocket endpoint /ws/{user_id}/{session_id}
└── volvo_agent/
    ├── volvo_agent.py                   # LlmAgent definition (model, tools, callbacks)
    ├── callbacks/
    │   └── preload_memory_callback.py   # before_agent_callback: loads memories + injects temp: state
    ├── config/prompts.py                # Agent system prompt (PROMPT constant)
    ├── knowledge/                       # Static JSON knowledge base (car configs, images, retailers)
    ├── schemas/                         # Pydantic models (CarConfiguration, TestDrive)
    ├── services/
    │   ├── registry.py                  # Singletons: session_service, memory_service, genai_client
    │   ├── firestore_session_service.py
    │   └── firestore_memory_service.py
    ├── tools/                           # Agent tools (wrapped as FunctionTool)
    └── utils/                           # JSON loading, fuzzy matching helpers
```

**WebSocket lifecycle (4 phases in `main.py`):**
1. **App init** – `Runner`, `session_service`, `memory_service` created once at startup
2. **Session init** – Session get/create; `RunConfig` built based on model type (native-audio vs. half-cascade)
3. **Active session** – `upstream_task` + `downstream_task` run concurrently via `asyncio.gather`
4. **Session teardown** – `memory_service.add_session_to_memory(session)` called on WebSocket disconnect

---

## Key Conventions

### Google ADK patterns
- The agent is an `LlmAgent` from `google.adk.agents.llm_agent`; tools are wrapped with `FunctionTool`.
- Tools receive a `ToolContext` as their **first argument** — this is injected by ADK, not passed by the LLM.
- Tools return a plain `dict` that **must include `agent_context`** (string) for agent feedback, and optionally `ui_action` to send display commands to the frontend.

### State tiers (ADK conventions)
| Prefix | Scope | Persisted |
|--------|-------|-----------|
| `app:` | App-wide | Yes (Firestore) |
| `user:` | Per-user, cross-session | Yes (Firestore) |
| `temp:` | Current run only | No |
| *(none)* | Session | Yes (Firestore) |

Use `tool_context.state["user:key"]` to persist user data (e.g., `user:car_config`, `user:full_name`).  
Use `callback_context.state["temp:key"]` for transient values injected at session start (e.g., `temp:car_configurations`, `temp:current_datetime`).

### Pydantic schemas with fuzzy validation
`CarConfiguration` uses a `@model_validator(mode="after")` that fuzzy-matches invalid values against the knowledge base instead of raising errors. All new schemas that receive LLM-provided enum values should follow this pattern.

### Model-conditional RunConfig
Native-audio models (`"native-audio"` in model name) require `response_modalities=["AUDIO"]` and support proactivity/affective dialog. Half-cascade models use `response_modalities=["TEXT"]`. Detected at runtime in `main.py`.

### Knowledge base loading
Static JSON files under `knowledge/` are loaded **once at module level** via helpers in `utils.py` (e.g., `load_car_configurations()`, `load_car_images()`). Never load them inside a per-request function.

### Environment & configuration
Copy `app/.env-example` to `app/.env` before running locally. Key variables:
- `GOOGLE_GENAI_USE_VERTEXAI=TRUE`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `USE_FIRESTORE` — `False` (default, in-memory) or `True` (Firestore)
- `FIRESTORE_DB` — Firestore database name
- `GOOGLE_MAPS_API_KEY` — injected as a Cloud Run secret in production
- `DEBUG_ROOT_ENDPOINT` — `True` serves debug UI at `/`; `False` serves Nuxt UI at `/`

`dotenv` loads `app/.env` in `main.py` **before** importing the agent or services.

### Persistence backends
`services/registry.py` selects session/memory service implementations at import time based on `USE_FIRESTORE`. To add a new backend, create it in `services/` and update `registry.py`.

### Frontend serving order
`debug_frontend/` is mounted at `/static` and served at `/debug`. Nuxt UI (`ui/.output/public/`) is mounted at `/` and **must be the last route registered** to avoid capturing other routes. Run `make build-ui` after any frontend changes.

### Tooling
- **Package manager**: `uv` — use `uv run <cmd>` and `uv sync`; do not use plain `pip`
- **Linter/formatter**: `ruff` (line length 88, Python 3.13 target)
- **Type checker**: `mypy` (strict — all functions must be fully typed)
- **Spell checker**: `codespell` (ignore-word: `wit`)
- **Frontend**: Nuxt.js in `ui/`, managed with `npm`
- GCP project: `vml-map-xd-volvo`, region: `europe-west4`, Cloud Run service: `volvo-vaen-v2`
