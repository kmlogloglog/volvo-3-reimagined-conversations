import json
import logging
import re
import uuid
from datetime import UTC, datetime
from typing import Any

from google.adk.memory.base_memory_service import (
    BaseMemoryService,
    SearchMemoryResponse,
)
from google.adk.memory.memory_entry import MemoryEntry
from google.adk.sessions.base_session_service import BaseSessionService
from google.adk.sessions.session import Session
from google.cloud.firestore_v1.base_query import FieldFilter
from google.genai import types

logger = logging.getLogger(__name__)

# Category keys used for deduplication
CATEGORY_USER_PROFILE = "user_profile"
CATEGORY_CAR_PREFERENCES = "car_preferences"
CATEGORY_WOW_PREFERENCES = "wow_preferences"
CATEGORY_SELECTED_RETAILER = "selected_retailer"
CATEGORY_TEST_DRIVE_BOOKING = "test_drive_booking"
CATEGORY_SESSION_TRANSCRIPT = "session_transcript"


def _extract_words_lower(text: str) -> set[str]:
    """Extracts words from a string and converts them to lowercase."""
    return {word.lower() for word in re.findall(r"[A-Za-z]+", text)}


class MemoryService(BaseMemoryService):
    """A simple memory service that supports basic persistence (Firestore or In-Memory).

    It maintains a list of 'facts' or 'memories' for each user.
    For FirestoreSessionService, it uses a sub-collection `users/{user_id}/memories`.
    For InMemorySessionService (or others), it falls back to a non-persistent in-memory list.
    """

    def __init__(self, session_service: BaseSessionService):
        self.session_service = session_service
        self._local_memories: list[MemoryEntry] = []

    async def add_memory(
        self,
        *,
        app_name: str,
        user_id: str,
        text: str,
        metadata: dict[str, Any] | None = None,
    ) -> MemoryEntry:
        """Adds a new memory entry."""
        entry = MemoryEntry(
            id=str(uuid.uuid4()),
            content=types.Content(parts=[types.Part(text=text)]),
            custom_metadata=metadata or {},
            timestamp=datetime.now(UTC).isoformat(),
            author="system",  # Indicates this is a system-stored fact
        )

        if hasattr(self.session_service, "db"):
            await self._save_firestore_memory(app_name, user_id, entry)
        else:
            # Fallback to in-memory storage
            self._local_memories.append(entry)

        return entry

    async def _save_firestore_memory(
        self, app_name: str, user_id: str, entry: MemoryEntry
    ) -> None:
        """Saves memory to Firestore."""
        # Access client from FirestoreSessionService
        # We need to ignore type checking here as we know the type at runtime based on the check in add_memory
        client = self.session_service.db  # type: ignore
        # Structure: users/{user_id}/memories/{memory_id}
        collection = client.collection("users").document(user_id).collection("memories")

        doc_data = entry.model_dump(mode="json", exclude_none=True)
        doc_data["app_name"] = app_name
        doc_data["user_id"] = user_id

        # Use entry.id as document ID
        await collection.document(entry.id).set(doc_data)

    async def search_memory(
        self, *, app_name: str, user_id: str, query: str
    ) -> SearchMemoryResponse:
        """Searches memory for the given query."""
        memories = []

        if hasattr(self.session_service, "db"):
            memories = await self._load_firestore_memories(app_name, user_id)
        else:
            memories = self._local_memories

        # Simple keyword search
        if query:
            query_words = _extract_words_lower(query)
            filtered = []
            for mem in memories:
                if not mem.content or not mem.content.parts:
                    continue
                # Extract text from content parts
                text_content = " ".join(
                    part.text for part in mem.content.parts if part.text
                )
                mem_words = _extract_words_lower(text_content)
                # Match if any query word appears in the memory
                if any(qw in mem_words for qw in query_words):
                    filtered.append(mem)
            memories = filtered

        return SearchMemoryResponse(memories=memories)

    async def _load_firestore_memories(
        self, app_name: str, user_id: str
    ) -> list[MemoryEntry]:
        """Loads memories from Firestore."""
        client = self.session_service.db  # type: ignore
        # Structure: users/{user_id}/memories
        collection = client.collection("users").document(user_id).collection("memories")

        query = collection.where(filter=FieldFilter("app_name", "==", app_name))

        memories = []
        async for doc in query.stream():
            try:
                data = doc.to_dict()
                # Remove extra fields we added for indexing
                data.pop("app_name", None)
                data.pop("user_id", None)
                memories.append(MemoryEntry.model_validate(data))
            except Exception as e:
                logger.warning(f"Failed to parse memory doc {doc.id}: {e}")

        return memories

    async def add_session_to_memory(self, session: Session) -> None:
        """Ingests a session into memory.

        Extracts structured information from session state and conversation
        events, maps them to schema categories, and stores them in memory.
        Uses category-based deduplication: newer entries overwrite older ones
        with the same category.
        """
        logger.info(
            f"Session {session.id}: "
            f"state_keys={list(session.state.keys())}, "
            f"events_count={len(session.events)}"
        )
        entries = self._extract_memories_from_session(session)
        if not entries:
            logger.info(f"No memories to extract from session {session.id}")
            return

        if hasattr(self.session_service, "db"):
            await self._consolidate_firestore_memories(
                session.app_name, session.user_id, entries
            )
        else:
            self._consolidate_local_memories(entries)

        logger.info(f"Ingested {len(entries)} memory entries from session {session.id}")

    def _extract_memories_from_session(self, session: Session) -> list[MemoryEntry]:
        """Extracts categorized memory entries from a session.

        Maps session state and conversation events to structured memory entries
        following the memory schema categories.
        """
        entries: list[MemoryEntry] = []
        state = session.state
        now = datetime.now(UTC).isoformat()

        # --- User profile (name, email, location, height) ---
        profile_fields: dict[str, Any] = {}
        test_drive_req = state.get("user:test_drive_request")
        if isinstance(test_drive_req, dict):
            user_info = test_drive_req.get("user_info", {})
            if user_info.get("name"):
                profile_fields["full_name"] = user_info["name"]
            if user_info.get("email"):
                profile_fields["email_address"] = user_info["email"]
            if user_info.get("height"):
                profile_fields["height_cm"] = user_info["height"]

        retailer_data = state.get("user:selected_retailer")
        if isinstance(retailer_data, dict):
            location = retailer_data.get("location", {})
            if location.get("city"):
                profile_fields["location_city"] = location["city"]

        if profile_fields:
            entries.append(
                MemoryEntry(
                    id=str(uuid.uuid4()),
                    content=types.Content(
                        parts=[types.Part(text=json.dumps(profile_fields, default=str))]
                    ),
                    custom_metadata={"category": CATEGORY_USER_PROFILE},
                    timestamp=now,
                    author="system",
                )
            )

        # --- Car preferences ---
        car_config = state.get("user:car_config")
        if isinstance(car_config, dict) and car_config.get("model"):
            entries.append(
                MemoryEntry(
                    id=str(uuid.uuid4()),
                    content=types.Content(
                        parts=[types.Part(text=json.dumps(car_config, default=str))]
                    ),
                    custom_metadata={"category": CATEGORY_CAR_PREFERENCES},
                    timestamp=now,
                    author="system",
                )
            )

        # --- WoW preferences (music, ambient light) ---
        wow_fields: dict[str, Any] = {}
        if isinstance(test_drive_req, dict):
            user_info = test_drive_req.get("user_info", {})
            if user_info.get("music"):
                wow_fields["music_preference"] = user_info["music"]
            if user_info.get("light"):
                wow_fields["ambient_light_preference"] = user_info["light"]

        if wow_fields:
            entries.append(
                MemoryEntry(
                    id=str(uuid.uuid4()),
                    content=types.Content(
                        parts=[types.Part(text=json.dumps(wow_fields, default=str))]
                    ),
                    custom_metadata={"category": CATEGORY_WOW_PREFERENCES},
                    timestamp=now,
                    author="system",
                )
            )

        # --- Selected retailer ---
        if isinstance(retailer_data, dict) and retailer_data.get("name"):
            entries.append(
                MemoryEntry(
                    id=str(uuid.uuid4()),
                    content=types.Content(
                        parts=[types.Part(text=json.dumps(retailer_data, default=str))]
                    ),
                    custom_metadata={"category": CATEGORY_SELECTED_RETAILER},
                    timestamp=now,
                    author="system",
                )
            )

        # --- Test drive booking ---
        if isinstance(test_drive_req, dict):
            appointment = test_drive_req.get("appointment_slot")
            if isinstance(appointment, dict) and appointment.get("date"):
                booking_data = {
                    "appointment_slot": appointment,
                    "retailer_name": test_drive_req.get("retailer", {}).get("name"),
                }
                entries.append(
                    MemoryEntry(
                        id=str(uuid.uuid4()),
                        content=types.Content(
                            parts=[
                                types.Part(text=json.dumps(booking_data, default=str))
                            ]
                        ),
                        custom_metadata={"category": CATEGORY_TEST_DRIVE_BOOKING},
                        timestamp=now,
                        author="system",
                    )
                )

        # --- Session transcript (conversation text) ---
        transcript_lines: list[str] = []
        for event in session.events:
            if not event.content or not event.content.parts:
                continue
            # Skip function call/response events
            if event.get_function_calls() or event.get_function_responses():
                continue
            text_parts = [part.text for part in event.content.parts if part.text]
            if text_parts:
                text = " ".join(text_parts).replace("\n", " ")
                transcript_lines.append(f"{event.author}: {text}")

        if transcript_lines:
            entries.append(
                MemoryEntry(
                    id=str(uuid.uuid4()),
                    content=types.Content(
                        parts=[types.Part(text="\n".join(transcript_lines))]
                    ),
                    custom_metadata={"category": CATEGORY_SESSION_TRANSCRIPT},
                    timestamp=now,
                    author="system",
                )
            )

        return entries

    async def _consolidate_firestore_memories(
        self, app_name: str, user_id: str, entries: list[MemoryEntry]
    ) -> None:
        """Upserts memory entries in Firestore, deduplicating by category.

        For each new entry, if an existing memory with the same category
        exists, it is overwritten. Otherwise a new document is created.
        """
        client = self.session_service.db  # type: ignore
        collection = client.collection("users").document(user_id).collection("memories")

        for entry in entries:
            category = entry.custom_metadata.get("category")
            if not category:
                await self._save_firestore_memory(app_name, user_id, entry)
                continue

            # Query for existing memory with the same category
            query = collection.where(
                filter=FieldFilter("app_name", "==", app_name)
            ).where(filter=FieldFilter("custom_metadata.category", "==", category))

            existing_doc_id = None
            async for doc in query.limit(1).stream():
                existing_doc_id = doc.id

            doc_data = entry.model_dump(mode="json", exclude_none=True)
            doc_data["app_name"] = app_name
            doc_data["user_id"] = user_id

            if existing_doc_id:
                # Overwrite existing document
                await collection.document(existing_doc_id).set(doc_data)
                logger.debug(
                    f"Updated existing memory '{category}' (doc: {existing_doc_id})"
                )
            else:
                # Create new document
                await collection.document(entry.id).set(doc_data)
                logger.debug(f"Created new memory '{category}'")

    def _consolidate_local_memories(self, entries: list[MemoryEntry]) -> None:
        """Upserts memory entries in local memory, deduplicating by category."""
        for entry in entries:
            category = entry.custom_metadata.get("category")
            if category:
                # Remove existing entry with the same category
                self._local_memories = [
                    m
                    for m in self._local_memories
                    if m.custom_metadata.get("category") != category
                ]
            self._local_memories.append(entry)
