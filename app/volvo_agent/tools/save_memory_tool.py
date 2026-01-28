from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext
from pydantic import BaseModel, Field


class SaveMemoryResponse(BaseModel):
    success: bool = Field(description="Whether the memory was saved successfully.")


async def save_memory(
    text: str, tool_context: ToolContext, category: str | None = None
) -> SaveMemoryResponse:
    """Saves a memory or insight about the user.

    Args:
        text: The text content of the memory or insight (e.g. "User likes red SUVs", "User is looking for a family car").
        tool_context: The tool context.
        category: Optional category for the memory (e.g. "preference", "profiling", "history").
    """
    metadata = {}
    if category:
        metadata["category"] = category

    # Access private attributes to get to the memory service
    # This is necessary because ToolContext doesn't expose add_memory publicly
    invocation_context = getattr(tool_context, "_invocation_context", None)

    if not invocation_context:
        raise ValueError("Invocation context is not available.")

    memory_service = getattr(invocation_context, "memory_service", None)
    if not memory_service:
        raise ValueError("Memory service is not available.")

    if hasattr(memory_service, "add_memory"):
        await memory_service.add_memory(
            app_name=invocation_context.app_name,
            user_id=invocation_context.user_id,
            text=text,
            metadata=metadata,
        )
    else:
        raise NotImplementedError(
            "The configured memory service does not support adding memories."
        )

    return SaveMemoryResponse(success=True)


save_memory_tool = FunctionTool(save_memory)
