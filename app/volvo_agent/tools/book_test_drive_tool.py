import logging

from google.adk.tools import FunctionTool, ToolContext

logger = logging.getLogger(__name__)


def book_test_drive(
    tool_context: ToolContext,
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
        tool_context: The tool context containing session state.
        first_name: The user's first name. Empty string if just checking availability.
        email: The user's email address. Empty string if just checking availability.
        location: The user's general location.
        preferred_date_time: The user's preferred date and time for the test drive.
        retailer_name: (Optional) The name of the specific retailer.
        retailer_address: (Optional) The exact physical address of the specific retailer.
        retailer_id: (Optional) The ID of the retailer.
        retailer_lat: (Optional) Latitude of the retailer.
        retailer_lng: (Optional) Longitude of the retailer.
        height: (Optional) The user's height for seat pre-adjustment.
        music_preference: (Optional) The user's preferred music.
        ambience_preference: (Optional) The user's preferred mood lighting.
        action: Either "check_availability" or "book".

    Returns:
        A dictionary containing the UI action for the booking confirmation.
    """
    # Try to load retailer from state if not provided
    saved_retailer = tool_context.state.get("selected_retailer", {})
    
    final_retailer_name = saved_retailer.get("name") or retailer_name
    final_retailer_address = saved_retailer.get("address") or retailer_address
    final_retailer_id = saved_retailer.get("id") or retailer_id
    final_retailer_lat = saved_retailer.get("lat") or retailer_lat
    final_retailer_lng = saved_retailer.get("lng") or retailer_lng

    logger.info(f"Test drive action '{action}' for {first_name} ({email}) at {final_retailer_name} ({final_retailer_address}) at {preferred_date_time}")

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
                    "retailer_name": final_retailer_name,
                    "retailer_address": final_retailer_address,
                    "retailer_id": final_retailer_id,
                    "retailer_lat": float(final_retailer_lat) if final_retailer_lat else 0.0,
                    "retailer_lng": float(final_retailer_lng) if final_retailer_lng else 0.0,
                    "available": True,
                },
            },
            "agent_context": f"The requested date and time ({preferred_date_time}) is available at {final_retailer_name}! Confirm this explicitly with the user as 'Date, Time' (e.g. 'Monday 12th, 10:00'). Then ask for their first name and email to finalize the booking.",
        }

    # Otherwise action == "book"
    # [Future] Perform actual API call to backend/CRM here.

    agent_context_str = f"The test drive has been successfully booked in the backend. Confirm this with the user. The booking is for {preferred_date_time}. Make sure to state the date and time clearly (e.g. 'Monday 12th, 10:00'). The user's collected details were: Name: {first_name}, Email: {email}, Retailer: {final_retailer_name}, Address: {final_retailer_address}, Coordinates: {final_retailer_lat}, {final_retailer_lng}, Height: {height}, Music: {music_preference}."

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "test_drive_confirmation.html",
            "data": {
                "first_name": first_name,
                "email": email,
                "location": location,
                "date_time": preferred_date_time,
                "retailer_name": final_retailer_name,
                "retailer_address": final_retailer_address,
                "retailer_id": final_retailer_id,
                "retailer_lat": float(final_retailer_lat) if final_retailer_lat else 0.0,
                "retailer_lng": float(final_retailer_lng) if final_retailer_lng else 0.0,
                "height": height,
                "music_preference": music_preference,
                "ambience_preference": ambience_preference,
            },
        },
        "agent_context": agent_context_str,
    }

# Create the tool instance
book_test_drive_tool = FunctionTool(book_test_drive)
