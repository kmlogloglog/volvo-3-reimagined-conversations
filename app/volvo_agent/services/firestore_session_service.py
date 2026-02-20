import os

# Suppress verbose gRPC C++ logs from the async Firestore client
os.environ.setdefault("GRPC_VERBOSITY", "ERROR")
os.environ.setdefault("GRPC_ENABLE_FORK_SUPPORT", "0")

import logging
from typing import Any, Optional

from google.adk.events.event import Event
from google.adk.sessions.base_session_service import (
    BaseSessionService,
    GetSessionConfig,
    ListSessionsResponse,
)
from google.adk.sessions.session import Session
from google.cloud.firestore_v1.async_client import AsyncClient
from google.cloud.firestore_v1.base_query import FieldFilter

logger = logging.getLogger(__name__)


class FirestoreSessionService(BaseSessionService):
    """A session service that stores sessions in Google Cloud Firestore.

    Structure:
    - Collection: {root_collection} (default="users")
        - Document: {user_id}
            - Sub-collection: sessions
                - Document: {session_id} (contains Session metadata)
                    - Sub-collection: events
                        - Document: {event_id} (contains Event data)
    """

    def __init__(
        self,
        root_collection: str = "users",
        project_id: str | None = None,
        database: str = "(default)",
    ):
        # uses GOOGLE_APPLICATION_CREDENTIALS or gcloud auth
        try:
            self.db = AsyncClient(project=project_id, database=database)
            self.root_collection = self.db.collection(root_collection)
            logger.info(
                f"FirestoreSessionService initialized. Project: {self.db.project}, Root: {root_collection}"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Firestore client: {e}")
            raise

    def _get_session_ref(self, user_id: str, session_id: str) -> Any:
        """Returns the document reference for a session."""
        return (
            self.root_collection.document(user_id)
            .collection("sessions")
            .document(session_id)
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

        # Fetch events from sub-collection, ordered by timestamp
        events_ref = session_ref.collection("events")

        # TODO: Implement event filtering based on GetSessionConfig

        events = []
        async for event_doc in events_ref.order_by("timestamp").stream():
            event_data = event_doc.to_dict()
            if event_data:
                try:
                    events.append(Event.model_validate(event_data))
                except Exception as e:
                    logger.warning(
                        f"Failed to parse event {event_doc.id} in session {session_id}: {e}"
                    )

        try:
            data["events"] = [e.model_dump(mode="json") for e in events]
            return Session.model_validate(data)
        except Exception as e:
            logger.error(f"Failed to reconstruct session {session_id}: {e}")
            return None

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

        session = Session(
            app_name=app_name, user_id=user_id, id=session_id, state=state
        )

        session_ref = self._get_session_ref(user_id, session_id)

        # Save session metadata (excluding events list to keep root doc light)
        session_data = session.model_dump(mode="json", exclude={"events"})
        await session_ref.set(session_data)

        return session

    async def delete_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> None:
        """Deletes a session and its sub-collections."""
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
        """Lists sessions from Firestore."""
        sessions = []

        if user_id:
            # Efficient: List only sessions for this user
            sessions_ref = self.root_collection.document(user_id).collection("sessions")
            query = sessions_ref.where(filter=FieldFilter("app_name", "==", app_name))
            stream = query.limit(50).stream()
        else:
            # Less efficient: Query all sessions via Collection Group
            # Requires 'sessions' collectionGroup index if we sort/filter strictly
            # For now we just query collectionGroup('sessions').where(...)
            # Note: This might require an index creation link in logs
            query = self.db.collection_group("sessions").where(
                filter=FieldFilter("app_name", "==", app_name)
            )
            stream = query.limit(50).stream()

        async for doc in stream:
            data = doc.to_dict()
            if data:
                try:
                    if "events" not in data:
                        data["events"] = []
                    sessions.append(Session.model_validate(data))
                except Exception as e:
                    logger.warning(f"Failed to parse session {doc.id}: {e}")

        return ListSessionsResponse(sessions=sessions)

    async def append_event(self, session: Session, event: Event) -> None:  # type: ignore
        """Appends an event to the session's events sub-collection."""
        session.events.append(event)
        session.last_update_time = event.timestamp

        session_ref = self._get_session_ref(session.user_id, session.id)
        events_ref = session_ref.collection("events")

        # Use event.id as document ID if available, else auto-id
        event_data = event.model_dump(mode="json")
        doc_id = event.id if event.id else None

        if doc_id:
            await events_ref.document(doc_id).set(event_data)
        else:
            await events_ref.add(event_data)

        # Persist state deltas to the session document
        if event.actions and event.actions.state_delta:
            # Filter out temp: keys (not persisted) and apply the rest
            state_update = {
                k: v
                for k, v in event.actions.state_delta.items()
                if not k.startswith("temp:")
            }
            if state_update:
                session.state.update(state_update)
                await session_ref.set(
                    {"state": session.state, "last_update_time": event.timestamp},
                    merge=True,
                )

    async def update_session(self, session: Session) -> None:
        """Updates session metadata in Firestore."""
        session_ref = self._get_session_ref(session.user_id, session.id)
        # Update session data, excluding events to avoid overwriting/duplicating
        session_data = session.model_dump(mode="json", exclude={"events"})
        # Use set with merge=True to update fields without deleting unmentioned ones
        # (though we are dumping the whole session model so it should be complete metadata)
        await session_ref.set(session_data, merge=True)
