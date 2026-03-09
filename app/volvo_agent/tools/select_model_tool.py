import logging
from google.adk.tools import FunctionTool, ToolContext
from ..utils import load_car_images

logger = logging.getLogger(__name__)

# Load once at module level
CAR_IMAGES = load_car_images()

def select_model(
    tool_context: ToolContext,
    model_name: str
) -> dict:
    """
    Selects the car model and returns its silhouette image to the frontend.
    
    Args:
        tool_context: The tool context containing the session state.
        model_name: The name of the model to select (e.g., "EX30", "EX60", "EX90").
        
    Returns:
        A dictionary containing the UI action to display the silhouette and the agent context.
    """
    images_data = CAR_IMAGES
    model_data = images_data.get(model_name, {})
    
    # Update session state with selected model
    # We should also reset other selections when model changes to avoid invalid states
    tool_context.state["user:car_config"] = {
        "model": model_name,
        "exterior": None,
        "interior": None,
        "wheels": None
    }
    
    logger.info(f"select_model called: model={model_name}")

    silhouette_url = model_data.get("silhouette")
    
    if not silhouette_url:
        return {
            "agent_context": f"Could not find silhouette for {model_name}."
        }

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "display_images",
            "data": {
                "images": [silhouette_url],
                "caption": f"Volvo {model_name}"
            },
            "phase": 2
        },
        "agent_context": f"Selected model {model_name}. Displaying silhouette."
    }

select_model_tool = FunctionTool(select_model)
