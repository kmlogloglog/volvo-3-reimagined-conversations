"""FastAPI application demonstrating ADK Bidi-streaming with WebSocket."""

# Suppress verbose gRPC C++ logs — must be set before any google.* import
import os

os.environ.setdefault("GRPC_VERBOSITY", "ERROR")
os.environ.setdefault("GRPC_ENABLE_FORK_SUPPORT", "0")

import asyncio
import base64
import json
import logging
import warnings
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.runners import Runner
from google.genai import types

# Load environment variables from .env file BEFORE importing agent and services
load_dotenv(Path(__file__).parent / ".env")

# Import agent and services after loading environment variables
# pylint: disable=wrong-import-position
from .volvo_agent.services.registry import (  # noqa: E402
    memory_service,
    session_service,
)
from .volvo_agent.volvo_agent import root_agent as agent  # noqa: E402

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Suppress Pydantic serialization warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

# Suppress ADK logging a normal WebSocket close (code 1000) as ERROR
logging.getLogger("google_adk.google.adk.flows.llm_flows.base_llm_flow").setLevel(
    logging.CRITICAL
)

# ========================================
# Phase 1: Application Initialization (once at startup)
# ========================================

APP_NAME = "volvo_vaen"
app = FastAPI()

# Mount static files
static_dir = Path(__file__).parent.parent / "debug_frontend"
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Define your runner
runner = Runner(
    app_name=APP_NAME,
    agent=agent,
    session_service=session_service,
    memory_service=memory_service,
)

# ========================================
# WebSocket Endpoint
# ========================================


