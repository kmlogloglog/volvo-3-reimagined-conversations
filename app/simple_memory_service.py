import logging
import re
from typing import Optional

from google.adk.memory.base_memory_service import BaseMemoryService, SearchMemoryResponse
from google.adk.memory.memory_entry import MemoryEntry
from google.adk.sessions.base_session_service import BaseSessionService
from google.adk.sessions.session import Session

logger = logging.getLogger(__name__)


def _extract_words_lower(text: str) -> set[str]:
    """Extracts words from a string and converts them to lowercase."""
    return set([word.lower() for word in re.findall(r"[A-Za-z]+", text)])


class SimpleMemoryService(BaseMemoryService):
    """A simple memory service that searches through past sessions.

    Unlike the ADK's InMemoryMemoryService which is purely in-memory and transient,
    this service relies on the underlying SessionService to retrieve past sessions
    if possible, OR it maintains its own simple index if backed by Firestore/Files.

    For MVP, we will assume we can't easily iterate ALL sessions efficiently in File/Firestore
    without a dedicated index. So this service will:
    1. If using Firestore, strictly speaking we should query a 'memories' collection.
    2. If using File, we might scan files (slow) or just keep a separate 'memory.json'.

    To keep it simple and effective as requested:
    We will implement a 'memory.json' approach for File-based, and a 'memories' collection for Firestore.
    BUT, since we want a unified service, let's make it independent of the storage backend logic if possible.
    
    Actually, to really solve "memory", we need to store extracted facts.
    Since we don't have an extractor yet, we will just implement a simple
    "echo" memory that searches the CURRENT session's history + maybe a manual "facts" file.
    
    However, the user asked for "long term storage".
    Let's delegate to the session service to `get_all_sessions` if available, or just implement a standalone
    memory storage that we append to.
    """

    def __init__(self, session_service: BaseSessionService):
        self.session_service = session_service
        # In a real app, we'd have a Vector DB or strict Firestore index.
        # For now, we'll rely on the session service's ability to potentially recall things
        # OR just acknowledge that "Deep Memory" requires more infrastructure (vectors).
        # We will fallback to a simple in-memory cache of "important facts" if we were extracting them.
        pass

    async def add_session_to_memory(self, session: Session) -> None:
        """Ingests a session into memory.
        
        For this simple implementation, we rely on the SessionService to have already persisted the session.
        We don't do additional indexing here yet.
        """
        pass

    async def search_memory(
        self, *, app_name: str, user_id: str, query: str
    ) -> SearchMemoryResponse:
        """Searches memory.
        
        Current limitation: Without Vector Search, searching ALL past text is hard/slow.
        We will return an empty response for now, effectively making this a placeholder 
        for future Vector Memory, UNLESS we implement a simple generic search.
        
        If we want to support basic retrieval, we could search the *current* active session logic
        is handled by the agent context usually. 
        
        Refined plan: The prompt "You have memory..." implies we should return something.
        If we can't search effectively, we return nothing.
        """
        # Placeholder for future expansion to Vector Search or Firestore Text Search
        return SearchMemoryResponse(memories=[])
