"""SQLite-backed session and memory services.

Replaces Firestore with a local SQLite database for complete independence.
"""

import json
import logging
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import aiosqlite

logger = logging.getLogger(__name__)

DB_PATH = os.getenv(
    "SQLITE_DB_PATH",
    str(Path(__file__).resolve().parent.parent.parent.parent / "data" / "volvo.db"),
)


async def init_db() -> None:
    """Create tables if they don't exist."""
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_state (
                user_id TEXT NOT NULL,
                app_name TEXT NOT NULL,
                state_json TEXT NOT NULL DEFAULT '{}',
                updated_at TEXT NOT NULL,
                PRIMARY KEY (user_id, app_name)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                app_name TEXT NOT NULL,
                state_json TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_memories (
                user_id TEXT NOT NULL,
                memory_key TEXT NOT NULL,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (user_id, memory_key)
            )
        """)
        await db.commit()
    logger.info("SQLite database initialized at %s", DB_PATH)


# ------------------------------------------------------------------
# Session service
# ------------------------------------------------------------------


async def create_session(
    app_name: str, user_id: str, session_id: str
) -> dict[str, Any]:
    """Create a new session. Returns merged state."""
    now = datetime.now(UTC).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR IGNORE INTO sessions (session_id, user_id, app_name, state_json, created_at, updated_at) VALUES (?, ?, ?, '{}', ?, ?)",
            (session_id, user_id, app_name, now, now),
        )
        await db.execute(
            "INSERT OR IGNORE INTO user_state (user_id, app_name, state_json, updated_at) VALUES (?, ?, '{}', ?)",
            (user_id, app_name, now),
        )
        await db.commit()
    return await get_merged_state(app_name, user_id, session_id)


async def get_session(
    app_name: str, user_id: str, session_id: str
) -> dict[str, Any] | None:
    """Get session metadata. Returns None if not found."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM sessions WHERE session_id = ? AND user_id = ? AND app_name = ?",
            (session_id, user_id, app_name),
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return dict(row)


async def get_merged_state(
    app_name: str, user_id: str, session_id: str
) -> dict[str, Any]:
    """Load user state + session state, merge with prefixes."""
    state: dict[str, Any] = {}
    async with aiosqlite.connect(DB_PATH) as db:
        # User state
        cursor = await db.execute(
            "SELECT state_json FROM user_state WHERE user_id = ? AND app_name = ?",
            (user_id, app_name),
        )
        row = await cursor.fetchone()
        if row and row[0]:
            user_data = json.loads(row[0])
            for k, v in user_data.items():
                state[f"user:{k}"] = v

        # Session state
        cursor = await db.execute(
            "SELECT state_json FROM sessions WHERE session_id = ?",
            (session_id,),
        )
        row = await cursor.fetchone()
        if row and row[0]:
            session_data = json.loads(row[0])
            state.update(session_data)

    return state


async def save_state_delta(
    app_name: str, user_id: str, session_id: str, delta: dict[str, Any]
) -> None:
    """Persist a state delta, splitting by prefix."""
    now = datetime.now(UTC).isoformat()
    user_delta: dict[str, Any] = {}
    session_delta: dict[str, Any] = {}

    for key, value in delta.items():
        if key.startswith("temp:"):
            continue  # Never persist temp keys
        elif key.startswith("user:"):
            user_delta[key.removeprefix("user:")] = value
        else:
            session_delta[key] = value

    async with aiosqlite.connect(DB_PATH) as db:
        if user_delta:
            cursor = await db.execute(
                "SELECT state_json FROM user_state WHERE user_id = ? AND app_name = ?",
                (user_id, app_name),
            )
            row = await cursor.fetchone()
            existing = json.loads(row[0]) if row and row[0] else {}
            existing.update(user_delta)
            await db.execute(
                "INSERT INTO user_state (user_id, app_name, state_json, updated_at) VALUES (?, ?, ?, ?) "
                "ON CONFLICT(user_id, app_name) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at",
                (user_id, app_name, json.dumps(existing), now),
            )

        if session_delta:
            cursor = await db.execute(
                "SELECT state_json FROM sessions WHERE session_id = ?",
                (session_id,),
            )
            row = await cursor.fetchone()
            existing = json.loads(row[0]) if row and row[0] else {}
            existing.update(session_delta)
            await db.execute(
                "UPDATE sessions SET state_json = ?, updated_at = ? WHERE session_id = ?",
                (json.dumps(existing), now, session_id),
            )

        await db.commit()


# ------------------------------------------------------------------
# Memory service
# ------------------------------------------------------------------


async def load_user_memories(user_id: str) -> dict[str, Any]:
    """Load all memory documents for a user."""
    result: dict[str, Any] = {}
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT memory_key, value FROM user_memories WHERE user_id = ?",
            (user_id,),
        )
        async for row in cursor:
            result[row[0]] = row[1]
    return result


async def save_memory(user_id: str, key: str, value: str) -> None:
    """Save a memory document."""
    now = datetime.now(UTC).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO user_memories (user_id, memory_key, value, updated_at) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(user_id, memory_key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
            (user_id, key, value, now),
        )
        await db.commit()


async def add_session_to_memory(
    openai_client: Any,
    user_id: str,
    transcript_lines: list[str],
) -> None:
    """Consolidate session transcript into a summary using OpenAI Chat API."""
    if not transcript_lines:
        logger.info("No transcript to consolidate for user %s", user_id)
        return

    transcript = "\n".join(transcript_lines)

    # Load existing summary
    memories = await load_user_memories(user_id)
    existing_summary = memories.get("interactions_summary", "")

    # Build prompt
    parts = [
        "You are a session memory consolidator. Your job is to maintain "
        "an up-to-date summary of everything learned about a user across "
        "multiple conversations with a Volvo car sales assistant.",
        "",
        "Take the existing summary and the new conversation transcript, "
        "then produce a consolidated summary that:",
        "- Preserves all important information from the existing summary",
        "- Incorporates new information from the latest conversation",
        "- Resolves contradictions by preferring newer information",
        "- Stays concise but comprehensive",
        "- Focuses on: user preferences, lifestyle, family, needs, "
        "decisions made, and any other relevant personal details",
        "",
    ]

    if existing_summary:
        parts.extend(["## Existing summary", existing_summary, ""])
    else:
        parts.extend(["## Existing summary", "(First session.)", ""])

    parts.extend([
        "## New conversation transcript",
        "(From audio transcription — may contain errors.)",
        transcript,
        "",
        "## Your consolidated summary",
    ])

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You consolidate user session summaries. Output only "
                        "the updated summary text, nothing else. Be concise "
                        "but preserve all relevant user information."
                    ),
                },
                {"role": "user", "content": "\n".join(parts)},
            ],
            max_tokens=1024,
        )
        new_summary = response.choices[0].message.content
        if new_summary:
            await save_memory(user_id, "interactions_summary", new_summary.strip())
            logger.info("Consolidated memory for user %s", user_id)
    except Exception as e:
        logger.error("Memory consolidation failed for user %s: %s", user_id, e)
