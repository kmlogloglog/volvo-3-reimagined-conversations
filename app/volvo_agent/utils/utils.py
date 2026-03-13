import json
import logging
import os
from pathlib import Path

from google.cloud import secretmanager
from thefuzz import process

logger = logging.getLogger(__name__)

# Define paths to knowledge base
KNOWLEDGE_ROOT = Path(__file__).resolve().parent.parent / "knowledge"
CONFIG_FILE = "car_configurations.json"
ASSETS_FILE = "car_assets.json"


def load_json(path: Path, filename: str) -> dict:
    """
    Load JSON from file

    Args:
        path (Path): The path to the file.
        filename (str): The name of the file.

    Returns:
        dict: The JSON data.
    """
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
    """
    Load car configurations from JSON file

    Returns:
        dict: The car configurations.
    """
    return load_json(path=KNOWLEDGE_ROOT, filename=CONFIG_FILE)


def load_car_assets() -> dict:
    """
    Load car assets (images, gradient stops) from JSON file

    Returns:
        dict: The car assets.
    """
    return load_json(path=KNOWLEDGE_ROOT, filename=ASSETS_FILE)


def fuzzy_match(selected_option: str, valid_options: list[str]) -> str:
    """
    Fuzzy match tries to match the selected option to the closest valid option.

    Args:
        selected_option (str): The value to match. Must be a non-empty string.
        valid_options (list[str]): The valid options to match against. Must be a non-empty list.

    Returns:
        str: The closest option to the selection.
    """
    if not selected_option:
        raise ValueError("selected_option must be a non-empty string")
    if not valid_options:
        raise ValueError("valid_options must be a non-empty list")

    match, score = process.extractOne(selected_option, valid_options)
    if score >= 75:  # threshold for fuzzy matching
        logger.info(f"Fuzzy matched '{selected_option}' to '{match}' (score: {score})")
    else:
        logger.warning(
            f"Fuzzy matched '{selected_option}' to '{match}' with low confidence (score: {score})"
        )
    return match


def get_secret(secret_id: str, version_id: str = "latest") -> str | None:
    """
    Fetch the secret payload from GCP Secret Manager.

    Args:
        secret_id (str): The ID of the secret to fetch.
        version_id (str): The version of the secret to fetch. Defaults to "latest".

    Returns:
        str | None: The secret payload if found, None otherwise.
    """
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "vml-map-xd-volvo")
    try:
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        logger.error(f"Failed to fetch secret {secret_id}: {e}")
        return None
