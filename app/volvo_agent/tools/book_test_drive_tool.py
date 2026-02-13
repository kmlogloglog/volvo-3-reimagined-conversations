import logging

from google.adk.tools import FunctionTool

logger = logging.getLogger(__name__)


def book_test_drive(
    first_name: str,
    email: str,
    location: str,
    preferred_date_time: str,
    retailer_name: str = "",
    retailer_address: str = "",
    retailer_id: str = "",
    retailer_lat: float = 0.0,
    retailer_lng: float = 0.0,
    height: str = "",
    music_preference: str = "",
    ambience_preference: str = "",
    action: str = "book",
) -> dict:
    """
    Checks availability or submits a test drive booking request for the user's configured Volvo.

    Use this tool either to check the availability of a retailer at a specific date and time,
    or to actually book the test drive after availability has been checked and the user has
    provided their name and email. Make sure to call this tool if the action is merely checking
    the date/time for availability, providing only the necessary arguments.

    Args:
        first_name: The user's first name. Empty string if just checking availability.
        email: The user's email address. Empty string if just checking availability.
        location: The user's general location.
        preferred_date_time: The user's preferred date and time for the test drive.
        retailer_name: The name of the specific retailer.
        retailer_address: The exact physical address of the specific retailer.
        retailer_id: The ID of the retailer obtained from the maps tool.
        retailer_lat: Latitude of the retailer obtained from the maps tool.
        retailer_lng: Longitude of the retailer obtained from the maps tool.
        height: (Optional) The user's height for seat pre-adjustment.
        music_preference: (Optional) The user's preferred music.
        ambience_preference: (Optional) The user's preferred mood lighting.
        action: Either "check_availability" or "book".

    Returns:
        A dictionary containing the UI action for the booking confirmation.
    """
    logger.info(f"Test drive action '{action}' for {first_name} ({email}) at {retailer_name} ({retailer_address}) at {preferred_date_time}")

    if action == "check_availability":
        # Mock logic to check availability
        # In a real app we'd verify the retailer_id and the preferred_date_time
        return {
            "ui_action": {
                "action": "display_component",
                "component_name": "availability_view.html",
                "data": {
                    "location": location,
                    "date_time": preferred_date_time,
                    "retailer_name": retailer_name,
                    "retailer_address": retailer_address,
                    "retailer_id": retailer_id,
                    "retailer_lat": float(retailer_lat) if retailer_lat else 0.0,
                    "retailer_lng": float(retailer_lng) if retailer_lng else 0.0,
                    "available": True,
                },
            },
            "agent_context": f"The requested date and time ({preferred_date_time}) is available! You should now ask the user for their first name and email to finalize the booking.",
        }

    # Otherwise action == "book"
    # [Future] Perform actual API call to backend/CRM here.

    agent_context_str = f"The test drive has been successfully booked in the backend. Confirm this with the user. The user's collected details were: Name: {first_name}, Email: {email}, Location: {location}, Retailer: {retailer_name}, Address: {retailer_address}, Coordinates: {retailer_lat}, {retailer_lng}, Time: {preferred_date_time}, Height: {height}, Music: {music_preference}."

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "test_drive_confirmation.html",
            "data": {
                "first_name": first_name,
                "email": email,
                "location": location,
                "date_time": preferred_date_time,
                "retailer_name": retailer_name,
                "retailer_address": retailer_address,
                "retailer_id": retailer_id,
                "retailer_lat": float(retailer_lat) if retailer_lat else 0.0,
                "retailer_lng": float(retailer_lng) if retailer_lng else 0.0,
                "height": height,
                "music_preference": music_preference,
                "ambience_preference": ambience_preference,
            },
        },
        "agent_context": agent_context_str,
    }

# Create the tool instance
book_test_drive_tool = FunctionTool(book_test_drive)
