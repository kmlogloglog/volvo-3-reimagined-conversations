import logging
import random
from datetime import datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)


def book_test_drive(
    state: dict[str, Any],
    retailer: dict,
    user_info: dict,
    appointment_slot: dict,
) -> dict:
    """Books a test drive for the user's configured Volvo."""
    name = user_info.get("name", "")
    email = user_info.get("email", "")
    height = user_info.get("height")
    music = user_info.get("music")
    light = user_info.get("light")
    retailer_name = retailer.get("name", "")
    retailer_location = retailer.get("location", {})
    retailer_phone = retailer.get("phone")
    date = appointment_slot.get("date", "")
    time = appointment_slot.get("time", "")

    logger.info(
        f"book_test_drive called: user={name}, email={email}, "
        f"retailer={retailer_name}, date={date}, time={time}"
    )

    if name:
        state["user:full_name"] = name
    if email:
        state["user:email"] = email
    if height:
        state["user:height_cm"] = height
    if not state.get("user:test_drive_preferences"):
        state["user:test_drive_preferences"] = {}
    if music:
        state["user:test_drive_preferences"]["music"] = music
    if light:
        state["user:test_drive_preferences"]["ambient_light"] = light

    # Mock booking logic
    if not state.get("booking_attempted"):
        is_available = random.choice([True, False])
        state["booking_attempted"] = True
    else:
        is_available = True

    if not is_available:
        try:
            requested_dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
            alternatives = [
                f"{(requested_dt + timedelta(hours=1)).strftime('%Y-%m-%d')} at {(requested_dt + timedelta(hours=1)).strftime('%H:%M')}",
                f"{(requested_dt + timedelta(hours=2)).strftime('%Y-%m-%d')} at {(requested_dt + timedelta(hours=2)).strftime('%H:%M')}",
                f"{(requested_dt + timedelta(days=1)).strftime('%Y-%m-%d')} at {(requested_dt + timedelta(days=1)).strftime('%H:%M')}",
            ]
            return {
                "agent_context": f"The slot {date} at {time} is not available at {retailer_name}. "
                f"Suggested alternative slots are: {', '.join(alternatives)}.",
            }
        except ValueError:
            return {
                "agent_context": f"The slot {date} at {time} is not available at {retailer_name}."
            }

    state["user:test_drive_appointment"] = {
        "retailer": retailer,
        "user_info": user_info,
        "appointment_slot": appointment_slot,
    }

    return {
        "ui_action": {
            "action": "display_component",
            "component_name": "test_drive_confirmation",
            "data": {
                "user_name": name,
                "user_email": email,
                "retailer_name": retailer_name,
                "retailer_address": retailer_location.get("street", ""),
                "retailer_phone": retailer_phone,
                "date": date,
                "time": time,
                "retailer_location": {
                    "lat": retailer_location.get("lat"),
                    "lng": retailer_location.get("lng"),
                },
                "preferences": {
                    "height": height,
                    "music": music,
                    "light": light,
                },
            },
        },
        "agent_context": f"Test drive booked for {name} at {retailer_name} on {date} at {time}. "
        f"Preferences recorded. Confirmation displayed to user.",
    }
