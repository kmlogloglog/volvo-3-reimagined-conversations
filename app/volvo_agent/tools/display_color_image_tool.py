from google.adk.tools import FunctionTool
import json
from pathlib import Path

from ..enums import CarModel, Color

# Define paths to knowledge base
KNOWLEDGE_ROOT = Path(__file__).resolve().parent.parent / "knowledge"
COLOR_FILE = "colors.json"

import logging

logger = logging.getLogger(__name__)

def _get_image_url_for_color(model_name: str, color_name: str) -> str | None:
    """Helper to look up the image URL for a specific color name and car model."""
    json_path = KNOWLEDGE_ROOT / COLOR_FILE
    if not json_path.exists():
        return None
        
    try:
        with json_path.open("r", encoding="utf-8") as source:
            data = json.load(source)
            
        # Case-insensitive search for the color
        target_color = color_name.lower()
        target_model = model_name.lower()
        
        for entry in data:
            entry_model = entry.get("model", "").lower()
            entry_color = entry.get("color", "").lower()
            
            # Match both model and color
            if entry_model == target_model and entry_color == target_color:
                return entry.get("image_url")
                
        return None
    except Exception:
        return None

def display_color_image(car_model: CarModel, color: Color) -> dict:
    """
    Displays an image of the car in the specified color.

    Use this tool whenever the user asks to see a specific color or when you are 
    discussing a specific color option.

    Args:
        car_model: The model of the car (e.g. EX90).
        color: The car color to display.

    Returns:
        A dictionary containing the UI action to render the image component.
    """
    color_name = color.value if hasattr(color, 'value') else color
    model_name = car_model.value if hasattr(car_model, 'value') else car_model

    image_url = _get_image_url_for_color(model_name, color_name)
    
    if not image_url:
        return {
            "agent_context": f"Could not find an image for {color_name}."
        }
    
    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "display_color_image.html",
            "data": {
                "image_url": image_url,
                "alt_text": f"Volvo {model_name} in {color_name}",
                "caption": color_name
            }
        },
        "agent_context": f"Displayed an image of the car in {color_name}.",
    }

# Create the tool instance
display_color_image_tool = FunctionTool(display_color_image)
