import logging
from google.adk.tools import FunctionTool, ToolContext

from ..schemas.test_drive import Retailer, UserInfo, AppointmentSlot

logger = logging.getLogger(__name__)


def book_test_drive(
    tool_context: ToolContext,
    retailer: Retailer,
    user_info: UserInfo,
    appointment_slot: AppointmentSlot,
) -> dict:
    """
    Books a test drive for the user's configured Volvo.

    Use this tool to finalize the booking after the user has selected a retailer,
    provided their personal information (name, email), and preferred appointment slot.

    Args:
        tool_context: The tool context.
        retailer: The selected retailer.
        user_info: The user's information.
        appointment_slot: The desired appointment slot.

    Returns:
        A dictionary containing the UI action for the frontend and the agent context.
    """
    logger.info(
        f"book_test_drive called: user={user_info.name}, email={user_info.email}, "
        f"retailer={retailer.name}, date={appointment_slot.date}, time={appointment_slot.time}"
    )

    # Persist data to state
    tool_context.state["user:test_drive_request"] = {
        "retailer": retailer.model_dump(),
        "user_info": user_info.model_dump(),
        "appointment_slot": appointment_slot.model_dump()
    }

    # Mock Availability Check
    # In a real app, this would query the retailer's booking system
    is_available = True 

    if not is_available:
        # If not available, return alternative slots
        return {
            "agent_context": f"The slot {appointment_slot.date} at {appointment_slot.time} is not available at {retailer.name}. "
            "Available slots provided by the system are: 10:00, 14:00, 16:00. Please ask the user to choose one of these times.",
        }

    # If available, confirm booking
    payload = {
        "ui_action": {
            "action": "display_component",
            "component_name": "test_drive_confirmation", # removed .html based on previous code
            "data": {
                "user_name": user_info.name,
                "user_email": user_info.email,
                "retailer_name": retailer.name,
                "retailer_address": retailer.location.street,
                "date": appointment_slot.date,
                "time": appointment_slot.time,
                "retailer_location": {
                    "lat": retailer.location.lat,
                    "lng": retailer.location.lng,
                },
                "preferences": {
                    "height": user_info.height,
                    "music": user_info.music,
                    "light": user_info.light,
                },
            },
        },
        "agent_context": f"Test drive booked for {user_info.name} at {retailer.name} on {appointment_slot.date} at {appointment_slot.time}. "
        f"Preferences recorded. Confirmation displayed to user.",
    }

    return payload


book_test_drive_tool = FunctionTool(book_test_drive)
