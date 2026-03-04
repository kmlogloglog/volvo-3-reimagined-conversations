import logging
from datetime import UTC, datetime
from typing import Any

from google.adk.memory.base_memory_service import (
    BaseMemoryService,
    SearchMemoryResponse,
)
from google.adk.sessions.session import Session
from google.cloud.firestore_v1.async_client import AsyncClient
from google.genai import types

logger = logging.getLogger(__name__)

SUMMARY_MODEL = "gemini-2.5-flash"
SUMMARY_DOC_ID = "interactions_summary"


def _build_transcript(session: Session) -> str:
    """Build a conversation transcript from session events.

    Handles both regular events (text in content.parts) and live/bidi
    streaming events (text in input_transcription / output_transcription).
    """
    transcript_lines: list[str] = []
    for event in session.events:
        # Skip partial (in-progress) transcription events
        if event.partial:
            continue

        # 1. Check live-streaming transcription fields
        if event.input_transcription and event.input_transcription.text:
            text = event.input_transcription.text.strip()
            if text:
                transcript_lines.append(f"user: {text}")
                continue

        if event.output_transcription and event.output_transcription.text:
            text = event.output_transcription.text.strip()
            if text:
                author = event.author or "agent"
                transcript_lines.append(f"{author}: {text}")
                continue

        # 2. Fall back to regular content parts (non-streaming sessions)
        if not event.content or not event.content.parts:
            continue
        if event.get_function_calls() or event.get_function_responses():
            continue
        text_parts = [part.text for part in event.content.parts if part.text]
        if text_parts:
            text = " ".join(text_parts).replace("\n", " ")
            transcript_lines.append(f"{event.author}: {text}")

    return "\n".join(transcript_lines)


def _build_summary_prompt(existing_summary: str, transcript: str) -> str:
    """Build the prompt for LLM-based session summary consolidation."""
    parts = [
        "You are a session memory consolidator. Your job is to maintain "
        "an up-to-date summary of everything learned about a user across "
        "multiple conversations with a Volvo car sales assistant.",
        "",
        "Take the existing summary and the new conversation transcript, "
        "then produce a consolidated summary that:",
        "- Preserves all important information from the existing summary",
        "- Incorporates new information from the latest conversation",
        "- Resolves contradictions by preferring newer information",
        "- Stays concise but comprehensive",
        "- Focuses on: user preferences, lifestyle, family, needs, "
        "decisions made, and any other relevant personal details",
        "",
    ]

    if existing_summary:
        parts.extend(
            [
                "## Existing summary from prior sessions",
                existing_summary,
                "",
            ]
        )
    else:
        parts.extend(
            [
                "## Existing summary",
                "(No prior sessions — this is the first session.)",
                "",
            ]
        )

    parts.extend(
        [
            "## New conversation transcript",
            "(This comes from audio transcription and may contain errors "
            "— use judgment to interpret.)",
            transcript,
            "",
            "## Your consolidated summary",
        ]
    )

    return "\n".join(parts)


class FirestoreMemoryService(BaseMemoryService):
    """Firestore-backed memory service that maintains a consolidated
    LLM-generated session summary across conversations.

    Storage structure in Firestore (under users/{user_id}/memories/):
    - One "interactions_summary" document with the consolidated summary

    User-scoped state (user: prefix) is handled by the session service
    and does not need to be duplicated here.

    For local dev without Firestore, use ADK's InMemoryMemoryService instead.
    """

    def __init__(
        self,
        project_id: str | None = None,
        database: str = "(default)",
    ):
        self.db = AsyncClient(project=project_id, database=database)
        logger.info(
            f"FirestoreMemoryService initialized. "
            f"Project: {self.db.project}, Database: {database}"
        )

    async def search_memory(
        self, *, app_name: str, user_id: str, query: str
    ) -> SearchMemoryResponse:
        """Required by BaseMemoryService. Returns empty — search is not used."""
        return SearchMemoryResponse(memories=[])

    # ------------------------------------------------------------------
    # Firestore helpers
    # ------------------------------------------------------------------

    async def _save_field(self, user_id: str, key: str, value: Any) -> None:
        """Save a single state field as its own Firestore document."""
        client = self.db
        doc_ref = (
            client.collection("users")
            .document(user_id)
            .collection("memories")
            .document(key)
        )
        await doc_ref.set(
            {
                "value": value,
                "updated_at": datetime.now(UTC).isoformat(),
            }
        )

    async def load_user_memories(self, user_id: str) -> dict[str, Any]:
        """Load stored memory documents for a user from Firestore.

        Returns a dict of {doc_id: value}. Currently only the
        SUMMARY_DOC_ID document is stored here.
        """
        client = self.db
        collection = client.collection("users").document(user_id).collection("memories")
        result: dict[str, Any] = {}
        async for doc in collection.stream():
            data = doc.to_dict()
            # Only load field-level documents (have a "value" key)
            if data and "value" in data:
                result[doc.id] = data["value"]
        return result

    # ------------------------------------------------------------------
    # Session ingestion
    # ------------------------------------------------------------------

    async def add_session_to_memory(self, session: Session) -> None:
        """Ingests a session into memory.

        Builds the conversation transcript and calls the LLM to produce
        a consolidated summary that accumulates across sessions.

        Note: user-scoped state (user: prefix) is persisted by
        FirestoreSessionService — no duplication needed here.
        """
        from .registry import genai_client

        logger.info(
            f"Session {session.id}: "
            f"state_keys={list(session.state.keys())}, "
            f"events_count={len(session.events)}"
        )

        # Build transcript and consolidate summary via LLM
        transcript = _build_transcript(session)
        if not transcript:
            logger.info(
                f"No transcript for session {session.id}, "
                f"skipping summary consolidation"
            )
            return

        # Load existing summary
        existing_memories = await self.load_user_memories(session.user_id)
        existing_summary = existing_memories.get(SUMMARY_DOC_ID, "")
        if not isinstance(existing_summary, str):
            existing_summary = ""

        prompt = _build_summary_prompt(existing_summary, transcript)

        try:
            response = await genai_client.aio.models.generate_content(
                model=SUMMARY_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You consolidate user session summaries. Output only "
                        "the updated summary text, nothing else. Be concise "
                        "but preserve all relevant user information."
                    ),
                ),
            )

            if not response.text:
                logger.warning(f"LLM returned empty summary for session {session.id}")
                return

            new_summary = response.text.strip()
            await self._save_field(session.user_id, SUMMARY_DOC_ID, new_summary)

            logger.info(
                f"Consolidated session summary for user "
                f"{session.user_id} from session {session.id}"
            )
        except Exception as e:
            logger.error(
                f"LLM summary consolidation failed for session {session.id}: {e}",
                exc_info=True,
            )
