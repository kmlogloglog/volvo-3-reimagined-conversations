import logging

from dotenv import load_dotenv
from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools import AgentTool
from google.adk.tools.google_search_tool import GoogleSearchTool
from google.adk.tools.load_memory_tool import load_memory_tool

from .config.prompts import PROMPT_V2
from .tools import (
    display_model_image_tool,
    maps_tool,
    save_memory_tool,
    update_config_tool,
)

load_dotenv()

logging.basicConfig(level=logging.INFO)

google_search_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="google_search_agent",
    instruction="Agent that is able to search the internet for information.",
    tools=[GoogleSearchTool()],
)


volvo_agent = LlmAgent(
    model="gemini-live-2.5-flash-native-audio",
    name="volvo_agent",
    instruction=PROMPT_V2,
    tools=[
        load_memory_tool,
        save_memory_tool,
        display_model_image_tool,
        update_config_tool,
        maps_tool,
    ],
)

root_agent = volvo_agent
