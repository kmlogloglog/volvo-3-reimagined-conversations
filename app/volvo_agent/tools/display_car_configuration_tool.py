import logging
from typing import Any

from ..utils import load_car_assets

logger = logging.getLogger(__name__)

CAR_ASSETS = load_car_assets()


def display_car_configuration(state: dict[str, Any]) -> dict:
    """Displays the final car configuration with all associated images (carousel)."""
    current_config = state.get("user:car_config", {})
    model_name = current_config.get("model")
    exterior = current_config.get("exterior")
    interior = current_config.get("interior")
    wheels = current_config.get("wheels")

    if not all([model_name, exterior, interior, wheels]):
        return {
            "agent_context": f"Configuration incomplete. Current state: {current_config}. Please complete all selections."
        }

    logger.info(f"display_car_configuration called: {current_config}")

    model_images = CAR_ASSETS.get(model_name, {})

    exterior_data = (
        model_images.get("exteriors", {})
        .get(exterior, {})
        .get("wheels", {})
        .get(wheels, {})
    )
    ext_views = [
        exterior_data.get("front34"),
        exterior_data.get("front"),
        exterior_data.get("front34_close"),
    ]
    images = [img for img in ext_views if img]

    model_int_config = model_images.get("interiors", {})
    interior_data = model_int_config.get(interior, {})
    int_views = [interior_data.get("dashboard"), interior_data.get("seat")]
    images.extend([img for img in int_views if img])

    if not images:
        return {"agent_context": "No images found for this specific configuration."}

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "final_configuration",
            "data": {
                "images": images,
                "caption": f"Volvo {model_name} in {exterior} with {wheels} wheels and {interior} interior.",
            },
        },
        "agent_context": "Displayed final configuration images.",
    }
