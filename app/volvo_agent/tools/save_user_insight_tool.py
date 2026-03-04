import logging

from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class SaveUserInsightResponse(BaseModel):
    success: bool = Field(description="Whether the insight was saved successfully.")


async def save_user_insight(
    text: str, tool_context: ToolContext
) -> SaveUserInsightResponse:
    """Saves a profiling insight about the user.

    Appends the insight to the user:profiling list in session state,
    which is automatically persisted across sessions by the session service.

    Args:
        text: The insight to save (e.g. "User likes red SUVs",
              "User has two kids and a dog", "User prefers mountain weekends").
        tool_context: The tool context.
    """
    logger.info(f"Tool save_user_insight called with text: '{text}'")

    profiling: list[str] = tool_context.state.get("user:profiling") or []
    profiling.append(text)
    tool_context.state["user:profiling"] = profiling

    return SaveUserInsightResponse(success=True)


save_user_insight_tool = FunctionTool(save_user_insight)
