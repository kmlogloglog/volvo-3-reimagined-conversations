import logging
import os

import googlemaps
from google.adk.tools import FunctionTool, ToolContext

from ..schemas.test_drive import Location, Retailer
from ..utils import get_secret

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


def find_retailer(tool_context: ToolContext, location: Location) -> dict:
    """
    Finds the closest Volvo retailer to the specified location.

    Use this tool when the user provides their location (city/nation) to find where they can
    take a test drive.

    Args:
        tool_context: The tool context.
        location: The user's location details.

    Returns:
        A dictionary containing the UI action to display the map/retailer info and the Retailer object.
    """
    logger.info(f"Tool find_retailer called with location: {location}")

    # Defaults in case the API is not set up correctly
    retailer_name = "Volvo Studio Stockholm"
    address = "Kungsträdgårdsgatan 10, 111 47 Stockholm, Sweden"
    retailer_id = "ChIJ7T2iO1ydX0YRr1o4J5h46OQ"
    lat = 59.330833
    lng = 18.073611

    query = f"{location.city}, {location.nation}"
    if location.street:
        query = f"{location.street}, {query}"

    tool_context.state["user:location"] = location.model_dump()

    retailer_phone = None
    if gmaps_client:
        try:
            # First try geocoding the specific query
            geocode_result = gmaps_client.geocode(query)
            if geocode_result:
                latlng = geocode_result[0]["geometry"]["location"]
                places_result = gmaps_client.places_nearby(
                    location=latlng, radius=50000, keyword="Volvo cars dealer"
                )
                if places_result and places_result.get("results"):
                    first_result = places_result["results"][0]
                    retailer_name = first_result.get("name", retailer_name)
                    address = first_result.get("vicinity", address)
                    retailer_id = first_result.get("place_id", retailer_id)
                    lat = first_result["geometry"]["location"]["lat"]
                    lng = first_result["geometry"]["location"]["lng"]

                    # Fetch phone number for the found retailer
                    try:
                        place_details = gmaps_client.place(
                            place_id=retailer_id, fields=["formatted_phone_number"]
                        )
                        if place_details and "result" in place_details:
                            retailer_phone = place_details["result"].get(
                                "formatted_phone_number"
                            )
                    except Exception as e:
                        logger.error(f"Error fetching place details: {e}")
        except Exception as e:
            logger.error(f"Error fetching from Google Maps API: {e}")
    else:
        logger.warning(
            "Google Maps client is not initialized. Using default retailer data."
        )

    # Construct Retailer object
    retailer = Retailer(
        id=retailer_id,
        name=retailer_name,
        location=Location(
            city=location.city,  # simplified, ideally would parse from address
            nation=location.nation,
            street=address,
            lat=lat,
            lng=lng,
        ),
        phone=retailer_phone,
    )

    tool_context.state["found_retailer"] = retailer.model_dump()

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "maps_view",
            "data": {
                "location": query,
                "retailer_name": retailer.name,
                "address": retailer.location.street,
                "retailer_id": retailer.id,
                "retailer_lat": retailer.location.lat,
                "retailer_lng": retailer.location.lng,
            },
            "phase": 4
        },
        "agent_context": f"Found retailer: {retailer.name} at {retailer.location.street}. Retailer details saved.",
    }


# Create the tool instance
find_retailer_tool = FunctionTool(find_retailer)