@app.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
    proactivity: bool = True,
    affective_dialog: bool = True,
) -> None:
    """WebSocket endpoint for bidirectional streaming with ADK.

    Args:
        websocket: The WebSocket connection
        user_id: User identifier
        session_id: Session identifier
        proactivity: Enable proactive audio (native audio models only)
        affective_dialog: Enable affective dialog (native audio models only)
    """
    logger.debug(
        f"WebSocket connection request: user_id={user_id}, session_id={session_id}, "
        f"proactivity={proactivity}, affective_dialog={affective_dialog}"
    )
    await websocket.accept()
    logger.debug("WebSocket connection accepted")

    # ========================================
    # Phase 2: Session Initialization (once per streaming session)
    # ========================================

    # Automatically determine response modality based on model architecture
    # Native audio models (containing "native-audio" in name)
    # ONLY support AUDIO response modality.
    # Half-cascade models support both TEXT and AUDIO,
    # we default to TEXT for better performance.
    model_name = str(agent.model)
    is_native_audio = "native-audio" in model_name.lower()

    if is_native_audio:
        # Native audio models require AUDIO response modality
        # with audio transcription
        response_modalities = ["AUDIO"]

        # Build RunConfig with optional proactivity and affective dialog
        # These features are only supported on native audio models
        run_config = RunConfig(
            streaming_mode=StreamingMode.BIDI,
            response_modalities=response_modalities,
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
            session_resumption=types.SessionResumptionConfig(),
            proactivity=(
                types.ProactivityConfig(proactive_audio=True) if proactivity else None
            ),
            enable_affective_dialog=affective_dialog if affective_dialog else None,
        )
        logger.debug(
            f"Native audio model detected: {model_name}, "
            f"using AUDIO response modality, "
            f"proactivity={proactivity}, affective_dialog={affective_dialog}"
        )
    else:
        # Half-cascade models support TEXT response modality
        # for faster performance
        response_modalities = ["TEXT"]
        run_config = RunConfig(
            streaming_mode=StreamingMode.BIDI,
            response_modalities=response_modalities,
            input_audio_transcription=None,
            output_audio_transcription=None,
            session_resumption=types.SessionResumptionConfig(),
        )
        logger.debug(
            f"Half-cascade model detected: {model_name}, using TEXT response modality"
        )
        # Warn if user tried to enable native-audio-only features
        if proactivity or affective_dialog:
            logger.warning(
                f"Proactivity and affective dialog are only supported on native "
                f"audio models. Current model: {model_name}. "
                f"These settings will be ignored."
            )
    logger.debug(f"RunConfig created: {run_config}")

    # Get or create session (handles both new sessions and reconnections)
    session = await session_service.get_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id,
    )
    if not session:
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
        )

    live_request_queue = LiveRequestQueue()

    # Track events and state deltas during the live session
    # so we can ingest them into memory on disconnect
    live_events: list[Any] = []
    accumulated_state: dict[str, Any] = {}

    # ========================================
    # Phase 3: Active Session (concurrent bidirectional communication)
    # ========================================

    async def upstream_task() -> None:
        """Receives messages from WebSocket and sends to LiveRequestQueue."""
        logger.debug("upstream_task started")
        try:
            while True:
                # Receive message from WebSocket (text or binary)
                message = await websocket.receive()

                # Handle binary frames (audio data)
                if "bytes" in message:
                    audio_data = message["bytes"]
                    logger.debug(
                        f"Received binary audio chunk: {len(audio_data)} bytes"
                    )

                    audio_blob = types.Blob(
                        mime_type="audio/pcm;rate=16000", data=audio_data
                    )
                    live_request_queue.send_realtime(audio_blob)

                # Handle text frames (JSON messages)
                elif "text" in message:
                    text_data = message["text"]
                    logger.debug(f"Received text message: {text_data[:100]}...")

                    json_message = json.loads(text_data)

                    # Extract text from JSON and send to LiveRequestQueue
                    if json_message.get("type") == "text":
                        logger.debug(f"Sending text content: {json_message['text']}")
                        content = types.Content(
                            parts=[types.Part(text=json_message["text"])]
                        )
                        live_request_queue.send_content(content)

                    # Handle image data
                    elif json_message.get("type") == "image":
                        logger.debug("Received image data")

                        # Decode base64 image data
                        image_data = base64.b64decode(json_message["data"])
                        mime_type = json_message.get("mimeType", "image/jpeg")

                        logger.debug(
                            f"Sending image: {len(image_data)} bytes, type: {mime_type}"
                        )

                        # Send image as blob
                        image_blob = types.Blob(mime_type=mime_type, data=image_data)
                        live_request_queue.send_realtime(image_blob)
        except (WebSocketDisconnect, RuntimeError):
            logger.info("Client disconnected (upstream)")
            live_request_queue.close()

    async def downstream_task() -> None:
        """Receives Events from run_live() and sends to WebSocket."""
        logger.debug("downstream_task started, calling runner.run_live()")
        logger.debug(
            f"Starting run_live with user_id={user_id}, session_id={session_id}"
        )
        async for event in runner.run_live(
            user_id=user_id,
            session_id=session_id,
            live_request_queue=live_request_queue,
            run_config=run_config,
        ):
            # Capture events and state deltas for memory ingestion
            live_events.append(event)
            if event.actions and event.actions.state_delta:
                accumulated_state.update(event.actions.state_delta)

            try:
                event_json = event.model_dump_json(exclude_none=True, by_alias=True)
                logger.debug(f"[SERVER] Event: {event_json}")
                await websocket.send_text(event_json)
            except (WebSocketDisconnect, RuntimeError):
                logger.info("Client disconnected (downstream)")
                break
        logger.debug("run_live() generator completed")

    # Run both tasks concurrently
    # upstream_task and downstream_task handle disconnects internally
    try:
        logger.debug("Starting asyncio.gather for upstream and downstream tasks")
        await asyncio.gather(upstream_task(), downstream_task())
        logger.debug("asyncio.gather completed normally")
    except Exception as e:
        logger.info(f"Session ended: {e}")
    finally:
        # ========================================
        # Phase 4: Session Termination
        # ========================================

        # Always close the queue, even if exceptions occurred
        logger.debug("Closing live_request_queue")
        live_request_queue.close()

        # Ingest session data into memory
        try:
            session = await session_service.get_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id,
            )
            if session:
                # Merge state deltas and events captured during the live
                # session, since run_live may not persist them to the
                # session service before the WebSocket disconnects.
                session.state.update(accumulated_state)
                if live_events:
                    session.events = live_events
                await memory_service.add_session_to_memory(session)
                logger.debug("Session ingested into memory")
        except Exception as e:
            logger.error(f"Failed to ingest session into memory: {e}")


# ========================================
# HTTP Endpoints
# ========================================
DEBUG_ROOT_ENDPOINT = os.getenv("DEBUG_ROOT_ENDPOINT", "false").lower() == "true"

if DEBUG_ROOT_ENDPOINT:

    @app.get("/")
    async def debug_ui() -> FileResponse:
        """Serve the a debug UI to see the different payloads."""
        return FileResponse(
            Path(__file__).parent.parent / "debug_frontend" / "index.html"
        )
else:

    @app.get("/debug")
    async def debug_ui() -> FileResponse:
        """Serve the a debug UI to see the different payloads."""
        return FileResponse(
            Path(__file__).parent.parent / "debug_frontend" / "index.html"
        )

    @app.get("/preview")
    async def preview_split() -> FileResponse:
        """Split-screen preview: Nuxt conversational UI + React dashboard side-by-side."""
        return FileResponse(
            Path(__file__).parent.parent / "preview.html"
        )

    # React dashboard — built output served at /dashboard
    dashboard_dir = Path(__file__).parent.parent / "dist"
    if dashboard_dir.exists():
        app.mount("/dashboard", StaticFiles(directory=dashboard_dir, html=True), name="dashboard")

    # Nuxt conversational UI — built output served at root (must be last)
    ui_public_dir = Path(__file__).parent.parent / "ui" / ".output" / "public"
    if ui_public_dir.exists():
        app.mount("/", StaticFiles(directory=ui_public_dir, html=True), name="ui")
