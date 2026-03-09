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
    
    # The user requested exactly 5 images: 3 exterior, 2 interior.
    # We will grab these from the "carousel" folder structure if available,
    # or fallback to the specific exterior/wheel and interior selections.
    images = []

    # 1. Collect 3 Exterior Images
    # The new carousel structure provides specific exterior shots per color
    carousels = model_images.get("carousel", {})
    exterior_carousel = carousels.get("exteriors", {}).get(exterior, {})
    
    if exterior_carousel:
        # Prefer the dedicated carousel shots
        ext_views = [exterior_carousel.get("front34"), exterior_carousel.get("side"), exterior_carousel.get("rear34")]
        images.extend([img for img in ext_views if img])
    else:
        # Fallback to the standard wheel-specific exterior shots
        fallback_exterior = model_images.get("exteriors", {}).get(exterior, {}).get(wheels, {})
        ext_views = [fallback_exterior.get("front34"), fallback_exterior.get("front"), fallback_exterior.get("side")]
        images.extend([img for img in ext_views if img])
        

    # 2. Collect 2 Interior Images
    interior_carousel = carousels.get("interiors", {}).get(interior, {})
    
    if interior_carousel:
        int_views = [interior_carousel.get("seat"), interior_carousel.get("dashboard")]
        images.extend([img for img in int_views if img])
    else:
        fallback_interior = model_images.get("interiors", {}).get(interior, {})
        int_views = [fallback_interior.get("seat"), fallback_interior.get("dashboard")]
        images.extend([img for img in int_views if img])

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
            },
            "phase": 3
        },
        "agent_context": "Displayed final configuration images."
    }

display_car_configuration_tool = FunctionTool(display_car_configuration)
