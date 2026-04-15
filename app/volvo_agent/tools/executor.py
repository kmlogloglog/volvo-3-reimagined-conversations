"""Tool dispatcher — routes OpenAI function calls to tool functions."""

import json
import logging
from typing import Any

from .book_test_drive_tool import book_test_drive
from .display_car_configuration_tool import display_car_configuration
from .find_retailer_tool import find_retailer
from .save_user_insight_tool import save_user_insight
from .select_exterior_color_tool import select_exterior_color
from .select_interior_tool import select_interior
from .select_model_tool import select_model
from .select_wheel_tool import select_wheel

logger = logging.getLogger(__name__)

_TOOL_MAP = {
    "select_model": select_model,
    "select_exterior_color": select_exterior_color,
    "select_wheel": select_wheel,
    "select_interior": select_interior,
    "display_car_configuration": display_car_configuration,
    "find_retailer": find_retailer,
    "book_test_drive": book_test_drive,
    "save_user_insight": save_user_insight,
}


def execute_tool(name: str, arguments_json: str, state: dict[str, Any]) -> dict:
    """Execute a tool by name. Returns the tool result dict."""
    func = _TOOL_MAP.get(name)
    if func is None:
        return {"agent_context": f"Unknown tool: {name}"}

    try:
        args = json.loads(arguments_json) if isinstance(arguments_json, str) else arguments_json
    except json.JSONDecodeError as e:
        return {"agent_context": f"Invalid arguments JSON: {e}"}

    logger.info(f"Executing tool {name} with args: {args}")

    try:
        # display_car_configuration takes no args beyond state
        if name == "display_car_configuration":
            return func(state)
        return func(state, **args)
    except Exception as e:
        logger.error(f"Tool {name} failed: {e}", exc_info=True)
        return {"agent_context": f"Tool error: {e}"}
