import logging

from google.adk.tools import FunctionTool

logger = logging.getLogger(__name__)


def book_test_drive(
    first_name: str,
    email: str,
    location: str,
    preferred_date_time: str,
    retailer_id: str = "",
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
        location: The retailer city or location.
        preferred_date_time: The user's preferred date and time for the test drive.
        retailer_id: The ID of the retailer obtained from the maps tool.
        height: (Optional) The user's height for seat pre-adjustment.
        music_preference: (Optional) The user's preferred music.
        ambience_preference: (Optional) The user's preferred mood lighting.
        action: Either "check_availability" or "book".

    Returns:
        A dictionary containing the UI action for the booking confirmation.
    """
    logger.info(f"Test drive action '{action}' for {first_name} ({email}) at {location} ({retailer_id}) at {preferred_date_time}")

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
                    "retailer_id": retailer_id,
                    "available": True,
                },
            },
            "agent_context": f"The requested date and time ({preferred_date_time}) is available! You should now ask the user for their first name and email to finalize the booking.",
        }

    # Otherwise action == "book"
    # [Future] Perform actual API call to backend/CRM here.

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "test_drive_confirmation.html",
            "data": {
                "first_name": first_name,
                "email": email,
                "location": location,
                "date_time": preferred_date_time,
                "retailer_id": retailer_id,
            },
        },
        "agent_context": "The test drive has been successfully booked in the backend. Confirm this with the user.",
    }


# Create the tool instance
book_test_drive_tool_instance = FunctionTool(book_test_drive)
