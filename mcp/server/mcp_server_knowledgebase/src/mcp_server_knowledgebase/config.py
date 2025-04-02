import os
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class KnowledgeBaseConfig:
    """Configuration for Viking Knowledge Base MCP Server."""

    host: str
    ak: str
    sk: str
    collection_name: str


def load_config() -> KnowledgeBaseConfig:
    """Load configuration from environment variables."""
    required_vars = [
        "VOLC_ACCESSKEY",
        "VOLC_SECRETKEY",
    ]

    # Check if all required environment variables are set
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    if missing_vars:
        error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    # Load configuration from environment variables
    return KnowledgeBaseConfig(
        ak=os.environ["VOLC_ACCESSKEY"],
        sk=os.environ["VOLC_SECRETKEY"],
        host=os.getenv("VIKING_KB_HOST", "api-knowledgebase.mlp.cn-beijing.volces.com"),
        collection_name=os.getenv("VIKING_KB_COLLECTION_NAME"),
    )


config = load_config()
