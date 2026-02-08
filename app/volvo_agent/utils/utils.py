import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Define paths to knowledge base
KNOWLEDGE_ROOT = Path(__file__).resolve().parent.parent / "knowledge"
CONFIG_FILE = "car_configurations.json"


def load_json(path: Path, filename: str) -> dict | None:
    filepath = path / filename
    if not filepath.exists():
        logger.error(f"File not found at {filepath}")
        return None
    try:
        with filepath.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading {filename}: {e}")
        return None

def load_car_configurations() -> dict | None:
  return load_json(path=KNOWLEDGE_ROOT, filename=CONFIG_FILE)

