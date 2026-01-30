# Agent Tools

This directory contains the tools available to the Volvo Agent.

## Adding New Tools

To add a new tool:
1. Create a new Python file in this directory (e.g., `my_new_tool.py`).
2. Implement your tool class or function.
3. Import and expose it in `__init__.py` (optional but recommended).
4. Register it in `app/volvo_agent/volvo_agent.py`.
