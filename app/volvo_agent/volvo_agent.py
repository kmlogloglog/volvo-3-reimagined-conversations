import logging
from datetime import datetime

from dotenv import load_dotenv
from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.load_memory_tool import load_memory_tool

from .config.prompts import PROMPT
from .tools import (
    find_retailer_tool,
    save_memory_tool,
    update_and_display_car_configuration_tool,
    book_test_drive_tool
)

load_dotenv()

logging.basicConfig(level=logging.INFO)

# Append the current date and time context to the system instructions
current_time_context = f"\n\n<context>\nToday's date and time is: {datetime.now().strftime('%A, %B %d, %Y %I:%M %p')}\nWhen handling relative dates like 'tomorrow' or 'next week', calculate them based on this exact date. When parsing a time mentioned (e.g. '2' or '6'), NEVER ask the user to clarify AM or PM. Always assume they mean business hours (9 AM to 6 PM). For example, '2' means 2:00 PM, '10' means 10:00 AM, and '6' means 6:00 PM. Assume Volvo dealerships are closed at night.\n</context>"

volvo_agent = LlmAgent(
    model="gemini-live-2.5-flash-native-audio",
    name="volvo_agent",
    instruction=PROMPT + current_time_context,
    tools=[
        load_memory_tool,
        save_memory_tool,
        update_and_display_car_configuration_tool,
        find_retailer_tool,
        book_test_drive_tool,
    ],
)

root_agent = volvo_agent
