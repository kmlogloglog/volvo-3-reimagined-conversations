import logging

from google.adk.tools import FunctionTool, ToolContext

from ..schemas.test_drive import TestDriveRequest

logger = logging.getLogger(__name__)


def book_test_drive(
    tool_context: ToolContext,
    request: TestDriveRequest,
) -> dict:
    """
    Checks availability or submits a test drive booking request for the user's configured Volvo.

    Use this tool either to check the availability of a retailer at a specific date and time,
    or to actually book the test drive after availability has been checked and the user has
    provided their name and email. Make sure to call this tool if the action is merely checking
    availability or booking.

    Args:
        tool_context: The tool context.
        request: The test drive request containing user details and preferences.

    Returns:
        A dictionary containing the UI action for the frontend and the agent context.
    """
    tool_context.state["user:test_drive_request"] = request

    first_name = request.first_name
    email = request.email
    location = request.location
    preferred_date_time = request.preferred_date_time
    retailer_name = request.retailer_name
    retailer_address = request.retailer_address
    retailer_id = request.retailer_id
    retailer_lat = request.retailer_lat
    retailer_lng = request.retailer_lng
    height = request.height
    music_preference = request.music_preference
    ambience_preference = request.ambience_preference
    action = request.action

    logger.info(
        f"book_test_drive called: action={action}, first_name={first_name}, email={email}, "
        f"location={location}, preferred_date_time={preferred_date_time}, retailer={retailer_name}, "
        f"retailer_address={retailer_address}, (lat, lng)=({retailer_lat}, {retailer_lng}), "
        f"height={height}, music={music_preference}, ambience={ambience_preference}"
    )

    if action == "check":
        return {
            "agent_context": f"Availability confirmed for {retailer_name} at {preferred_date_time}. "
            f"Context: The user wants to test drive at {retailer_name}. "
            f"Ask for their first name and email to proceed with booking.",
        }

    # Validation: Ensure name and email are present for booking
    if not first_name or not email:
        return {
            "agent_context": "Missing user details. Please ask the user for their first name and email before finalizing the booking.",
        }

    # If booking
    payload = {
        "ui_action": {
            "action": "display_component",
            "component_name": "test_drive_confirmation",
            "data": {
                "first_name": first_name,
                "email": email,
                "location": location,
                "preferred_date_time": preferred_date_time,
                "retailer_name": retailer_name,
                "retailer_address": retailer_address,
                "retailer_id": retailer_id,
                "coordinates": {
                    "lat": retailer_lat,
                    "lng": retailer_lng,
                },
                "preferences": {
                    "height": height,
                    "music": music_preference,
                    "ambience": ambience_preference,
                },
            },
        },
        "agent_context": f"Test drive booked for {first_name} at {retailer_name} on {preferred_date_time}. "
        f"Preferences recorded: Height: {height}, Music: {music_preference}, Ambience: {ambience_preference}. "
        f"Confirmation displayed to user.",
    }

    return payload


book_test_drive_tool = FunctionTool(book_test_drive)
