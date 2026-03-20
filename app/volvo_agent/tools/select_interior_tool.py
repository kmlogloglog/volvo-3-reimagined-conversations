import logging

from google.adk.tools import FunctionTool, ToolContext

from ..utils import load_car_assets, load_car_configurations

logger = logging.getLogger(__name__)

CAR_CONFIGS = load_car_configurations()
CAR_ASSETS = load_car_assets()


def select_interior(tool_context: ToolContext, interior_id: str) -> dict:
    """
    Selects the interior option.

    Args:
        tool_context: The tool context containing the session state.
        interior_id: The ID of the interior to select (e.g., "indigo", "charcoal").

    Returns:
        A dictionary containing the UI action to display interior selection.
    """
    current_config = tool_context.state.get("user:car_config", {})
    model_name = current_config.get("model")

    if not model_name:
        return {"agent_context": "No model selected. Please select a model first."}

    model_config = CAR_CONFIGS.get(model_name, {})
    interiors_config = model_config.get("interiors", {})
    selected_interior_data = interiors_config.get(interior_id)

    if not selected_interior_data:
        return {
            "agent_context": f"Interior {interior_id} not found for model {model_name}."
        }

    # Update session state
    current_config["interior"] = interior_id
    tool_context.state["user:car_config"] = current_config

    logger.info(f"select_interior called: model={model_name}, interior={interior_id}")

    # Fetch interior upholstery image from car_assets
    model_images = CAR_ASSETS.get(model_name, {})
    image_url = model_images.get("interiors", {}).get(interior_id, {}).get("upholstery")
    images_payload = [image_url] if image_url else []

    payload_data = {
        "id": interior_id,
        "display_name": selected_interior_data.get("display_name"),
        "description": selected_interior_data.get("description"),
    }

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "interior",
            "data": {"selected_interior": payload_data, "images": images_payload},
        },
        "agent_context": f"Selected interior {interior_id}.",
    }


select_interior_tool = FunctionTool(select_interior)
