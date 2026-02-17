import logging

from dotenv import load_dotenv
from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.load_memory_tool import load_memory_tool

from .config.prompts import PROMPT
from .tools import (
    update_and_display_car_configuration_tool,
    maps_tool,
    save_memory_tool,
)

load_dotenv()

logging.basicConfig(level=logging.INFO)

volvo_agent = LlmAgent(
    model="gemini-live-2.5-flash-native-audio",
    name="volvo_agent",
    instruction=PROMPT,
    tools=[
        load_memory_tool,
        save_memory_tool,
        update_and_display_car_configuration_tool,
        maps_tool,
    ],
)

root_agent = volvo_agent
