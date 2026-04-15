"""WebSocket client for the OpenAI Realtime API."""

import base64
import json
import logging
from typing import Any, AsyncIterator

import websockets

logger = logging.getLogger(__name__)

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime"
DEFAULT_MODEL = "gpt-4o-realtime-preview-2024-12-17"


class OpenAIRealtimeClient:
    """Manages a single WebSocket connection to the OpenAI Realtime API."""

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL):
        self.api_key = api_key
        self.model = model
        self.ws: Any = None

    async def connect(self) -> None:
        url = f"{OPENAI_REALTIME_URL}?model={self.model}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Beta": "realtime=v1",
        }
        self.ws = await websockets.connect(url, additional_headers=headers)
        logger.info("Connected to OpenAI Realtime API (model=%s)", self.model)

    async def send_session_update(
        self,
        instructions: str,
        tools: list[dict],
        voice: str = "shimmer",
    ) -> None:
        """Configure the session with instructions, tools, and voice."""
        await self._send({
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": instructions,
                "voice": voice,
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {"model": "gpt-4o-mini-transcribe"},
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 1000,
                },
                "tools": tools,
                "tool_choice": "auto",
                "temperature": 0.8,
            },
        })

    async def send_audio(self, pcm_bytes: bytes) -> None:
        """Send a chunk of PCM16 audio to the input buffer."""
        audio_b64 = base64.b64encode(pcm_bytes).decode("ascii")
        await self._send({
            "type": "input_audio_buffer.append",
            "audio": audio_b64,
        })

    async def send_text(self, text: str) -> None:
        """Send a text message as a user turn."""
        await self._send({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": text}],
            },
        })
        await self._send({"type": "response.create"})

    async def send_function_output(self, call_id: str, output: str) -> None:
        """Return a function call result and trigger continued generation."""
        await self._send({
            "type": "conversation.item.create",
            "item": {
                "type": "function_call_output",
                "call_id": call_id,
                "output": output,
            },
        })
        await self._send({"type": "response.create"})

    async def receive_events(self) -> AsyncIterator[dict]:
        """Yield parsed JSON events from the OpenAI WebSocket."""
        async for message in self.ws:
            yield json.loads(message)

    async def close(self) -> None:
        if self.ws:
            await self.ws.close()
            logger.info("OpenAI Realtime connection closed")

    async def _send(self, event: dict) -> None:
        await self.ws.send(json.dumps(event))
