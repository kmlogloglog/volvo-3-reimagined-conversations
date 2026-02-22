import logging
from datetime import UTC, datetime

from google.adk.agents.callback_context import CallbackContext

from ..services.firestore_memory_service import SUMMARY_DOC_ID, FirestoreMemoryService
from ..services.registry import memory_service
from ..utils import load_car_configurations

logger = logging.getLogger(__name__)


async def preload_memories(callback_context: CallbackContext) -> None:
    """Initializes session state and loads memories from previous sessions.

    Called once at the start of each run_live invocation via
    before_agent_callback. Injects car configurations and current datetime
    as temp: state (not persisted). Loads the LLM-generated session summary
    from FirestoreMemoryService if available.

    Note: user: state (full_name, email, etc.) is loaded automatically by the
    session service via get_session — no callback action needed.
    """
    # Inject transient values (temp: prefix = not persisted)
    callback_context.state["temp:car_configurations"] = load_car_configurations()
    callback_context.state["temp:current_datetime"] = datetime.now(UTC).strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    # Summary loading is only available with our Firestore-backed service
    if not isinstance(memory_service, FirestoreMemoryService):
        return None

    session = callback_context.session
    user_id = session.user_id

    # Skip if already loaded for this session
    if callback_context.state.get("temp:_memories_loaded"):
        return None

    try:
        memories = await memory_service.load_user_memories(user_id)
    except Exception as e:
        logger.warning(f"Failed to preload memories for user {user_id}: {e}")
        return None

    if not memories:
        return None

    if SUMMARY_DOC_ID in memories and isinstance(memories[SUMMARY_DOC_ID], str):
        callback_context.state["temp:past_interactions_summary"] = memories[
            SUMMARY_DOC_ID
        ]
        callback_context.state["temp:_memories_loaded"] = True
        logger.info(f"Preloaded session summary for user {user_id}")

    return None
