"""FastAPI frontend server for the TGI server."""

import logging

import modal

from backend.tgi_server.infra import APP_NAME, GPU_CONFIG, LAUNCH_FLAGS, tgi_image

app = modal.App(name=APP_NAME)

logger = logging.getLogger(__name__)


@app.cls(
    secrets=[
        modal.Secret.from_name("huggingface-secret"),
    ],
    gpu=GPU_CONFIG,
    allow_concurrent_inputs=15,
    container_idle_timeout=60 * 10,
    timeout=60 * 60,
    image=tgi_image,
)
class Model:
    """Wrapper for the TGI inference engine."""

    import warnings

    warnings.filterwarnings("ignore", message='Field "model_id"')

    from text_generation.client import ChatRequest
    from text_generation.types import DeployedModel

    DeployedModel.model_config["protected_namespaces"] = ()

    @modal.enter()
    def start_server(self):
        """Start the TGI server and load the model."""
        import os
        import socket
        import subprocess
        import time

        from text_generation import AsyncClient

        self.launcher = subprocess.Popen(
            ["text-generation-launcher", *LAUNCH_FLAGS],
            env={
                **os.environ,
                "HUGGING_FACE_HUB_TOKEN": os.environ["HF_TOKEN"],
            },
        )
        self.client = AsyncClient("http://127.0.0.1:8000", timeout=60)

        # Poll until webserver at 127.0.0.1:8000 accepts connections before running.
        def webserver_ready():
            try:
                socket.create_connection(("127.0.0.1", 8000), timeout=1).close()
                return True
            except (socket.timeout, ConnectionRefusedError):
                # Check if launcher webserving process has exited.
                # If so, a connection can never be made.
                retcode = self.launcher.poll()
                if retcode is not None:
                    raise RuntimeError(
                        f"launcher exited unexpectedly with code {retcode}"
                    ) from None
                return False

        while not webserver_ready():
            time.sleep(1.0)

        logger.info("Webserver ready!")

    @modal.exit()
    def close_server(self):
        """Shut down the TGI server on exit."""
        self.launcher.terminate()

    @modal.method()
    async def generate(self, chat_request: ChatRequest):
        """Generate a response to a chat request.

        Args:
            chat_request: The chat request.

        Returns:
            The generated response.
        """
        result = await self.client.chat(
            messages=chat_request.messages,
            repetition_penalty=chat_request.repetition_penalty,
            frequency_penalty=chat_request.frequency_penalty,
            logit_bias=chat_request.logit_bias,
            logprobs=chat_request.logprobs,
            top_logprobs=chat_request.top_logprobs,
            max_tokens=chat_request.max_tokens,
            presence_penalty=chat_request.presence_penalty,
            # Returns a coroutine rather than a generator
            stream=False,
            seed=chat_request.seed,
            temperature=chat_request.temperature,
            top_p=chat_request.top_p,
            tools=chat_request.tools,
            tool_choice=chat_request.tool_choice,
        )
        return result

    # @modal.method()
    # async def generate_stream(self, chat_request: ChatRequest):
    #     """Generate a response to a chat request as a stream.

    #     Args:
    #         chat_request: The chat request.

    #     Returns:
    #         The generated response stream.
    #     """
    #     from text_generation.types import ChatCompletionChunk

    #     result_generator = await self.client.chat(
    #         messages=chat_request.messages,
    #         repetition_penalty=chat_request.repetition_penalty,
    #         frequency_penalty=chat_request.frequency_penalty,
    #         logit_bias=chat_request.logit_bias,
    #         logprobs=chat_request.logprobs,
    #         top_logprobs=chat_request.top_logprobs,
    #         max_tokens=chat_request.max_tokens,
    #         presence_penalty=chat_request.presence_penalty,
    #         # Returns a generator rather than a coroutine
    #         stream=True,
    #         seed=chat_request.seed,
    #         temperature=chat_request.temperature,
    #         top_p=chat_request.top_p,
    #         tools=chat_request.tools,
    #         tool_choice=chat_request.tool_choice,
    #     )
    #     async for chunk in result_generator:
    #         chunk: ChatCompletionChunk = chunk
    #         print(f"Generated response: {chunk}")

    #         # TODO: streaming breaks tool_call generation
    #         # Need to figure out how that works but might not even
    #         # be a good design choice for this use case
    #         yield chunk


@app.function(
    allow_concurrent_inputs=15,
    timeout=60 * 10,
    image=tgi_image,
    secrets=[
        modal.Secret.from_name("hooper-api-key"),
    ],
)
@modal.asgi_app()
def fastapi_app():
    """Run the TGI server."""
    import os

    from fastapi import FastAPI
    from fastapi.exceptions import HTTPException
    from fastapi.requests import Request
    from text_generation.client import ChatRequest

    web_app = FastAPI()

    model = Model()

    @web_app.get("/")
    def index():
        return {"message": "Hello World"}

    @web_app.post("/v1/chat/completions")
    async def create_chat_completion(request: ChatRequest, raw_request: Request):
        """Generate chat completions.

        Generate chat completions based on the given chat message request.

        Args:
            request: The chat completion request.
            raw_request: The raw HTTP request.

        Returns:
            The chat completion response.
        """
        # Check that the request has a valid API key
        secret_key = os.getenv("HOOPER_API_KEY")
        if not secret_key:
            raise ValueError("Hooper secret key not found in environment")

        authorization_header = raw_request.headers.get("authorization")
        if not authorization_header:
            raise HTTPException(
                status_code=401, detail="Authorization header not found in request"
            )
        if authorization_header != f"Bearer {secret_key}":
            raise HTTPException(status_code=403, detail="Invalid API key")

        if not request.stream:
            response = await model.generate.remote.aio(request)
            return response
        else:
            raise NotImplementedError("Streaming not implemented yet")

    return web_app
