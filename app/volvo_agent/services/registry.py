import logging
import os

from google import genai
from google.adk.memory.base_memory_service import BaseMemoryService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.sessions.base_session_service import BaseSessionService
from google.adk.sessions.in_memory_session_service import InMemorySessionService

from .firestore_memory_service import FirestoreMemoryService
from .firestore_session_service import FirestoreSessionService

logger = logging.getLogger(__name__)

# ========================================
# Service Initialization
# ========================================

use_firestore = os.getenv("USE_FIRESTORE", "false").lower() == "true"
google_cloud_project = os.getenv("GOOGLE_CLOUD_PROJECT", "vml-map-xd-volvo")
firestore_db = os.getenv("FIRESTORE_DB", "volvo-vaen")

session_service: BaseSessionService
memory_service: BaseMemoryService

if use_firestore:
    if not google_cloud_project:
        logger.warning("USE_FIRESTORE is True but GOOGLE_CLOUD_PROJECT is not set.")
    logger.info("Using FirestoreSessionService + FirestoreMemoryService")
    session_service = FirestoreSessionService(
        project_id=google_cloud_project, database=firestore_db
    )
    memory_service = FirestoreMemoryService(
        project_id=google_cloud_project, database=firestore_db
    )
else:
    logger.info("Using InMemorySessionService + InMemoryMemoryService")
    session_service = InMemorySessionService()
    memory_service = InMemoryMemoryService()

genai_client = genai.Client()
