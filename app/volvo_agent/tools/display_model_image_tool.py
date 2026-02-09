import json
import logging
from pathlib import Path
from typing import Optional, Any, Literal

from google.adk.tools import FunctionTool, ToolContext
from ..schemas.car import CarConfiguration
from ..utils import load_car_configurations, load_car_images

logger = logging.getLogger(__name__)


def _get_image_data_from_config(config: CarConfiguration) -> dict | None:
    """
    Resolves configuration and returns a dictionary with image URL and caption using CarConfiguration.
    """
    images_data = load_car_images()
    config_data = load_car_configurations()

    model_key = config.model
    exterior_key = config.exterior
    interior_key = config.interior
    wheels_key = config.wheels

    model_images = images_data.get(model_key, {})
    model_config = config_data.get(model_key, {})

    exterior_images = model_images.get("exteriors", {}).get(exterior_key, {}).get("wheels", {}).get(wheels_key, {})
    # exterior_images is a dictionary where each key is associated to an URL of an image:
    #   brand_view_1 - Photo of the vehicle with a branded background
    #   brand_view_2 - Photo of the vehicle with a branded background
    #   brand_view_3 - Photo of the vehicle with a branded background
    #   front_side_view - Photo of the vehicle from the front-side
    #   front_view - Photo of the vehicle from the front
    #   left_side_view - Photo of the vehicle from the left side
    #   rear_side_view - Photo of the vehicle from the side rear
    #   rear_view - Photo of the vehicle from the rear
    #   wheel_view - Photo of the vehicle centered around the wheel

    interior_images = model_images.get("interiors", {}).get(interior_key, {})
    # interior_images is a dictionary where each key is associated to an URL of an image:
    #   dashboard_view - Photo of the vehicle front dashboad
    #   fabric_close_up_view - Photo of the fabric used for the seats up close
    #   fabric_view - Photo of the fabric used for the seats
    #   gear_shift_view - Photo of the gear shift and separator between the two front seats
    #   glovebox_view - Photo of the view from the front passenger seat
    #   illumination_view - Photo of the interior illumination
    #   seats_view_front - Photo of the interior seats from the front
    #   seats_view_side - Photo of the interior seats from the side
    #   steering_wheel_view - Photo of the steering wheel
    
    exterior_metadata = model_config.get("exteriors", {}).get(exterior_key, {})
    # exterior_config should contain the display_name and description of the selected exterior configuration
    interior_metadata = model_config.get("interiors", {}).get(interior_key, {})
    # interior_config should contain the display_name and description of the selected interior configurations
    wheels_metadata = model_config.get("wheels", {}).get(wheels_key, {})

    if not exterior_images or not interior_images or not exterior_metadata or not interior_metadata:
        return None  

    return {
        "exterior_images": exterior_images,
        "interior_images": interior_images,
        "exterior_metadata": exterior_metadata,
        "interior_metadata": interior_metadata,
        "wheels_metadata": wheels_metadata,
    }

def display_model_image(
    tool_context: ToolContext,
    car_config: CarConfiguration,
    detail: Literal["ALL","EXTERIOR","INTERIOR","WHEELS","BRAND"]
) -> dict:
    """
    Displays one or more images of the specified car configuration and
    updates the current configuration in the session state.
    
    Args:
        context: The tool context containing the session state.
        car_config: The car configuration that needs to be displayed.
        detail: The specific images of the car. Valid options are
            "ALL" for displaying all images available,
            "EXTERIOR" to show the outer color of the car
            "INTERIOR" to show the interior of the car
            "WHEELS" to show an image of the wheel in the selected configuration
            "BRAND" to show multiple exterior images of the car on a branded background

    Returns:
        UI action dictionary.
    """
    model_name = car_config.model
    exterior = car_config.exterior
    interior = car_config.interior
    wheels = car_config.wheels

    tool_context.state["current_config"] = car_config

    logger.info(f"display_model_image called: model={model_name}, exterior={exterior}, interior={interior}, wheels={wheels}")

    image_data = _get_image_data_from_config(car_config)

    if not image_data:
         return {"agent_context": f"Could not find any images for {model_name} with the specified configuration."}

    exterior_display_name = image_data.get("exterior_metadata", {}).get("display_name", "")
    interior_display_name = image_data.get("interior_metadata", {}).get("display_name", "")
    wheels_display_name = image_data.get("wheels_metadata", {}).get("display_name", "")
    
    images = []
    
    if detail == "ALL":
        images.extend(image_data.get("exterior_images", {}).values())
        images.extend(image_data.get("interior_images", {}).values())
        caption = f"Volvo {model_name} in {exterior_display_name} with {wheels_display_name} wheels and {interior_display_name}"
    elif detail == "EXTERIOR":
        images.extend(image_data.get("exterior_images", {}).values())
        caption = f"Volvo {model_name} in {exterior_display_name} with {wheels_display_name} wheels"
    elif detail == "INTERIOR":
        images.extend(image_data.get("interior_images", {}).values())
        caption = f"Volvo {model_name} with {interior_display_name}"
    elif detail == "WHEELS":
        images.append(image_data.get("exterior_images", {}).get("wheel_view", ""))
        caption = wheels_display_name
    elif details == "BRAND":
        images.append(image_data.get("exterior_images", {}).get("brand_view_1", ""))
        images.append(image_data.get("exterior_images", {}).get("brand_view_2", ""))
        images.append(image_data.get("exterior_images", {}).get("brand_view_3", ""))
        caption = f"Volvo {model_name} in {exterior_display_name} with {wheels_display_name} wheels and {interior_display_name}"

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "display_images",
            "data": {
                "images": images,
                "caption": caption,
            },
        },
        "agent_context": f"Displayed images of the {caption}.",
    }


display_model_image_tool = FunctionTool(display_model_image)
