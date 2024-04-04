"""vLLM model wrapper for the vLLM inference engine."""

from typing import AsyncGenerator, Union

from modal import Stub, enter, exit, method
from vllm import AsyncEngineArgs, AsyncLLMEngine
from vllm.utils import random_uuid

from backend.vllm_server.engine.chat import ChatEngine
from backend.vllm_server.infra import BASE_MODEL, GPU_CONFIG, MODEL_DIR, image
from backend.vllm_server.logger import init_logger
from backend.vllm_server.schema.chat import (
    ChatCompletionRequest,
    ChatCompletionResponse,
)
from backend.vllm_server.schema.common import ErrorResponse
from backend.vllm_server.utils import create_chat_template, create_error_response

logger = init_logger(__name__)

stub = Stub("vLLM-OpenAI-server", image=image)


@stub.cls(gpu=GPU_CONFIG, allow_concurrent_inputs=12, container_idle_timeout=300)
class Model:
    """Wrapper for the vLLM inference engine."""

    @enter()
    def load(self):
        """Load the vLLM model.

        When the container image starts, this method is called to load the vLLM model
        into memory and initialize the engine.
        """
        if GPU_CONFIG.count > 1:
            # Patch issue from https://github.com/vllm-project/vllm/issues/1116
            import ray

            ray.shutdown()
            ray.init(num_gpus=GPU_CONFIG.count)

        engine_args = AsyncEngineArgs(
            model=MODEL_DIR,
            tensor_parallel_size=GPU_CONFIG.count,
            gpu_memory_utilization=0.9,
            # do not capture the graph slower faster inference, but faster cold starts
            enforce_eager=True,
            # disable logging so we can stream tokens
            disable_log_stats=True,
            disable_log_requests=True,
        )

        chat_template = create_chat_template()

        self.engine = AsyncLLMEngine.from_engine_args(engine_args)
        self.chat_engine = ChatEngine(
            self.engine, BASE_MODEL, "assistant", chat_template
        )

    @exit()
    def stop_engine():
        """Stop the vLLM engine.

        When the container is stopped, this method is called to stop the vLLM engine.
        """
        if GPU_CONFIG.count > 1:
            import ray

            ray.shutdown()

    @method()
    async def check_health(self):
        """Health check for the vLLM model."""
        return {"status": "ok"}

    @method()
    async def generate_chat_completion_stream(
        self, request: ChatCompletionRequest
    ) -> Union[ErrorResponse, AsyncGenerator[str, None]]:
        """Generate chat completions.

        Generate chat completions based on the given chat message history and chat
        settings. This is a streaming completion generator that returns the
        response in chunks.

        Args:
            request: The chat completion request.

        Returns:
            A stream of chat completions or an error response.
        """
        request_id = f"cmpl-{random_uuid()}"
        logger.info(f"Creating stream generator for request {request_id}")
        results_generator = await self.chat_engine.create_chat_completion_generator(
            request, request_id
        )
        # TODO: handler error response of results_generator
        async for res in self.chat_engine.chat_completion_stream_generator(
            request, results_generator, request_id
        ):
            yield res

    @method()
    async def generate_chat_completion_full(
        self, request: ChatCompletionRequest
    ) -> Union[ErrorResponse, ChatCompletionResponse]:
        """Generate chat completions.

        Generate chat completions based on the given chat message history and chat
        settings. This is a full completion generator that returns the full response
        in one go rather than streaming the response.

        Args:
            request: The chat completion request.

        Returns:
            The chat completion response or an error response.
        """
        request_id = f"cmpl-{random_uuid()}"
        logger.info(f"Creating completion generator for request {request_id}")

        results_generator = await self.chat_engine.create_chat_completion_generator(
            request, request_id
        )
        # TODO: handler error response of results_generator

        try:
            res = await self.chat_engine.chat_completion_full_generator(
                request, results_generator, request_id
            )
            return res

        except ValueError as e:
            logger.error(f"Error generating chat completion: {e}")
            return create_error_response(str(e))
