"""Lightweight state manager replacing ADK's ToolContext.state."""

from typing import Any

from .services import sqlite_service


class StateManager:
    """Dict-like state with user:/temp: prefix separation and SQLite persistence."""

    def __init__(self, app_name: str, user_id: str, session_id: str):
        self.app_name = app_name
        self.user_id = user_id
        self.session_id = session_id
        self._state: dict[str, Any] = {}
        self._dirty: dict[str, Any] = {}

    async def load(self) -> None:
        """Load merged state from SQLite."""
        self._state = await sqlite_service.get_merged_state(
            self.app_name, self.user_id, self.session_id
        )

    def get(self, key: str, default: Any = None) -> Any:
        return self._state.get(key, default)

    def __getitem__(self, key: str) -> Any:
        return self._state[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self._state[key] = value
        self._dirty[key] = value

    def __contains__(self, key: str) -> bool:
        return key in self._state

    def keys(self) -> Any:
        return self._state.keys()

    def items(self) -> Any:
        return self._state.items()

    def to_dict(self) -> dict[str, Any]:
        return self._state.copy()

    async def flush(self) -> None:
        """Persist any dirty state to SQLite, then clear the dirty set."""
        if not self._dirty:
            return
        await sqlite_service.save_state_delta(
            self.app_name, self.user_id, self.session_id, self._dirty
        )
        self._dirty.clear()
