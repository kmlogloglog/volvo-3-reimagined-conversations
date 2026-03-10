import logging
from google.adk.tools import FunctionTool, ToolContext
from ..utils import load_car_configurations, load_car_images

logger = logging.getLogger(__name__)

CAR_CONFIGS = load_car_configurations()
CAR_IMAGES = load_car_images()

def select_wheel(
    tool_context: ToolContext,
    wheel_id: str
) -> dict:
    """
    Selects the wheel option.
    
    Args:
        tool_context: The tool context containing the session state.
        wheel_id: The ID of the wheel to select (e.g., "19_5", "21").
        
    Returns:
        A dictionary containing the UI action to display wheel selection.
    """
    current_config = tool_context.state.get("user:car_config", {})
    model_name = current_config.get("model")
    
    if not model_name:
         return {
            "agent_context": "No model selected. Please select a model first."
        }

    model_config = CAR_CONFIGS.get(model_name, {})
    wheels_config = model_config.get("wheels", {})
    selected_wheel_data = wheels_config.get(wheel_id)

    if not selected_wheel_data:
         return {
            "agent_context": f"Wheel {wheel_id} not found for model {model_name}."
        }

    # Update session state
    current_config["wheels"] = wheel_id
    tool_context.state["user:car_config"] = current_config
    
    logger.info(f"select_wheel called: model={model_name}, wheel={wheel_id}")
    
    # Fetch wheel image specifically from car_images
    model_images = CAR_IMAGES.get(model_name, {})
    wheel_closeups = model_images.get("wheel_closeups", {})

    image_url = wheel_closeups.get(wheel_id)
    images_payload = [image_url] if image_url else []
    
    payload_data = {
        "id": wheel_id,
        "display_name": selected_wheel_data.get("display_name"),
        "description": selected_wheel_data.get("description"),
        "dimension": selected_wheel_data.get("dimension")
    }

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "wheels",
            "data": {
                "selected_wheel": payload_data,
                "images": images_payload
            }
        },
        "agent_context": f"Selected wheel {wheel_id}."
    }

select_wheel_tool = FunctionTool(select_wheel)
