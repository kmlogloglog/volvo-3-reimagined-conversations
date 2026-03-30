import logging

from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext

from ..schemas import InsightCategory

logger = logging.getLogger(__name__)


# Categories that map to dedicated state keys instead of user:profiling
_STATE_KEY_CATEGORIES = {
    "full_name": "user:full_name",
    "email": "user:email",
    "location": "user:location",
    "current_car": "user:current_car",
}


async def save_user_insight(
    category: InsightCategory,
    value: str,
    tool_context: ToolContext,
) -> dict:
    """Saves a structured insight about the user.

    Use this tool to persist user profiling data (Phase 1) or personal
    information (Phase 5). Data is automatically persisted across sessions.

    Args:
        category: The type of insight to save. Must be one of:
            - passenger_count: How many people typically ride with the user.
            - driving_environment: Urban, suburban, rural, mixed, etc.
            - daily_car_use: Commute, school runs, errands, etc.
            - weekend_vibe: Adventure, relaxation, family outings, etc.
            - current_car: The user's current car (make and model).
            - full_name: User's full name.
            - email: User's email address.
            - location: User's city or location.
        value: The value for this category (e.g. "2 adults + 1 child",
               "urban", "commute and school runs", "hiking and camping").
        tool_context: The tool context.
    """
    logger.info(f"save_user_insight called: {category}='{value}'")

    if category in _STATE_KEY_CATEGORIES:
        tool_context.state[_STATE_KEY_CATEGORIES[category]] = value
    else:
        profiling: dict = tool_context.state.get("user:profiling") or {}
        profiling[category] = value
        tool_context.state["user:profiling"] = profiling

    return {"success": True, "category": category, "value": value}


save_user_insight_tool = FunctionTool(save_user_insight)
