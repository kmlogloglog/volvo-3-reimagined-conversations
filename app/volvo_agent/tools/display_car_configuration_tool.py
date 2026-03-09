import logging
from google.adk.tools import FunctionTool, ToolContext
from ..utils import load_car_images

logger = logging.getLogger(__name__)

CAR_IMAGES = load_car_images()

def display_car_configuration(
    tool_context: ToolContext
) -> dict:
    """
    Displays the final car configuration with all associated images (carousel).
    
    Args:
        tool_context: The tool context containing the session state.
        
    Returns:
        A dictionary containing the UI action to display the full carousel.
    """
    current_config = tool_context.state.get("user:car_config", {})
    model_name = current_config.get("model")
    exterior = current_config.get("exterior")
    interior = current_config.get("interior")
    wheels = current_config.get("wheels")
    
    if not all([model_name, exterior, interior, wheels]):
         return {
            "agent_context": f"Configuration incomplete. Current state: {current_config}. Please complete all selections."
        }
        
    logger.info(f"display_car_configuration called: {current_config}")
    
    model_images = CAR_IMAGES.get(model_name, {})
    
    # Collect Exterior Images
    exterior_imgs = (
        model_images.get("exteriors", {})
        .get(exterior, {})
        .get(wheels, {})
    )
    
    # Collect Interior Images
    interior_imgs = model_images.get("interiors", {}).get(interior, {})
    
    images = []
    if exterior_imgs:
        images.extend(exterior_imgs.values())
    if interior_imgs:
        images.extend(interior_imgs.values())
        
    if not images:
        return {
            "agent_context": "No images found for this specific configuration."
        }

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "display_results",
            "data": {
                "images": images,
                "caption": f"Volvo {model_name} in {exterior} with {wheels} wheels and {interior} interior."
            }
        },
        "agent_context": "Displayed final configuration images."
    }

display_car_configuration_tool = FunctionTool(display_car_configuration)
