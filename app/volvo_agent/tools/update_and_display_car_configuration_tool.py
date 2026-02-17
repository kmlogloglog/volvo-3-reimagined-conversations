import logging
from typing import Literal

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

    exterior_images = (
        model_images.get("exteriors", {})
        .get(exterior_key, {})
        .get("wheels", {})
        .get(wheels_key, {})
    )
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
    #   dashboard_view - Photo of the vehicle front dashboard
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

    if (
        not exterior_images
        or not interior_images
        or not exterior_metadata
        or not interior_metadata
    ):
        return None

    return {
        "exterior_images": exterior_images,
        "interior_images": interior_images,
        "exterior_metadata": exterior_metadata,
        "interior_metadata": interior_metadata,
        "wheels_metadata": wheels_metadata,
    }


def update_and_display_car_configuration(
    tool_context: ToolContext,
    car_config: CarConfiguration,
    display_type: Literal["ALL", "EXTERIOR", "INTERIOR", "WHEELS", "BRAND", "NONE"],
    phase: int,
) -> dict:
    """
    Updates the car configuration in the session state and optionally sends a payload to the frontend to display one or more images of the specified car configuration.
    Args:
        tool_context: The tool context containing the session state.
        car_config: The car configuration that needs to be displayed.
        display_type: The type of images to display. Valid options are
            ALL - Display all images of the car
            EXTERIOR - Display exterior images of the car
            INTERIOR - Display interior images of the car
            WHEELS - Display wheel images of the car
            BRAND - Display exterior images of the car on a branded background
            NONE - Do not display any images and just update the configuration in the session state
        phase: The specific phase of the car configuration process. Valid options are integers from 1 to 5.
    Returns:
        A dictionary containing the UI action to display the images and the agent context.
    """
    if isinstance(car_config, dict):
        try:
            car_config = CarConfiguration(**car_config)
        except Exception as e:
            logger.error(f"Error parsing car_config: {e}")
            return {"agent_context": f"Invalid configuration details provided. {str(e)}"}
            
    # Validate phase
    if not isinstance(phase, int) or not (1 <= phase <= 5):
        raise ValueError("Phase must be an integer between 1 and 5.")

    model_name = car_config.model
    exterior = car_config.exterior
    interior = car_config.interior
    wheels = car_config.wheels

    tool_context.state["user:car_config"] = car_config

    logger.info(
        f"update_config_and_display_model_image called: model={model_name}, exterior={exterior}, interior={interior}, wheels={wheels}"
    )

    image_data = _get_image_data_from_config(car_config)

    if not image_data:
        return {
            "agent_context": f"Could not find any images for {model_name} with the specified configuration."
        }

    exterior_display_name = image_data.get("exterior_metadata", {}).get(
        "display_name", ""
    )
    interior_display_name = image_data.get("interior_metadata", {}).get(
        "display_name", ""
    )
    wheels_display_name = image_data.get("wheels_metadata", {}).get("display_name", "")

    images = []
    caption = f"Volvo {model_name}"

    if display_type == "ALL":
        images.extend(image_data.get("exterior_images", {}).values())
        images.extend(image_data.get("interior_images", {}).values())
        caption = f"{caption} in {exterior_display_name} with {wheels_display_name} wheels and {interior_display_name}"
    elif display_type == "EXTERIOR":
        images.extend(image_data.get("exterior_images", {}).values())
        caption = f"{caption} in {exterior_display_name} with {wheels_display_name} wheels"
    elif display_type == "INTERIOR":
        images.extend(image_data.get("interior_images", {}).values())
        caption = f"{caption} with {interior_display_name}"
    elif display_type == "WHEELS":
        images.append(image_data.get("exterior_images", {}).get("wheel_view", ""))
        caption = wheels_display_name
    elif display_type == "BRAND":
        images.append(image_data.get("exterior_images", {}).get("brand_view_1", ""))
        images.append(image_data.get("exterior_images", {}).get("brand_view_2", ""))
        images.append(image_data.get("exterior_images", {}).get("brand_view_3", ""))
        caption = f"{caption} in {exterior_display_name} with {wheels_display_name} wheels and {interior_display_name}"

    payload = {
        "ui_action": {
            "action": "display_component",
            "component_name": "display_images",
            "data": {
                "images": images,
                "caption": caption,
            },
            "phase": phase,
        },
        "agent_context": f"Configuration updated to {car_config.model} {car_config.exterior} {car_config.interior} {car_config.wheels} and images displayed to the user.",
    }

    if display_type == "NONE" or phase is None:
        payload = {
            "agent_context": f"Configuration updated to {car_config.model} {car_config.exterior} {car_config.interior} {car_config.wheels} and no images displayed to the user.",
        }
    
    return payload


update_and_display_car_configuration_tool = FunctionTool(update_and_display_car_configuration)
