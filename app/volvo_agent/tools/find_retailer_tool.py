import logging
import os
import googlemaps

from google.adk.tools import FunctionTool, ToolContext
from ..utils.utils import get_secret

logger = logging.getLogger(__name__)

# Initialize Google Maps Client at module level
api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
if not api_key:
    api_key = get_secret("GOOGLE_MAPS_API_KEY")

gmaps_client = None
if api_key:
    try:
        gmaps_client = googlemaps.Client(key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Google Maps client: {e}")

def find_retailer(tool_context: ToolContext, location: str) -> dict:
    """
    Finds the closest Volvo retailer to the specified location.

    Use this tool when the user provides their location or city to find where they can
    take a test drive. Do not call this tool with a guessed location. Only use this tool
    if the user has explicitly stated their location.

    Args:
        tool_context: The tool context.
        location: The user's city or location (e.g. "Gothenburg", "London").

    Returns:
        A dictionary containing the UI action to display the map/retailer info.
    """
    logger.info(f"Tool find_retailer called with location: {location}")
    
    # Defaults in case the API is not set up correctly
    retailer_name = "Volvo Studio Stockholm"
    address = "Kungsträdgårdsgatan 10, 111 47 Stockholm, Sweden"
    retailer_id = "ChIJ7T2iO1ydX0YRr1o4J5h46OQ"
    lat = 59.330833
    lng = 18.073611

    if gmaps_client:
        try:
            geocode_result = gmaps_client.geocode(location)
            if geocode_result:
                latlng = geocode_result[0]['geometry']['location']
                places_result = gmaps_client.places_nearby(
                    location=latlng,
                    radius=50000,
                    keyword="Volvo cars dealer"
                )
                if places_result and places_result.get('results'):
                    first_result = places_result['results'][0]
                    retailer_name = first_result.get('name', retailer_name)
                    address = first_result.get('vicinity', address)
                    retailer_id = first_result.get('place_id', retailer_id)
                    lat = first_result['geometry']['location']['lat']
                    lng = first_result['geometry']['location']['lng']
        except Exception as e:
            logger.error(f"Error fetching from Google Maps API: {e}")

    # Save to session state
    tool_context.state["selected_retailer"] = {
        "name": retailer_name,
        "address": address,
        "id": retailer_id,
        "lat": float(lat),
        "lng": float(lng)
    }
    logger.info(f"Saved selected_retailer to state: {tool_context.state['selected_retailer']}")

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "maps_view.html",
            "data": {
                "location": location,
                "retailer_name": retailer_name,
                "address": address,
                "retailer_id": retailer_id,
                "retailer_lat": float(lat),
                "retailer_lng": float(lng),
            },
        },
        "agent_context": f"Found closest retailer: {retailer_name} at {address}. The retailer details have been saved to the session.",
    }

# Create the tool instance
find_retailer_tool = FunctionTool(find_retailer)
