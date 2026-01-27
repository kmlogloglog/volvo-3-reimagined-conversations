import asyncio
import shutil
import logging
from pathlib import Path
from app.file_session_service import FileSessionService
from google.adk.events.event import Event
from google.genai import types

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_file_session_service():
    test_dir = Path(".test_sessions")
    if test_dir.exists():
        shutil.rmtree(test_dir)
    
    service = FileSessionService(storage_dir=str(test_dir))
    
    app_name = "test-app"
    user_id = "user1"
    session_id = "session1"
    
    logger.info("Creating session...")
    session = await service.create_session(app_name=app_name, user_id=user_id, session_id=session_id)
    assert session.id == session_id
    
    logger.info("Appending event...")
    event = Event(
        author="user",
        content=types.Content(parts=[types.Part(text="Hello world")])
    )
    await service.append_event(session=session, event=event)
    
    logger.info("Retrieving session...")
    loaded_session = await service.get_session(app_name=app_name, user_id=user_id, session_id=session_id)
    assert loaded_session is not None
    assert len(loaded_session.events) == 1
    assert loaded_session.events[0].content.parts[0].text == "Hello world"
    
    logger.info("Cleaning up...")
    await service.delete_session(app_name=app_name, user_id=user_id, session_id=session_id)
    assert not (test_dir / app_name / user_id / f"{session_id}.json").exists()
    
    shutil.rmtree(test_dir)
    logger.info("Test passed!")

if __name__ == "__main__":
    asyncio.run(test_file_session_service())
