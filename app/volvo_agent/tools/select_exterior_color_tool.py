import logging
from typing import Any

from ..utils import load_car_assets, load_car_configurations

logger = logging.getLogger(__name__)

CAR_CONFIGS = load_car_configurations()
CAR_ASSETS = load_car_assets()


def select_exterior_color(state: dict[str, Any], color_id: str) -> dict:
    """Selects the exterior color and returns gradient stops for the model."""
    current_config = state.get("user:car_config", {})
    model_name = current_config.get("model")

    if not model_name:
        return {"agent_context": "No model selected. Please select a model first."}

    model_config = CAR_CONFIGS.get(model_name, {})
    exteriors = model_config.get("exteriors", {})

    if color_id not in exteriors:
        return {"agent_context": f"Color {color_id} not found for model {model_name}."}

    current_config["exterior"] = color_id
    state["user:car_config"] = current_config

    logger.info(f"select_exterior_color called: model={model_name}, color={color_id}")

    selected_color_data = exteriors.get(color_id, {})
    model_images = CAR_ASSETS.get(model_name, {})
    gradient_stops = (
        model_images.get("exteriors", {}).get(color_id, {}).get("gradient_stops")
    )

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "exterior",
            "data": {
                "selected_color": {
                    "id": color_id,
                    "display_name": selected_color_data.get("display_name"),
                    "gradient_stops": gradient_stops,
                }
            },
        },
        "agent_context": f"Selected exterior color {color_id}.",
    }
