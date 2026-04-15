import logging
import os
from typing import Any

import googlemaps

logger = logging.getLogger(__name__)

api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
gmaps_client = None
if api_key:
    try:
        gmaps_client = googlemaps.Client(key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Google Maps client: {e}")


def find_retailer(state: dict[str, Any], location: dict) -> dict:
    """Finds the closest Volvo retailer to the specified location."""
    logger.info(f"find_retailer called with location: {location}")

    city = location.get("city", "")
    nation = location.get("nation", "")
    street = location.get("street")

    retailer_name = "Volvo Studio Stockholm"
    address = "Kungsträdgårdsgatan 10, 111 47 Stockholm, Sweden"
    retailer_id = "ChIJ7T2iO1ydX0YRr1o4J5h46OQ"
    lat = 59.330833
    lng = 18.073611

    query = f"{city}, {nation}"
    if street:
        query = f"{street}, {query}"

    state["user:location"] = location

    retailer_phone = None
    if gmaps_client:
        try:
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

                    try:
                        place_details = gmaps_client.place(
                            place_id=retailer_id,
                            fields=["formatted_phone_number"],
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
        logger.warning("Google Maps client not initialized. Using defaults.")

    retailer = {
        "id": retailer_id,
        "name": retailer_name,
        "location": {
            "city": city,
            "nation": nation,
            "street": address,
            "lat": lat,
            "lng": lng,
        },
        "phone": retailer_phone,
    }
    state["found_retailer"] = retailer

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "maps_view",
            "data": {
                "location": query,
                "retailer_name": retailer["name"],
                "address": retailer["location"]["street"],
                "retailer_id": retailer["id"],
                "retailer_lat": lat,
                "retailer_lng": lng,
            },
        },
        "agent_context": f"Found retailer: {retailer['name']} at {address}. Retailer details saved.",
    }
