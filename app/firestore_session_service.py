import logging
from typing import Optional

from google.adk.events.event import Event
from google.adk.sessions.base_session_service import BaseSessionService, ListSessionsResponse
from google.adk.sessions.session import Session
from google.cloud import firestore  # type: ignore

logger = logging.getLogger(__name__)


class FirestoreSessionService(BaseSessionService):
    """A session service that stores sessions in Google Cloud Firestore.

    Structure:
    - Collection: active_sessions (configurable)
        - Document: {session_id} (contains Session fields like user_id, app_name)
            - Sub-collection: events
                - Document: {event_id} (contains Event data)
    """

    def __init__(
        self,
        collection_name: str = "active_sessions",
        project_id: Optional[str] = None,
        database: str = "(default)",
    ):
        # uses GOOGLE_APPLICATION_CREDENTIALS or gcloud auth
        try:
            self.db = firestore.Client(project=project_id, database=database)
            self.collection = self.db.collection(collection_name)
            logger.info(
                f"FirestoreSessionService initialized. Project: {self.db.project}, Collection: {collection_name}"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Firestore client: {e}")
            raise

    async def get_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> Optional[Session]:
        """Retrieves a session from Firestore, including its events."""
        session_ref = self.collection.document(session_id)
        session_doc = session_ref.get()

        if not session_doc.exists:
            return None

        data = session_doc.to_dict()
        if not data:
            return None

        # Validate ownership
        if data.get("app_name") != app_name or data.get("user_id") != user_id:
            logger.warning(
                f"Session {session_id} found but app/user mismatch. "
                f"Expected {app_name}/{user_id}, got {data.get('app_name')}/{data.get('user_id')}"
            )
            return None

        # Fetch events from sub-collection, ordered by timestamp
        events_ref = session_ref.collection("events")
        # Ordering by timestamp ensures correct history reconstruction
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

        # Reconstruct session
        # We start with empty events list and populate it
        # (Session model might expect events in init or we assign them)
        try:
            # We construct Session from the base data, then set events
            # Note: Session.model_validate might fail if 'events' field in data is missing or empty if it's required.
            # Usually we don't store the massive full events list in the root doc to save space/cost,
            # so we inject the fetched events into the data dict before validation if possible,
            # OR we validate the session and then set events.
            
            # Let's try to inject events into data before validation
            # converting events to dicts again might be inefficient but safe for Pydantic validation
            data["events"] = [e.model_dump(mode='json') for e in events]
            
            return Session.model_validate(data)
        except Exception as e:
            logger.error(f"Failed to reconstruct session {session_id}: {e}")
            return None

    async def create_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> Session:
        """Creates a new session document."""
        session = Session(app_name=app_name, user_id=user_id, id=session_id)
        
        session_ref = self.collection.document(session_id)
        
        # Save session metadata (excluding events list to keep root doc light)
        session_data = session.model_dump(mode="json", exclude={"events"})
        session_ref.set(session_data)
        
        return session

    async def delete_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> None:
        """Deletes a session and its sub-collections (manually, as Firestore doesn't verify deep delete)."""
        session_ref = self.collection.document(session_id)
        
        # Delete events sub-collection (batch delete recommended for large collections, 
        # but for simple sessions loop is okay for now)
        # Note: In Cloud Run, extensive deletes might timeout. 
        # For MVP, we'll delete a batch.
        events_ref = session_ref.collection("events")
        docs = events_ref.limit(100).stream()
        for doc in docs:
            doc.reference.delete()
            
        session_ref.delete()

    async def list_sessions(
        self, *, app_name: str, user_id: Optional[str] = None
    ) -> ListSessionsResponse:
        """Lists sessions from Firestore."""
        query = self.collection.where("app_name", "==", app_name)
        if user_id:
            query = query.where("user_id", "==", user_id)
            
        # We might want to limit this query if there are too many sessions
        docs = query.limit(50).stream()
        
        sessions = []
        for doc in docs:
            data = doc.to_dict()
            if data:
                try:
                    # 'events' might be missing in root doc, which is fine for listing
                    # if Session validation allows it.
                    # If Session requires 'events', we might need to set it to []
                    if "events" not in data:
                        data["events"] = []
                    sessions.append(Session.model_validate(data))
                except Exception as e:
                    logger.warning(f"Failed to parse session {doc.id}: {e}")
                    
        return ListSessionsResponse(sessions=sessions)

    async def append_event(self, *, session: Session, event: Event) -> None:
        """Appends an event to the session's events sub-collection."""
        session.events.append(event)
        
        session_ref = self.collection.document(session.id)
        events_ref = session_ref.collection("events")
        
        # Use event.id as document ID if available, else auto-id
        event_data = event.model_dump(mode="json")
        doc_id = event.id if event.id else None
        
        if doc_id:
            events_ref.document(doc_id).set(event_data)
        else:
            events_ref.add(event_data)
        
        # Optionally update 'updated_at' in root session doc
        # session_ref.update({"updated_at": firestore.SERVER_TIMESTAMP})
