"""Generic utility functions for backend services."""

import logging
import os

logfmt = "%(asctime)s,%(msecs)03d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s"

logging.basicConfig(
    format=logfmt,
    datefmt="%Y-%m-%d:%H:%M:%S",
    level=logging.INFO,
)
log_file_path = os.path.join(os.getcwd(), "src/logs")

logger = logging.getLogger("hooper-agent-dev")

VLLM_API_URL = "https://walln-walln--vllm-openai-server-fastapi-app.modal.run/v1"
