"""Session orchestrator — ties OpenAI Realtime client, state, tools, and events together."""

import asyncio
import json
import logging
import re
from datetime import UTC, datetime
from typing import Any

from ..config.prompts import PROMPT
from ..services import sqlite_service
from ..services.registry import openai_client
from ..state import StateManager
from ..tools import TOOLS, execute_tool
from ..utils.utils import load_car_configurations
from .client import OpenAIRealtimeClient
from .event_translator import EventTranslator

logger = logging.getLogger(__name__)

APP_NAME = "volvo_vaen"


def render_prompt(template: str, state: dict[str, Any]) -> str:
    """Replace {key} and {key?} placeholders with state values.

    - {key} → value or empty string
    - {key?} → value or "Not provided"
    """

    def _replace(match: re.Match) -> str:
        key = match.group(1)
        optional = key.endswith("?")
        if optional:
            key = key[:-1]
        value = state.get(key)
        if value is not None:
            return str(value) if not isinstance(value, str) else value
        return "Not provided" if optional else ""

    return re.sub(r"\{([^}]+)\}", _replace, template)


class SessionHandler:
    """Manages a single user session with OpenAI Realtime API."""

    def __init__(self, user_id: str, session_id: str):
        self.user_id = user_id
        self.session_id = session_id
        self.state = StateManager(APP_NAME, user_id, session_id)
        self.translator = EventTranslator()
        self.rt_client = OpenAIRealtimeClient(
            api_key=openai_client.api_key,
        )
        self.outbound_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        self.transcript_lines: list[str] = []
        self._current_fn_name: str = ""
        self._current_fn_args: str = ""
        self._current_fn_call_id: str = ""

    async def initialize(self) -> None:
        """Set up state, connect to OpenAI, and configure the session."""
        # Create/load session in SQLite
        await sqlite_service.create_session(APP_NAME, self.user_id, self.session_id)
        await self.state.load()

        # Load car configurations into temp state
        car_configs = load_car_configurations()
        self.state["temp:car_configurations"] = json.dumps(car_configs, indent=2)
        self.state["temp:current_datetime"] = datetime.now(UTC).strftime(
            "%Y-%m-%d %H:%M UTC"
        )

        # Load past interaction summaries
        memories = await sqlite_service.load_user_memories(self.user_id)
        if memories.get("interactions_summary"):
            self.state["temp:past_interactions_summary"] = memories[
                "interactions_summary"
            ]

        # Render the prompt with current state
        instructions = render_prompt(PROMPT, self.state.to_dict())

        # Connect to OpenAI Realtime
        await self.rt_client.connect()
        await self.rt_client.send_session_update(
            instructions=instructions,
            tools=TOOLS,
            voice="shimmer",
        )
        logger.info(
            "Session initialized: user=%s session=%s",
            self.user_id,
            self.session_id,
        )

    async def handle_upstream(self, message: dict) -> None:
        """Process a single message from the browser WebSocket."""
        if "bytes" in message:
            await self.rt_client.send_audio(message["bytes"])
        elif "text" in message:
            data = json.loads(message["text"])
            if data.get("type") == "text":
                self.transcript_lines.append(f"User: {data['text']}")
                await self.rt_client.send_text(data["text"])

    async def run_downstream(self) -> None:
        """Read events from OpenAI, handle tool calls, and queue translated events."""
        async for event in self.rt_client.receive_events():
            event_type = event.get("type", "")

            # ---- Accumulate function call arguments ----
            if event_type == "response.function_call_arguments.delta":
                self._current_fn_args += event.get("delta", "")
                self._current_fn_call_id = event.get("call_id", self._current_fn_call_id)
                continue

            if event_type == "response.function_call_arguments.done":
                call_id = event.get("call_id", self._current_fn_call_id)
                fn_name = event.get("name", self._current_fn_name)
                fn_args = event.get("arguments", self._current_fn_args)

                logger.info("Tool call: %s(%s)", fn_name, fn_args)
                await self._execute_tool_call(call_id, fn_name, fn_args)

                # Reset accumulators
                self._current_fn_name = ""
                self._current_fn_args = ""
                self._current_fn_call_id = ""
                continue

            # Track the function name from output_item.added
            if event_type == "response.output_item.added":
                item = event.get("item", {})
                if item.get("type") == "function_call":
                    self._current_fn_name = item.get("name", "")
                    self._current_fn_args = ""
                    self._current_fn_call_id = item.get("call_id", "")
                continue

            # ---- Capture transcripts for memory ----
            if event_type == "response.audio_transcript.done":
                text = event.get("transcript", "")
                if text:
                    self.transcript_lines.append(f"Freja: {text}")

            if event_type == "conversation.item.input_audio_transcription.completed":
                text = event.get("transcript", "")
                if text:
                    self.transcript_lines.append(f"User: {text}")

            # ---- Translate and queue for browser ----
            translated = self.translator.translate(event)
            if translated is not None:
                await self.outbound_queue.put(translated)

    async def _execute_tool_call(
        self, call_id: str, name: str, arguments_json: str
    ) -> None:
        """Execute a tool, send result back to OpenAI, and notify frontend."""
        result = execute_tool(name, arguments_json, self.state.to_dict())

        # Update state from tool results that modify state
        self._apply_tool_state_changes(name, arguments_json, result)

        # Flush state changes to SQLite
        await self.state.flush()

        # Send function output back to OpenAI so it can continue generating
        await self.rt_client.send_function_output(call_id, json.dumps(result))

        # Send functionResponse event to frontend for UI rendering
        fr_event = self.translator.make_function_response_event(name, result)
        await self.outbound_queue.put(fr_event)

        self.transcript_lines.append(f"[Tool: {name} → {json.dumps(result)[:200]}]")

    def _apply_tool_state_changes(
        self, name: str, arguments_json: str, result: dict
    ) -> None:
        """Mirror state changes that tools would have made via state dict."""
        try:
            args = (
                json.loads(arguments_json)
                if isinstance(arguments_json, str)
                else arguments_json
            )
        except json.JSONDecodeError:
            return

        # Tools write to state in their function bodies via state[key] = value.
        # Since we pass state.to_dict() (a copy), we need to propagate key changes.
        if name == "select_model":
            self.state["selected_model"] = args.get("model_name", "")
        elif name == "select_exterior_color":
            self.state["selected_exterior_color"] = args.get("color_id", "")
        elif name == "select_wheel":
            self.state["selected_wheel"] = args.get("wheel_id", "")
        elif name == "select_interior":
            self.state["selected_interior"] = args.get("interior_id", "")
        elif name == "save_user_insight":
            category = args.get("category", "")
            value = args.get("value", "")
            # Map insight categories to user-scoped state keys
            category_to_key = {
                "full_name": "user:full_name",
                "email": "user:email",
                "location": "user:location",
                "passenger_count": "user:profiling",
                "driving_environment": "user:profiling",
                "daily_car_use": "user:profiling",
                "weekend_vibe": "user:profiling",
            }
            key = category_to_key.get(category)
            if key:
                if key == "user:profiling":
                    existing = self.state.get("user:profiling", "")
                    new_val = (
                        f"{existing}; {category}: {value}"
                        if existing
                        else f"{category}: {value}"
                    )
                    self.state["user:profiling"] = new_val
                else:
                    self.state[key] = value
        elif name == "find_retailer":
            if "retailer" in result:
                self.state["found_retailer"] = json.dumps(result["retailer"])
        elif name == "book_test_drive":
            if "appointment" in result:
                self.state["user:test_drive_appointment"] = json.dumps(
                    result["appointment"]
                )

    async def cleanup(self) -> None:
        """Persist state and consolidate memory on disconnect."""
        try:
            await self.state.flush()
        except Exception as e:
            logger.error("Failed to flush state: %s", e)

        try:
            await sqlite_service.add_session_to_memory(
                openai_client, self.user_id, self.transcript_lines
            )
        except Exception as e:
            logger.error("Failed to consolidate memory: %s", e)

        try:
            await self.rt_client.close()
        except Exception as e:
            logger.error("Failed to close OpenAI connection: %s", e)

        logger.info(
            "Session cleaned up: user=%s session=%s",
            self.user_id,
            self.session_id,
        )
