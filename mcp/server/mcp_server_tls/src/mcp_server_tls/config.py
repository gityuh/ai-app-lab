import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class TLSConfig:
    """Configuration for TLS MCP Server."""

    endpoint: str
    region: str
    access_key_id: str
    access_key_secret: str
    topic_id: str
    account_id: str


def load_config() -> TLSConfig:
    """Load configuration from environment variables."""
    required_vars = [
        "VOLC_ACCESSKEY",
        "VOLC_SECRETKEY",
        "ACCOUNT_ID",
    ]

    # Check if all required environment variables are set
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    if missing_vars:
        error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    # Load configuration from environment variables
    return TLSConfig(
        endpoint=os.getenv("VOLCENGINE_ENDPOINT", "https://tls-cn-beijing.volces.com"),
        region=os.getenv("REGION", "cn-beijing"),
        access_key_id=os.environ["VOLC_ACCESSKEY"],
        access_key_secret=os.environ["VOLC_SECRETKEY"],
        topic_id=os.getenv("TLS_TOPIC_ID", ""),
        account_id=os.getenv("ACCOUNT_ID", ""),
    )


config = load_config()
