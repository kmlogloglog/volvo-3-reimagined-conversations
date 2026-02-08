import json
import logging
import difflib
from pathlib import Path
from typing import Optional, Any

from google.adk.tools import FunctionTool
from ..schemas.enums import CarModel

# Define paths to knowledge base
KNOWLEDGE_ROOT = Path(__file__).resolve().parent.parent / "knowledge"
CONFIG_FILE = "car_configurations.json"
IMAGES_FILE = "car_images.json"

logger = logging.getLogger(__name__)


def _load_json(filename: str) -> dict | None:
    path = KNOWLEDGE_ROOT / filename
    if not path.exists():
        logger.error(f"File not found at {path}")
        return None
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading {filename}: {e}")
        return None


def _fuzzy_match(query: str, items: dict[str, Any], threshold: float = 0.6) -> tuple[str, str] | None:
    """
    Matches a query string against a dictionary where keys are IDs and values are dicts 
    containing a "display_name" property.
    
    Returns (key, display_name) if a match is found.
    """
    if not query:
        return None

    query_norm = query.lower().strip()
    
    # 1. Exact match on keys
    if query_norm in items:
        return query_norm, items[query_norm].get("display_name", query_norm)

    # 2. Exact match on display names (normalized)
    for key, data in items.items():
        if data.get("display_name", "").lower() == query_norm:
            return key, data.get("display_name")

    # 3. Fuzzy match against keys
    keys = list(items.keys())
    matches = difflib.get_close_matches(query_norm, keys, n=1, cutoff=threshold)
    if matches:
        key = matches[0]
        return key, items[key].get("display_name", key)

    # 4. Fuzzy match against display names
    # Create a reverse map for lookup: display_name_lower -> key
    name_map = {}
    for key, data in items.items():
        dn = data.get("display_name", "")
        if dn:
            name_map[dn.lower()] = key

    params = list(name_map.keys())
    matches = difflib.get_close_matches(query_norm, params, n=1, cutoff=threshold)
    if matches:
        matched_name = matches[0]
        key = name_map[matched_name]
        return key, items[key].get("display_name")
        
    return None


def _get_image_data(
    model_name: str,
    color_query: str | None = None,
    interior_query: str | None = None,
    wheel_query: str | None = None
) -> dict | None:
    """
    Resolves configuration and returns a dictionary with image URL and caption.
    Returns None if no image found.
    """
    config_data = _load_json(CONFIG_FILE)
    images_data = _load_json(IMAGES_FILE)
    
    if not config_data or not images_data:
        return None

    # Resolve Model
    # We assume model_name is valid or close enough since it comes from an Enum usually.
    # But let's check exact key match first
    model_key = model_name
    if model_key not in config_data:
        # Try finding case-insensitive match
        for k in config_data.keys():
            if k.lower() == model_name.lower():
                model_key = k
                break
        else:
             logger.error(f"Model {model_name} not found in configuration.")
             return None

    model_config = config_data.get(model_key, {})
    model_images = images_data.get(model_key, {})

    # Check for Interior Request
    if interior_query:
        interiors_config = model_config.get("interiors", {})
        interiors_images = model_images.get("interiors", {})
        
        # Fuzzy match interior
        match = _fuzzy_match(interior_query, interiors_config)
        
        target_interior_key = None
        display_name = interior_query
        
        if match:
            target_interior_key, display_name = match
        else:
             # Fallback: try to pick first available or just logging?
             # If exact matching failed, maybe just try to match keys roughly?
             # For now, if no match, we can't show specific interior.
             # Let's try to pick the first one if the query was "interior" or similar generic
             if "interior" in interior_query.lower() and interiors_config:
                 target_interior_key = next(iter(interiors_config))
                 display_name = interiors_config[target_interior_key].get("display_name")

        if target_interior_key and target_interior_key in interiors_images:
            views = interiors_images[target_interior_key]
            # Pick a nice view, e.g. interior_1
            image_url = views.get("interior_1") or next(iter(views.values()), None)
            if image_url:
                return {
                    "image_url": image_url,
                    "caption": f"Volvo {model_key} {display_name}",
                    "alt_text": f"Interior view of Volvo {model_key} with {display_name}"
                }
    
    # Exterior Flow
    exteriors_config = model_config.get("exteriors", {})
    wheels_config = model_config.get("wheels", {})
    
    exteriors_images = model_images.get("exteriors", {})
    
    # Resolve Color
    target_color_key = None
    color_name = "Default Color"
    
    if color_query:
        match = _fuzzy_match(color_query, exteriors_config)
        if match:
            target_color_key, color_name = match
    
    # If no color resolved, pick first available
    if not target_color_key and exteriors_config:
        target_color_key = next(iter(exteriors_config))
        color_name = exteriors_config[target_color_key].get("display_name")

    if not target_color_key or target_color_key not in exteriors_images:
        logger.warning(f"Color {target_color_key} not found in images for {model_key}")
        return None

    color_images_node = exteriors_images[target_color_key]
    # Structure is color -> wheels -> wheel_id -> views
    
    available_wheels_in_images = color_images_node.get("wheels", {})
    
    # Resolve Wheel
    target_wheel_key = None
    wheel_name = ""
    
    if wheel_query:
        match = _fuzzy_match(wheel_query, wheels_config)
        if match:
            target_wheel_key, wheel_name = match
            
    # If no wheel resolved or resolved wheel not in images for this color
    if (not target_wheel_key) or (str(target_wheel_key) not in available_wheels_in_images):
        # Pick first available matching wheel in images
        if available_wheels_in_images:
             # Try to prefer a "standard" wheel if possible, or just first
             target_wheel_key = next(iter(available_wheels_in_images))
             # Update name
             if str(target_wheel_key) in wheels_config:
                 wheel_name = wheels_config[str(target_wheel_key)].get("display_name")
             else:
                 wheel_name = f"Wheel {target_wheel_key}"

    if not target_wheel_key:
         return None

    # Get Views
    wheel_views = available_wheels_in_images.get(str(target_wheel_key), {})
    image_url = wheel_views.get("front_side_view") or wheel_views.get("front_view") or next(iter(wheel_views.values()), None)
    
    if not image_url:
        return None

    caption = f"Volvo {model_key} in {color_name}"
    if wheel_name:
        caption += f" with {wheel_name}"

    return {
        "image_url": image_url,
        "caption": caption,
        "alt_text": caption
    }


def display_model_image(
    car_model: CarModel,
    color: Optional[str] = None,
    interior: Optional[str] = None,
    wheel: Optional[str] = None
) -> dict:
    """
    Displays an image of the specified car model with optional configuration.
    
    Args:
        car_model: The model of the car (EX90, EX30, EX60).
        color: Optional exterior color description (e.g. "red", "platinum grey").
        interior: Optional interior description. If provided, likely shows interior view.
        wheel: Optional wheel description.

    Returns:
        UI action dictionary.
    """
    model_name = car_model.value if hasattr(car_model, "value") else car_model
    logger.info(f"display_model_image called: model={model_name}, color={color}, interior={interior}, wheel={wheel}")

    result = _get_image_data(model_name, color, interior, wheel)

    if not result:
         return {"agent_context": f"Could not find an image for {model_name} with the specified configuration."}

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "display_model_image.html",
            "data": {
                "image_url": result["image_url"],
                "alt_text": result["alt_text"],
                "caption": result["caption"],
            },
        },
        "agent_context": f"Displayed an image of {result['caption']}.",
    }


display_model_image_tool = FunctionTool(display_model_image)
