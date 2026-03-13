# Agent Tools

This directory contains the tools available to the Volvo Agent.

## Available Tools

| Tool | Description |
|------|-------------|
| `select_model` | Selects a car model and returns its silhouette image |
| `select_exterior_color` | Selects an exterior color and returns gradient stops |
| `select_interior` | Selects an interior option and returns upholstery image |
| `select_wheel` | Selects a wheel option and returns wheel close-up image |
| `display_car_configuration` | Displays the final configuration as a 5-image carousel |
| `find_retailer` | Finds the nearest Volvo retailer via Google Maps |
| `book_test_drive` | Books a test drive appointment |
| `save_user_insight` | Saves structured profiling or personal data to session state |

Each tool that produces visual output returns a `ui_action` payload for the frontend. See [docs/frontend-payloads.md](../../../docs/frontend-payloads.md) for the full payload reference.

Image URLs are resolved from `knowledge/car_assets.json`. See [docs/firebase-storage-structure.md](../../../docs/firebase-storage-structure.md) for the storage layout.

## Adding New Tools

1. Create a new Python file in this directory (e.g., `my_new_tool.py`).
2. Implement your tool function and wrap it with `FunctionTool`.
3. Export it in `__init__.py`.
4. Register it in `app/volvo_agent/volvo_agent.py`.
