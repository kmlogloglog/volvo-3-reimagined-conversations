import difflib
import json
import logging
import os
from pathlib import Path
from typing import Any

from google.cloud import secretmanager

logger = logging.getLogger(__name__)


def get_secret(secret_id: str, version_id: str = "latest") -> str | None:
    """Fetch the secret payload from GCP Secret Manager."""
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "vml-map-xd-volvo")
    try:
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        logger.error(f"Failed to fetch secret {secret_id}: {e}")
        return None


# Define paths to knowledge base
KNOWLEDGE_ROOT = Path(__file__).resolve().parent.parent / "knowledge"
CONFIG_FILE = "car_configurations.json"
IMAGES_FILE = "car_images.json"


def load_json(path: Path, filename: str) -> dict:
    filepath = path / filename
    if not filepath.exists():
        logger.error(f"File not found at {filepath}")
        return {}
    try:
        with filepath.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading {filename}: {e}")
        return {}


def load_car_configurations() -> dict:
    return load_json(path=KNOWLEDGE_ROOT, filename=CONFIG_FILE)


def load_car_images() -> dict:
    return load_json(path=KNOWLEDGE_ROOT, filename=IMAGES_FILE)


def fuzzy_match(
    query: str, items: dict[str, Any], threshold: float = 0.6
) -> tuple[str, str] | None:
    """
    Matches a query string against a dictionary where keys are IDs and values are dicts
    containing a "display_name" property.

    Returns (key, display_name) if a match is found.
    """
    if not query:
        return None

    query_norm = query.lower().strip()

    # 1. Exact match on keys
    if query_norm in items:
        return query_norm, items[query_norm].get("display_name", query_norm)

    # 2. Exact match on display names (normalized)
    for key, data in items.items():
        if data.get("display_name", "").lower() == query_norm:
            return key, data.get("display_name")

    # 3. Fuzzy match against keys
    keys = list(items.keys())
    matches = difflib.get_close_matches(query_norm, keys, n=1, cutoff=threshold)
    if matches:
        key = matches[0]
        return key, items[key].get("display_name", key)

    # 4. Fuzzy match against display names
    # Create a reverse map for lookup: display_name_lower -> key
    name_map = {}
    for key, data in items.items():
        dn = data.get("display_name", "")
        if dn:
            name_map[dn.lower()] = key

    params = list(name_map.keys())
    matches = difflib.get_close_matches(query_norm, params, n=1, cutoff=threshold)
    if matches:
        matched_name = matches[0]
        key = name_map[matched_name]
        return key, items[key].get("display_name")

    return None
