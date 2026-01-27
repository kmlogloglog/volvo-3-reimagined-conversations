import json
import logging
import os
from pathlib import Path
from typing import Optional

from google.adk.events.event import Event
from google.adk.sessions.base_session_service import BaseSessionService, ListSessionsResponse
from google.adk.sessions.session import Session

logger = logging.getLogger(__name__)


class FileSessionService(BaseSessionService):
    """A session service that stores sessions as JSON files in a local directory."""

    def __init__(self, storage_dir: str = ".sessions"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"FileSessionService initialized with storage_dir={self.storage_dir}")

    def _get_session_path(self, app_name: str, user_id: str, session_id: str) -> Path:
        """Returns the file path for a given session."""
        # Sanitize filenames to avoid issues
        safe_app_name = "".join(c for c in app_name if c.isalnum() or c in ("-", "_"))
        safe_user_id = "".join(c for c in user_id if c.isalnum() or c in ("-", "_"))
        safe_session_id = "".join(c for c in session_id if c.isalnum() or c in ("-", "_"))
        
        # Structure: .sessions/app_name/user_id/session_id.json
        session_dir = self.storage_dir / safe_app_name / safe_user_id
        session_dir.mkdir(parents=True, exist_ok=True)
        return session_dir / f"{safe_session_id}.json"

    async def get_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> Optional[Session]:
        """Retrieves a session from the file system."""
        session_path = self._get_session_path(app_name, user_id, session_id)
        if not session_path.exists():
            return None

        try:
            with open(session_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Use model_validate to reconstruct the Session object from JSON dict
            return Session.model_validate(data)
        except Exception as e:
            logger.error(f"Failed to load session {session_id}: {e}")
            return None

    async def create_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> Session:
        """Creates a new session and saves it to a file."""
        session = Session(app_name=app_name, user_id=user_id, id=session_id)
        await self._save_session(session)
        return session

    async def delete_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> None:
        """Deletes a session file."""
        session_path = self._get_session_path(app_name, user_id, session_id)
        if session_path.exists():
            os.remove(session_path)

    async def list_sessions(
        self, *, app_name: str, user_id: Optional[str] = None
    ) -> ListSessionsResponse:
        """Lists all sessions for a user or all users (if user_id is None)."""
        safe_app_name = "".join(c for c in app_name if c.isalnum() or c in ("-", "_"))
        app_dir = self.storage_dir / safe_app_name
        
        if not app_dir.exists():
            return ListSessionsResponse(sessions=[])
            
        sessions = []
        
        # If user_id is provided, only list that user's sessions
        if user_id:
            safe_user_id = "".join(c for c in user_id if c.isalnum() or c in ("-", "_"))
            user_dirs = [app_dir / safe_user_id]
        else:
            # List all user directories
            user_dirs = [d for d in app_dir.iterdir() if d.is_dir()]
            
        for user_dir in user_dirs:
            if not user_dir.exists():
                continue
                
            for session_file in user_dir.glob("*.json"):
                try:
                    with open(session_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    # We might not need full events for listing, but BaseSessionService returns Session objects
                    # Optimally we should load minimal info, but Session model requires certain fields.
                    # Let's load full session for now as it's local file.
                    sessions.append(Session.model_validate(data))
                except Exception as e:
                    logger.warning(f"Failed to load session {session_file}: {e}")
                    
        return ListSessionsResponse(sessions=sessions)

    async def append_event(self, *, session: Session, event: Event) -> None:
        """Appends an event to the session and saves the updated session."""
        session.events.append(event)
        await self._save_session(session)

    async def _save_session(self, session: Session) -> None:
        """Saves the session object to a JSON file."""
        session_path = self._get_session_path(
            session.app_name, session.user_id, session.id
        )
        try:
            # model_dump(mode='json') ensures serialization of datetime/Pydantic types
            data = session.model_dump(mode="json")
            with open(session_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save session {session.id}: {e}")
            raise
