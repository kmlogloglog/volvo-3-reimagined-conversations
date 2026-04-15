"""Initialize the SQLite database schema."""

import asyncio

from dotenv import load_dotenv

load_dotenv()

from volvo_agent.services.sqlite_service import init_db  # noqa: E402

if __name__ == "__main__":
    asyncio.run(init_db())
    print("Database initialized.")
