import copy
import logging
from typing import Any, Optional

from google.adk.events.event import Event
from google.adk.sessions import _session_util
from google.adk.sessions.base_session_service import (
    BaseSessionService,
    GetSessionConfig,
    ListSessionsResponse,
)
from google.adk.sessions.session import Session
from google.adk.sessions.state import State
from google.cloud.firestore_v1.async_client import AsyncClient
from google.cloud.firestore_v1.base_query import FieldFilter

logger = logging.getLogger(__name__)


def _merge_state(
    app_state: dict[str, Any],
    user_state: dict[str, Any],
    session_state: dict[str, Any],
) -> dict[str, Any]:
    """Merge app, user, and session states into a single state dictionary.

    Re-adds the ``app:`` and ``user:`` prefixes that were stripped during
    storage so the caller sees the canonical key names.
    """
    merged = copy.deepcopy(session_state)
    for key, value in app_state.items():
        merged[State.APP_PREFIX + key] = value
    for key, value in user_state.items():
        merged[State.USER_PREFIX + key] = value
    return merged


class FirestoreSessionService(BaseSessionService):
    """A session service that stores sessions in Google Cloud Firestore.

    Follows ADK's state separation convention:
    - ``app:`` keys  → ``app_state/{app_name}`` (shared across all users)
    - ``user:`` keys → ``users/{user_id}/user_state/{app_name}`` (shared across sessions)
    - ``temp:`` keys → **not persisted** (stripped before storage)
    - unprefixed keys → session document (session-scoped)

    Structure::

        app_state/{app_name}                    → app-scoped state doc
        users/{user_id}/
            user_state/{app_name}               → user-scoped state doc
            sessions/{session_id}               → session metadata + session state
                events/{event_id}               → event docs
            memories/                           → used by FirestoreMemoryService
    """

    def __init__(
        self,
        root_collection: str = "users",
        project_id: str | None = None,
        database: str = "(default)",
    ):
        try:
            self.db = AsyncClient(project=project_id, database=database)
            self.root_collection = self.db.collection(root_collection)
            logger.info(
                f"FirestoreSessionService initialized. "
                f"Project: {self.db.project}, Root: {root_collection}"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Firestore client: {e}")
            raise

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_session_ref(self, user_id: str, session_id: str) -> Any:
        """Returns the document reference for a session."""
        return (
            self.root_collection.document(user_id)
            .collection("sessions")
            .document(session_id)
        )

    def _get_app_state_ref(self, app_name: str) -> Any:
        """Returns the document reference for app-scoped state."""
        return self.db.collection("app_state").document(app_name)

    def _get_user_state_ref(self, user_id: str, app_name: str) -> Any:
        """Returns the document reference for user-scoped state."""
        return (
            self.root_collection.document(user_id)
            .collection("user_state")
            .document(app_name)
        )

    async def _load_app_state(self, app_name: str) -> dict[str, Any]:
        """Load app-scoped state from Firestore."""
        doc = await self._get_app_state_ref(app_name).get()
        if doc.exists:
            data = doc.to_dict()
            if data and "state" in data:
                return data["state"]
        return {}

    async def _load_user_state(self, user_id: str, app_name: str) -> dict[str, Any]:
        """Load user-scoped state from Firestore."""
        doc = await self._get_user_state_ref(user_id, app_name).get()
        if doc.exists:
            data = doc.to_dict()
            if data and "state" in data:
                return data["state"]
        return {}

    async def _save_app_state(self, app_name: str, delta: dict[str, Any]) -> None:
        """Merge app-scoped state delta into Firestore."""
        if not delta:
            return
        ref = self._get_app_state_ref(app_name)
        doc = await ref.get()
        existing = {}
        if doc.exists:
            data = doc.to_dict()
            if data and "state" in data:
                existing = data["state"]
        existing.update(delta)
        await ref.set({"state": existing})

    async def _save_user_state(
        self, user_id: str, app_name: str, delta: dict[str, Any]
    ) -> None:
        """Merge user-scoped state delta into Firestore."""
        if not delta:
            return
        ref = self._get_user_state_ref(user_id, app_name)
        doc = await ref.get()
        existing = {}
        if doc.exists:
            data = doc.to_dict()
            if data and "state" in data:
                existing = data["state"]
        existing.update(delta)
        await ref.set({"state": existing})

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def create_session(
        self,
        *,
        app_name: str,
        user_id: str,
        state: dict[str, Any] | None = None,
        session_id: str | None = None,
    ) -> Session:
        """Creates a new session document."""
        if session_id is None:
            raise ValueError("session_id is required for FirestoreSessionService")

        if state is None:
            state = {}

        # Split initial state into app, user, and session tiers
        state_deltas = _session_util.extract_state_delta(state)
        app_state_delta = state_deltas["app"]
        user_state_delta = state_deltas["user"]
        session_state = state_deltas["session"]

        # Persist app and user state separately
        await self._save_app_state(app_name, app_state_delta)
        await self._save_user_state(user_id, app_name, user_state_delta)

        # Create session with session-scoped state only
        session = Session(
            app_name=app_name,
            user_id=user_id,
            id=session_id,
            state=session_state,
        )

        session_ref = self._get_session_ref(user_id, session_id)
        session_data = session.model_dump(mode="json", exclude={"events"})
        await session_ref.set(session_data)

        # Return session with merged state (so caller sees full state)
        app_state = await self._load_app_state(app_name)
        user_state = await self._load_user_state(user_id, app_name)
        merged_state = _merge_state(app_state, user_state, session_state)

        return Session(
            app_name=app_name,
            user_id=user_id,
            id=session_id,
            state=merged_state,
        )

    async def get_session(
        self,
        *,
        app_name: str,
        user_id: str,
        session_id: str,
        config: Optional[GetSessionConfig] = None,
    ) -> Session | None:
        """Retrieves a session from Firestore, including its events."""
        session_ref = self._get_session_ref(user_id, session_id)
        session_doc = await session_ref.get()

        if not session_doc.exists:
            return None

        data = session_doc.to_dict()
        if not data:
            return None

        # Validate ownership/app
        if data.get("app_name") != app_name:
            logger.warning(
                f"Session {session_id} found but app mismatch. "
                f"Expected {app_name}, got {data.get('app_name')}"
            )
            return None

        # Load session-scoped state from the session document
        session_state = data.get("state", {})

        # Load app and user state, merge with prefixes
        app_state = await self._load_app_state(app_name)
        user_state = await self._load_user_state(user_id, app_name)
        merged_state = _merge_state(app_state, user_state, session_state)

        # Fetch events from sub-collection, ordered by timestamp
        events_ref = session_ref.collection("events")
        query = events_ref.order_by("timestamp")

        if config and config.after_timestamp:
            query = query.where(
                filter=FieldFilter("timestamp", ">=", config.after_timestamp)
            )

        events: list[Event] = []
        async for event_doc in query.stream():
            event_data = event_doc.to_dict()
            if event_data:
                try:
                    events.append(Event.model_validate(event_data))
                except Exception as e:
                    logger.warning(
                        f"Failed to parse event {event_doc.id} "
                        f"in session {session_id}: {e}"
                    )

        if config and config.num_recent_events:
            events = events[-config.num_recent_events :]

        try:
            data["state"] = merged_state
            data["events"] = [e.model_dump(mode="json") for e in events]
            return Session.model_validate(data)
        except Exception as e:
            logger.error(f"Failed to reconstruct session {session_id}: {e}")
            return None

    async def delete_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> None:
        """Deletes a session and its events sub-collection."""
        session_ref = self._get_session_ref(user_id, session_id)

        # Delete all events in sub-collection (batch of 100 at a time)
        events_ref = session_ref.collection("events")
        while True:
            deleted = 0
            async for doc in events_ref.limit(100).stream():
                await doc.reference.delete()
                deleted += 1
            if deleted < 100:
                break

        await session_ref.delete()

    async def list_sessions(
        self, *, app_name: str, user_id: str | None = None
    ) -> ListSessionsResponse:
        """Lists sessions from Firestore with merged state."""
        # Load app state (shared across all sessions)
        app_state = await self._load_app_state(app_name)

        if user_id:
            sessions_ref = self.root_collection.document(user_id).collection("sessions")
            query = sessions_ref.where(filter=FieldFilter("app_name", "==", app_name))
            stream = query.limit(50).stream()
        else:
            query = self.db.collection_group("sessions").where(
                filter=FieldFilter("app_name", "==", app_name)
            )
            stream = query.limit(50).stream()

        # Cache user states to avoid repeated reads
        user_states: dict[str, dict[str, Any]] = {}
        sessions: list[Session] = []

        async for doc in stream:
            data = doc.to_dict()
            if not data:
                continue
            try:
                doc_user_id = data.get("user_id", "")
                if doc_user_id not in user_states:
                    user_states[doc_user_id] = await self._load_user_state(
                        doc_user_id, app_name
                    )

                session_state = data.get("state", {})
                merged_state = _merge_state(
                    app_state, user_states[doc_user_id], session_state
                )
                data["state"] = merged_state
                if "events" not in data:
                    data["events"] = []
                sessions.append(Session.model_validate(data))
            except Exception as e:
                logger.warning(f"Failed to parse session {doc.id}: {e}")

        return ListSessionsResponse(sessions=sessions)

    async def append_event(self, session: Session, event: Event) -> Event:
        """Appends an event to the session's events sub-collection.

        Follows ADK convention: strips temp: keys, separates app:/user:/session
        state, persists each to its own Firestore location, then delegates to
        the base class to update the in-memory session.
        """
        if event.partial:
            return event

        # Strip temp: keys from the event's state delta
        event = self._trim_temp_delta_state(event)

        # Persist the event document
        session_ref = self._get_session_ref(session.user_id, session.id)
        events_ref = session_ref.collection("events")

        event_data = event.model_dump(mode="json")
        doc_id = event.id if event.id else None

        if doc_id:
            await events_ref.document(doc_id).set(event_data)
        else:
            await events_ref.add(event_data)

        # Persist state deltas to the appropriate stores
        if event.actions and event.actions.state_delta:
            state_deltas = _session_util.extract_state_delta(event.actions.state_delta)
            app_state_delta = state_deltas["app"]
            user_state_delta = state_deltas["user"]
            session_state_delta = state_deltas["session"]

            await self._save_app_state(session.app_name, app_state_delta)
            await self._save_user_state(
                session.user_id, session.app_name, user_state_delta
            )

            if session_state_delta:
                # Read current session state, merge, and write back
                session_doc = await session_ref.get()
                current_state = {}
                if session_doc.exists:
                    data = session_doc.to_dict()
                    if data:
                        current_state = data.get("state", {})
                current_state.update(session_state_delta)
                await session_ref.set(
                    {
                        "state": current_state,
                        "last_update_time": event.timestamp,
                    },
                    merge=True,
                )

        # Update the in-memory session object via base class
        await super().append_event(session=session, event=event)
        session.last_update_time = event.timestamp

        return event

    async def update_session(self, session: Session) -> None:
        """Updates session metadata in Firestore.

        Separates prefixed state keys before writing to avoid storing
        app: or user: keys in the session document.
        """
        session_ref = self._get_session_ref(session.user_id, session.id)

        # Extract and separate state
        full_state = (
            session.state.to_dict()
            if hasattr(session.state, "to_dict")
            else dict(session.state)
        )
        state_deltas = _session_util.extract_state_delta(full_state)

        # Persist app and user state to their own stores
        await self._save_app_state(session.app_name, state_deltas["app"])
        await self._save_user_state(
            session.user_id, session.app_name, state_deltas["user"]
        )

        # Only store session-scoped state in the session document
        session_data = session.model_dump(mode="json", exclude={"events"})
        session_data["state"] = state_deltas["session"]
        await session_ref.set(session_data, merge=True)
