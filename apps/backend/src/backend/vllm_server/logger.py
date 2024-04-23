"""Logger for the VLLM server."""

import logging
from typing import Optional


def init_logger(name: str, log_level: Optional[str] = "DEBUG") -> logging.Logger:
    """Initialize the logger for the VLLM server.

    Args:
        name: The name of the logger.
        log_level: The log level for the logger.

    Returns:
        The logger instance.
    """
    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger
