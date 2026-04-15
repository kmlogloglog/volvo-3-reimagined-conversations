"""Translates OpenAI Realtime events to ADK-like format for frontend compatibility."""

from typing import Any


class EventTranslator:
    """Converts OpenAI Realtime server events into the JSON structure
    that the existing debug_frontend expects (ADK event format)."""

    def __init__(self) -> None:
        self._output_transcript = ""

    def translate(self, event: dict[str, Any]) -> dict[str, Any] | None:
        """Return an ADK-shaped event dict, or None to skip."""
        t = event.get("type", "")

        # ---- Audio output ----
        if t == "response.audio.delta":
            return {
                "author": "volvo_agent",
                "content": {
                    "parts": [
                        {
                            "inlineData": {
                                "data": event["delta"],
                                "mimeType": "audio/pcm;rate=24000",
                            }
                        }
                    ]
                },
                "partial": True,
            }

        # ---- Output transcription (streaming) ----
        if t == "response.audio_transcript.delta":
            self._output_transcript += event.get("delta", "")
            return {
                "author": "volvo_agent",
                "outputTranscription": {
                    "text": event.get("delta", ""),
                    "finished": False,
                },
                "partial": True,
            }

        if t == "response.audio_transcript.done":
            text = event.get("transcript", self._output_transcript)
            self._output_transcript = ""
            return {
                "author": "volvo_agent",
                "outputTranscription": {"text": text, "finished": True},
                "partial": False,
            }

        # ---- Input transcription ----
        if t == "conversation.item.input_audio_transcription.completed":
            return {
                "author": "user",
                "inputTranscription": {
                    "text": event.get("transcript", ""),
                    "finished": True,
                },
                "partial": False,
            }

        # ---- Text output (half-cascade / fallback) ----
        if t == "response.text.delta":
            return {
                "author": "volvo_agent",
                "content": {"parts": [{"text": event.get("delta", "")}]},
                "partial": True,
            }

        # ---- Turn / response lifecycle ----
        if t == "response.done":
            self._output_transcript = ""
            return {"turnComplete": True, "author": "volvo_agent"}

        # ---- Interruption ----
        if t == "input_audio_buffer.speech_started":
            return {"interrupted": True, "author": "volvo_agent"}

        # ---- Errors ----
        if t == "error":
            return {
                "author": "system",
                "error": event.get("error", {}),
            }

        # Everything else is ignored (session.created, session.updated, etc.)
        return None

    def make_function_response_event(
        self, tool_name: str, result: dict[str, Any]
    ) -> dict[str, Any]:
        """Build an ADK-style functionResponse event so the frontend
        can render UI actions (images, maps, confirmations)."""
        return {
            "author": "volvo_agent",
            "content": {
                "parts": [
                    {
                        "functionResponse": {
                            "name": tool_name,
                            "response": result,
                        }
                    }
                ]
            },
        }
