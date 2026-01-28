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
from google.genai import types

logger = logging.getLogger(__name__)


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
        # Note: Firestore client is sync, so we don't await this
        collection.document(entry.id).set(doc_data)

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

        query = collection.where("app_name", "==", app_name)
        docs = query.stream()

        memories = []
        # Firestore stream is sync
        for doc in docs:
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

        This could summarization the session and store it as a 'fact'.
        For now, we leave it as a placeholder or implement a simple summarizer later.
        """
        pass
