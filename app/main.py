"""FastAPI application with OpenAI Realtime API WebSocket relay."""

import asyncio
import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Load environment variables from .env file BEFORE importing modules
load_dotenv(Path(__file__).parent / ".env")

from .volvo_agent.realtime.session_handler import SessionHandler  # noqa: E402
from .volvo_agent.services import sqlite_service  # noqa: E402

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Mount static files
static_dir = Path(__file__).parent.parent / "debug_frontend"
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.on_event("startup")
async def startup() -> None:
    await sqlite_service.init_db()


@app.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
) -> None:
    """WebSocket endpoint — relays audio/text between browser and OpenAI Realtime."""
    await websocket.accept()
    logger.info("WebSocket accepted: user=%s session=%s", user_id, session_id)

    handler = SessionHandler(user_id, session_id)

    try:
        await handler.initialize()
    except Exception as e:
        logger.error("Failed to initialize session: %s", e)
        await websocket.send_text(
            json.dumps({"author": "system", "error": {"message": str(e)}})
        )
        await websocket.close()
        return

    async def upstream_task() -> None:
        """Browser → OpenAI: forward audio and text."""
        try:
            while True:
                message = await websocket.receive()
                await handler.handle_upstream(message)
        except (WebSocketDisconnect, RuntimeError):
            logger.info("Client disconnected (upstream)")

    async def downstream_task() -> None:
        """OpenAI → queue: receive events, handle tools, translate."""
        try:
            await handler.run_downstream()
        except Exception as e:
            logger.error("Downstream error: %s", e)

    async def outbound_task() -> None:
        """Queue → browser: send translated events."""
        try:
            while True:
                event = await handler.outbound_queue.get()
                await websocket.send_text(json.dumps(event))
        except (WebSocketDisconnect, RuntimeError):
            logger.info("Client disconnected (outbound)")

    try:
        await asyncio.gather(upstream_task(), downstream_task(), outbound_task())
    except Exception as e:
        logger.info("Session ended: %s", e)
    finally:
        await handler.cleanup()


# ========================================
# HTTP Endpoints
# ========================================
DEBUG_ROOT_ENDPOINT = os.getenv("DEBUG_ROOT_ENDPOINT", "false").lower() == "true"

if DEBUG_ROOT_ENDPOINT:

    @app.get("/")
    async def debug_ui() -> FileResponse:
        """Serve the debug UI."""
        return FileResponse(
            Path(__file__).parent.parent / "debug_frontend" / "index.html"
        )
else:

    @app.get("/debug")
    async def debug_ui() -> FileResponse:
        """Serve the debug UI."""
        return FileResponse(
            Path(__file__).parent.parent / "debug_frontend" / "index.html"
        )

    @app.get("/")
    async def root() -> dict:
        return {"status": "ok", "service": "Volvo Freja (OpenAI Realtime)"}
