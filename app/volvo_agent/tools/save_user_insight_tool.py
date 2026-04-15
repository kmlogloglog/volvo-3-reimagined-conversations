import logging
from typing import Any

logger = logging.getLogger(__name__)

_STATE_KEY_CATEGORIES = {
    "full_name": "user:full_name",
    "email": "user:email",
    "location": "user:location",
    "current_car": "user:current_car",
}


def save_user_insight(state: dict[str, Any], category: str, value: str) -> dict:
    """Saves a structured insight about the user."""
    logger.info(f"save_user_insight called: {category}='{value}'")

    if category in _STATE_KEY_CATEGORIES:
        state[_STATE_KEY_CATEGORIES[category]] = value
    else:
        profiling: dict = state.get("user:profiling") or {}
        profiling[category] = value
        state["user:profiling"] = profiling

    result: dict = {"success": True, "category": category, "value": value}

    if category == "full_name":
        result["ui_action"] = {
            "action": "name_collected",
            "data": {"name": value},
        }

    return result
