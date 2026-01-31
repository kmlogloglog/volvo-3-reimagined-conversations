import json
import logging
from pathlib import Path

from google.adk.tools import FunctionTool

from ..enums import CarModel, InteriorType

# Define paths to knowledge base
KNOWLEDGE_ROOT = Path(__file__).resolve().parent.parent / "knowledge"
INTERIORS_FILE = "interiors.json"

logger = logging.getLogger(__name__)


def _get_image_url_for_interior(interior_name: str) -> str | None:
    """Helper to look up the image URL for a specific interior name."""
    json_path = KNOWLEDGE_ROOT / INTERIORS_FILE
    logger.info(f"Looking for interior '{interior_name}' in {json_path}")

    if not json_path.exists():
        logger.error(f"Interiors file not found at {json_path}")
        return None

    try:
        with json_path.open("r", encoding="utf-8") as source:
            data = json.load(source)

        target = interior_name.lower()

        for entry in data:
            if entry.get("interior", "").lower() == target:
                logger.info(
                    f"Found exact match for '{interior_name}': {entry.get('interior')}"
                )
                return entry.get("image_url")

        logger.warning(f"No match found for interior '{interior_name}'")
        return None
    except Exception as e:
        logger.error(f"Error reading interiors file: {e}")
        return None


def display_interior_image(car_model: CarModel, interior_type: InteriorType) -> dict:
    """
    Displays an image of the car in the specified interior.

    Use this tool whenever the user asks to see a specific interior or when you are
    discussing a specific interior option.

    Args:
        car_model: The model of the car (e.g. EX90).
        interior_type: The interior type to display.

    Returns:
        A dictionary containing the UI action to render the image component.
    """
    # Handle string inputs (if LLM/ADK passes just the value as string)
    interior_name = (
        interior_type.value if hasattr(interior_type, "value") else interior_type
    )
    model_name = car_model.value if hasattr(car_model, "value") else car_model

    image_url = _get_image_url_for_interior(interior_name)

    if not image_url:
        return {"agent_context": f"Could not find an image for {interior_name}."}

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "display_interior_image.html",
            "data": {
                "image_url": image_url,
                "alt_text": f"Volvo {model_name} in {interior_name}",
                "caption": interior_name,
            },
        },
        "agent_context": f"Displayed an image of the car in {interior_name}.",
    }


# Create the tool instance
display_interior_image_tool = FunctionTool(display_interior_image)
