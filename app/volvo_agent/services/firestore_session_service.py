import logging
from typing import Any

from google.adk.events.event import Event
from google.adk.sessions.base_session_service import (
    BaseSessionService,
    ListSessionsResponse,
)
from google.adk.sessions.session import Session
from google.cloud import firestore  # type: ignore

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
            self.db = firestore.Client(project=project_id, database=database)
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

    async def get_session(  # type: ignore
        self,
        *,
        app_name: str,
        user_id: str,
        session_id: str,
        config: dict[str, Any] | None = None,  # Added config matching base,
        state: dict[str, Any] | None = None
    ) -> Session | None:
        """Retrieves a session from Firestore, including its events."""
        session_ref = self._get_session_ref(user_id, session_id)
        session_doc = session_ref.get()

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
        events_stream = events_ref.order_by("timestamp").stream()

        events = []
        for event_doc in events_stream:
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

        session = Session(app_name=app_name, user_id=user_id, id=session_id, state=state)

        session_ref = self._get_session_ref(user_id, session_id)

        # Save session metadata (excluding events list to keep root doc light)
        session_data = session.model_dump(mode="json", exclude={"events"})
        session_ref.set(session_data)

        return session

    async def delete_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> None:
        """Deletes a session and its sub-collections."""
        session_ref = self._get_session_ref(user_id, session_id)

        # Delete events sub-collection
        events_ref = session_ref.collection("events")
        docs = events_ref.limit(100).stream()
        for doc in docs:
            doc.reference.delete()

        session_ref.delete()

    async def list_sessions(
        self, *, app_name: str, user_id: str | None = None
    ) -> ListSessionsResponse:
        """Lists sessions from Firestore."""
        sessions = []

        if user_id:
            # Efficient: List only sessions for this user
            sessions_ref = self.root_collection.document(user_id).collection("sessions")
            query = sessions_ref.where("app_name", "==", app_name)
            docs = query.limit(50).stream()
        else:
            # Less efficient: Query all sessions via Collection Group
            # Requires 'sessions' collectionGroup index if we sort/filter strictly
            # For now we just query collectionGroup('sessions').where(...)
            # Note: This might require an index creation link in logs
            query = self.db.collection_group("sessions").where(
                "app_name", "==", app_name
            )
            docs = query.limit(50).stream()

        for doc in docs:
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

        session_ref = self._get_session_ref(session.user_id, session.id)
        events_ref = session_ref.collection("events")

        # Use event.id as document ID if available, else auto-id
        event_data = event.model_dump(mode="json")
        doc_id = event.id if event.id else None

        if doc_id:
            events_ref.document(doc_id).set(event_data)
        else:
            events_ref.add(event_data)

    async def update_session(self, session: Session) -> None:
        """Updates session metadata in Firestore."""
        session_ref = self._get_session_ref(session.user_id, session.id)
        # Update session data, excluding events to avoid overwriting/duplicating
        session_data = session.model_dump(mode="json", exclude={"events"})
        # Use set with merge=True to update fields without deleting unmentioned ones
        # (though we are dumping the whole session model so it should be complete metadata)
        session_ref.set(session_data, merge=True)
