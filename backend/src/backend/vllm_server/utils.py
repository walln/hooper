"""Common utility functions for the VLLM server."""

import json
from http import HTTPStatus

from backend.vllm_server.schema.common import ErrorResponse


def create_error_response(
    message: str,
    err_type: str = "BadRequestError",
    status_code: HTTPStatus = HTTPStatus.BAD_REQUEST,
) -> ErrorResponse:
    """HTTP error response factory.

    Create an error response object with the given message, error type, and status code.

    Args:
        message: The error message.
        err_type: The error type.
        status_code: The HTTP status code.

    Returns:
            An ErrorResponse object.
    """
    return ErrorResponse(message=message, type=err_type, code=status_code.value)


def create_streaming_error_response(
    message: str,
    err_type: str = "BadRequestError",
    status_code: HTTPStatus = HTTPStatus.BAD_REQUEST,
) -> str:
    """HTTP error response factory for streaming responses.

    Create an error response object with the given message, error type, and status
    code. This is used for streaming responses which require a string response as
    streaming is purely a text based protocol.

    Args:
        message: The error message.
        err_type: The error type.
        status_code: The HTTP status code.

    Returns:
        A JSON string representation of the error response.
    """
    json_str = json.dumps(
        {
            "error": create_error_response(
                message=message, err_type=err_type, status_code=status_code
            ).model_dump()
        }
    )
    return json_str


def create_chat_template() -> str:
    """Create a chat template.

    Create a chat template to be used as a default prompt for chat completions.

    Returns:
        A chat template.
    """
    return """{{ bos_token }}
{% set previous_role = 'system' %}{# Initialize with 'system'#}
{% for message in messages %}
    {% if message['role'] == 'system' %}
        {# Handle or ignore system messages here. For example, to display them: #}
        {# {{ '[SYSTEM] ' + message['content'] + ' [/SYSTEM]' }} #}
    {% elif message['role'] == 'user' and previous_role in ['assistant', 'system'] %}
        {{ '[INST] ' + message['content'] + ' [/INST]' }}
        {% set previous_role = 'user' %}
    {% elif message['role'] == 'assistant' and previous_role in ['user', 'system'] %}
        {{ message['content'] + eos_token + ' ' }}
        {% set previous_role = 'assistant' %}
    {% else %}
        {{ raise_exception('Conversation roles must alternate') }}
    {% endif %}
{% endfor %}
"""
