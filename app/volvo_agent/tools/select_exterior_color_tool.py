import logging
from google.adk.tools import FunctionTool, ToolContext
from ..utils import load_car_configurations, load_car_images

logger = logging.getLogger(__name__)

# Load once at module level
CAR_CONFIGS = load_car_configurations()
CAR_IMAGES = load_car_images()

def select_exterior_color(
    tool_context: ToolContext,
    color_id: str
) -> dict:
    """
    Selects the exterior color and returns ALL gradient stops for the model.
    
    Args:
        tool_context: The tool context containing the session state.
        color_id: The ID of the color to select (e.g., "cloud_blue", "onyx_black").
        
    Returns:
        A dictionary containing the UI action to display the color selector with ALL gradients.
    """
    current_config = tool_context.state.get("user:car_config", {})
    model_name = current_config.get("model")
    
    if not model_name:
         return {
            "agent_context": "No model selected. Please select a model first."
        }

    # Update session state
    current_config["exterior"] = color_id
    tool_context.state["user:car_config"] = current_config
    
    logger.info(f"select_exterior_color called: model={model_name}, color={color_id}")
    
    model_config = CAR_CONFIGS.get(model_name, {})
    exteriors = model_config.get("exteriors", {})
    
    # Check if selected color exists (validation)
    if color_id not in exteriors:
        return {
            "agent_context": f"Color {color_id} not found for model {model_name}."
        }
        
    # Return only the selected color with its gradients
    selected_color_data = exteriors.get(color_id, {})
    payload_data = {
        "id": color_id,
        "display_name": selected_color_data.get("display_name"),
        "gradient_stops": selected_color_data.get("gradient_stops")
    }

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "display_color_selector",
            "data": {
                "selected_color": payload_data
            },
            "phase": 3
        },
        "agent_context": f"Selected exterior color {color_id}."
    }

select_exterior_color_tool = FunctionTool(select_exterior_color)
