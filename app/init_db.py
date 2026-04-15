"""Initialize the SQLite database schema."""

import asyncio
import sys
from pathlib import Path

# Ensure .env is loaded and app package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from app.volvo_agent.services.sqlite_service import init_db  # noqa: E402

if __name__ == "__main__":
    asyncio.run(init_db())
    print("Database initialized.")
