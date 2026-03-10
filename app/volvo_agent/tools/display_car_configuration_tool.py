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
    
    # 1. Collect 3 Exterior Images
    exterior_data = model_images.get("exteriors", {}).get(exterior, {}).get(wheels, {})
    
    # Try the dedicated carousel folder first if available
    carousel_ext_config = model_images.get("carousel", {}).get("exteriors", {}).get(exterior, {})
    if carousel_ext_config:
        exterior_data = carousel_ext_config
        
    ext_views = [
        exterior_data.get("front34"), 
        exterior_data.get("front") or exterior_data.get("side"), # Carousel uses side instead of front 
        exterior_data.get("rear34") or exterior_data.get("front34_close") # Carousel uses rear34 instead of front34_close
    ]
    
    # Check if 'side'/'rear34' is None and 'front34_close' exists, use it instead (for EX30/EX90)
    if not ext_views[2] and exterior_data.get("front34_close"):
        ext_views[2] = exterior_data.get("front34_close")

    images = [img for img in ext_views if img]

    # 2. Collect 2 Interior Images
    # Handle either "interiors" or "Interiors" folder capitalization
    model_int_config = model_images.get("interiors", model_images.get("Interiors", {}))
    
    # Try the dedicated carousel folder first if available
    carousel_int_config = model_images.get("carousel", {}).get("interiors", {})
    if carousel_int_config:
        model_int_config = carousel_int_config
        
    interior_key = interior
    for key in model_int_config:
        if key.lower() in interior.lower() or interior.lower() in key.lower():
            interior_key = key
            break
            
    interior_data = model_int_config.get(interior_key, {})
    int_views = [
        interior_data.get("dashboard"), 
        interior_data.get("seat")
    ]
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
