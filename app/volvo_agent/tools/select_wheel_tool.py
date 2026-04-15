import logging
from typing import Any

from ..utils import load_car_assets, load_car_configurations

logger = logging.getLogger(__name__)

CAR_CONFIGS = load_car_configurations()
CAR_ASSETS = load_car_assets()


def select_wheel(state: dict[str, Any], wheel_id: str) -> dict:
    """Selects the wheel option."""
    current_config = state.get("user:car_config", {})
    model_name = current_config.get("model")

    if not model_name:
        return {"agent_context": "No model selected. Please select a model first."}

    model_config = CAR_CONFIGS.get(model_name, {})
    wheels_config = model_config.get("wheels", {})
    selected_wheel_data = wheels_config.get(wheel_id)

    if not selected_wheel_data:
        return {"agent_context": f"Wheel {wheel_id} not found for model {model_name}."}

    current_config["wheels"] = wheel_id
    state["user:car_config"] = current_config

    logger.info(f"select_wheel called: model={model_name}, wheel={wheel_id}")

    model_images = CAR_ASSETS.get(model_name, {})
    wheel_closeups = model_images.get("wheels", {})
    image_url = wheel_closeups.get(wheel_id)
    images_payload = [image_url] if image_url else []

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "wheels",
            "data": {
                "selected_wheel": {
                    "id": wheel_id,
                    "display_name": selected_wheel_data.get("display_name"),
                    "description": selected_wheel_data.get("description"),
                    "dimension": selected_wheel_data.get("dimension"),
                },
                "images": images_payload,
            },
        },
        "agent_context": f"Selected wheel {wheel_id}.",
    }
