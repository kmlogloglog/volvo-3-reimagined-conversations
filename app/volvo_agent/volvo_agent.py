import logging

from dotenv import load_dotenv
from google.adk.agents.llm_agent import LlmAgent

from .callbacks import preload_memories
from .config.prompts import PROMPT
from .tools import (
    book_test_drive_tool,
    find_retailer_tool,
    save_user_insight_tool,
    select_model_tool,
    select_exterior_color_tool,
    select_wheel_tool,
    select_interior_tool,
    display_car_configuration_tool,
)


load_dotenv()

logging.basicConfig(level=logging.INFO)

volvo_agent = LlmAgent(
    model="gemini-live-2.5-flash-native-audio",
    name="volvo_agent",
    instruction=PROMPT,
    before_agent_callback=preload_memories,
    tools=[
        find_retailer_tool,
        book_test_drive_tool,
        save_user_insight_tool,
        select_model_tool,
        select_exterior_color_tool,
        select_wheel_tool,
        select_interior_tool,
        display_car_configuration_tool
    ],
)

root_agent = volvo_agent
