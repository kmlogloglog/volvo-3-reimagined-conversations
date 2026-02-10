import logging

from google.adk.tools import FunctionTool, ToolContext

from ..schemas.car import CarConfiguration

logger = logging.getLogger(__name__)


def update_config(tool_context: ToolContext, car_config: CarConfiguration) -> dict:
    """
    Updates the configuration for the car being designed.

    Use this tool whenever the user makes a choice about a feature (e.g., color, wheels, interior)
    during the configuration phase.

    Args:
        context: The tool context.
        car_config: The new car configuration to store in the state.

    Returns:
        A dictionary with the updated configuration.
    """

    tool_context.state["current_config"] = car_config

    return {"message": "Configuration saved successfully"}


# Create the tool instance
update_config_tool = FunctionTool(update_config)
