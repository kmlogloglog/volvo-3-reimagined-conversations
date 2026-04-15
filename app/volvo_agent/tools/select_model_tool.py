import logging
from typing import Any

from ..utils import load_car_assets

logger = logging.getLogger(__name__)

CAR_ASSETS = load_car_assets()


def select_model(state: dict[str, Any], model_name: str) -> dict:
    """Selects the car model and returns its silhouette image."""
    model_data = CAR_ASSETS.get(model_name, {})

    if model_name not in CAR_ASSETS:
        return {"agent_context": f"Model {model_name} not found in configuration data."}

    state["user:car_config"] = {
        "model": model_name,
        "exterior": None,
        "interior": None,
        "wheels": None,
    }

    logger.info(f"select_model called: model={model_name}")

    silhouette_url = model_data.get("silhouette")
    if not silhouette_url:
        return {"agent_context": f"Could not find silhouette for {model_name}."}

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "model",
            "data": {"images": [silhouette_url], "caption": f"Volvo {model_name}"},
        },
        "agent_context": f"Selected model {model_name}. Displaying silhouette.",
    }
