"""Base vLLM engine implementing OpenAI api functionality."""

import asyncio
from typing import List, Optional, Union

from vllm.engine.async_llm_engine import AsyncLLMEngine
from vllm.entrypoints.openai.protocol import (
    CompletionRequest,
)
from vllm.transformers_utils.tokenizer import get_tokenizer

from backend.vllm_server.schema.chat import ChatCompletionRequest
from backend.vllm_server.schema.common import ErrorResponse


class BaseEngine:
    """Base vLLM engine implementing OpenAI api functionality.

    Implements core engine interface and provides common functionality for
    both chat and completion engines.
    """

    def __init__(self, engine: AsyncLLMEngine, model_name: str):
        """Initialize the base engine.

        Ensures the engine has a valid event loop depending on the runtime context
        with asyncio or the ray managed multi-gpu runtime.

        Args:
            engine: The vLLM engine to use.
            model_name: The name of the model being served.
        """
        self.engine = engine
        self.model_name = model_name

        self.max_model_len = 0
        self.tokenizer = None

        try:
            event_loop = asyncio.get_event_loop()
        except RuntimeError:
            event_loop = None

        if event_loop is not None and event_loop.is_running():
            # If the current is instanced by Ray Serve,
            # there is already a running event loop
            event_loop.create_task(self._post_init())
        else:
            # When using single vLLM without engine_use_ray
            asyncio.run(self._post_init())

    async def _post_init(self):
        engine_model_config = await self.engine.get_model_config()
        self.max_model_len = engine_model_config.max_model_len

        # A separate tokenizer to map token IDs to strings.
        self.tokenizer = get_tokenizer(
            engine_model_config.tokenizer,
            tokenizer_mode=engine_model_config.tokenizer_mode,
            trust_remote_code=engine_model_config.trust_remote_code,
        )

    def check_model(self, request) -> Optional[ErrorResponse]:
        """Verify the requested model is being served.

        Args:
            request: The request to check the model.

        Returns:
            An error response if the model is not being served.
        """
        if request.model is not None and request.model != self.model_name:
            return ErrorResponse(
                message=f"Model {request.model_name} is not being served.",
                err_type="model_not_served",
            )
        return None

    def _validate_prompt_and_tokenize(
        self,
        request: Union[ChatCompletionRequest, CompletionRequest],
        prompt: Optional[str] = None,
        prompt_ids: Optional[List[int]] = None,
    ) -> List[int]:
        """Validate the prompt and tokenize it.

        Args:
            request: The request to validate and tokenize.
            prompt: The prompt to validate.
            prompt_ids: The tokenized prompt.

        Returns:
            The validated prompt and tokenized prompt.
        """
        if not (prompt or prompt_ids) or (prompt and prompt_ids):
            raise ValueError(
                "Either prompt or prompt_ids must be provided, but not both."
            )

        input_ids = prompt_ids if prompt_ids else self.tokenizer(prompt).input_ids
        token_num = len(input_ids)

        if request.max_tokens is None:
            request.max_tokens = self.max_model_len - token_num

        if token_num + request.max_tokens > self.max_model_len:
            raise ValueError(
                f"This model's maximum context length is "
                f"{self.max_model_len} tokens. However, you requested "
                f"{request.max_tokens + token_num} tokens "
                f"({token_num} in the messages, "
                f"{request.max_tokens} in the completion). "
                f"Please reduce the length of the messages or completion.",
            )

        return input_ids
