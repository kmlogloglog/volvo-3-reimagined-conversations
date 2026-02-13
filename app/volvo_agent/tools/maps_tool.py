import logging
import os
import googlemaps
from google.cloud import secretmanager

from google.adk.tools import FunctionTool

logger = logging.getLogger(__name__)

def get_secret(secret_id: str, version_id: str = "latest") -> str | None:
    """Fetch the secret payload from GCP Secret Manager."""
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "vml-map-xd-volvo")
    try:
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        logger.error(f"Failed to fetch secret {secret_id}: {e}")
        return None

def maps_tool(location: str) -> dict:
    """
    Finds the closest Volvo retailer to the specified location.

    Use this tool when the user provides their location or city to find where they can
    take a test drive.

    Args:
        location: The user's city or location (e.g. "Gothenburg", "London").

    Returns:
        A dictionary containing the UI action to display the map/retailer info.
    """
    logger.info(f"Tool maps_tool called with location: {location}")
    
    # Try getting API key from environment first (local override), then Secret Manager.
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        api_key = get_secret("GOOGLE_MAPS_API_KEY")
    
    # Defaults in case the API is not set up correctly
    retailer_name = "Volvo Studio Stockholm"
    address = "Kungsträdgårdsgatan 10, 111 47 Stockholm, Sweden"
    retailer_id = "ChIJ7T2iO1ydX0YRr1o4J5h46OQ"
    lat = 59.330833
    lng = 18.073611

    if api_key:
        try:
            gmaps = googlemaps.Client(key=api_key)
            geocode_result = gmaps.geocode(location)
            if geocode_result:
                latlng = geocode_result[0]['geometry']['location']
                places_result = gmaps.places_nearby(
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
        "agent_context": f"Found closest retailer: {retailer_name} at {address} (ID: {retailer_id}, Lat: {lat}, Lng: {lng}). Save the exact retailer_name, address, retailer_lat, and retailer_lng to pass them into the book_test_drive_tool later, explicitly ask for the user's preferred date and time to check availability.",
    }

# Create the tool instance
maps_tool_instance = FunctionTool(maps_tool)
