import logging
import random
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
    # Randomize availability to test both success and failure flows
    is_available = random.choice([True, False]) 

    if not is_available:
        # Calculate alternative slots based on the USER'S requested slot
        # Mock logic: +1 hour, +2 hours, +1 day relative to the requested time
        try:
            from datetime import datetime, timedelta
            
            # Parse requested date and time
            # Assuming format YYYY-MM-DD and HH:MM
            requested_dt = datetime.strptime(f"{appointment_slot.date} {appointment_slot.time}", "%Y-%m-%d %H:%M")
            
            alternatives = []
            # Option 1: Same day, +1 hour
            alt1 = requested_dt + timedelta(hours=1)
            alternatives.append(f"{alt1.strftime('%Y-%m-%d')} at {alt1.strftime('%H:%M')}")
            
            # Option 2: Same day, +2 hours
            alt2 = requested_dt + timedelta(hours=2)
            alternatives.append(f"{alt2.strftime('%Y-%m-%d')} at {alt2.strftime('%H:%M')}")
            
            # Option 3: Next day, same time
            alt3 = requested_dt + timedelta(days=1)
            alternatives.append(f"{alt3.strftime('%Y-%m-%d')} at {alt3.strftime('%H:%M')}")
            
            suggestions = ", ".join(alternatives)
            
            return {
                "agent_context": f"The slot {appointment_slot.date} at {appointment_slot.time} is not available at {retailer.name}. "
                f"Suggested alternative slots are: {suggestions}.",
            }
        except ValueError:
            # Fallback if parsing fails (e.g. invalid date/time format)
            return {
                "agent_context": f"The slot {appointment_slot.date} at {appointment_slot.time} is not available at {retailer.name}."
            }

    # If available, confirm booking
    payload = {
        "ui_action": {
            "action": "display_component",
            "component_name": "test_drive_confirmation",
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
