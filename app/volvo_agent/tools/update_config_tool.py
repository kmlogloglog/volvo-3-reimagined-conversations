import logging
from google.adk.tools import FunctionTool

logger = logging.getLogger(__name__)

def update_config(feature: str, value: str) -> dict:
    """
    Updates the configuration for the car being designed.

    Use this tool whenever the user makes a choice about a feature (e.g., color, wheels, interior)
    during the configuration phase.

    Args:
        feature: The name of the feature being updated (e.g., "Exterior Color", "Wheels", "Interior").
        value: The value chosen by the user (e.g., "Onyx Black", "21' 8-Spoke Aero", "Cardamom Quilted").

    Returns:
        A dictionary containing the UI action to update the configuration view.
    """
    logger.info(f"Tool update_config called with feature: {feature}, value: {value}")
    # In a real implementation, this might persist to a database or session store.
    # For now, it returns a UI action to update the frontend state/display.
    
    return {
        "ui_action": {
            "action": "update_config", # This action type should be handled by the frontend
            "data": {
                "feature": feature,
                "value": value
            }
        },
        "agent_context": f"Updated configuration: {feature} is now {value}.",
    }

# Create the tool instance
update_config_tool = FunctionTool(update_config)
