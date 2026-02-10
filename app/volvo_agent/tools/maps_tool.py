import logging

from google.adk.tools import FunctionTool

logger = logging.getLogger(__name__)


def maps_tool(location: str) -> dict:
    """
    Finds the closest Volvo retailer to the specified location.

    Use this tool when the user provides their location or city to find where they can
    take a test drive.

    Args:
        location: The user's city or location (e.g. "Gothenburg", "London").

    Returns:
        A dictionary containing the UI action to display the map/retailer info.
    """
    logger.info(f"Tool maps_tool called with location: {location}")
    # Mock implementation for now
    retailer_name = f"Volvo Retailer {location.title()}"

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "maps_view.html",  # Assuming a component for this
            "data": {
                "location": location,
                "retailer_name": retailer_name,
                "address": f"123 Volvo Way, {location.title()}",
            },
        },
        "agent_context": f"Found closest retailer: {retailer_name} in {location}.",
    }


# Create the tool instance
maps_tool_instance = FunctionTool(maps_tool)
