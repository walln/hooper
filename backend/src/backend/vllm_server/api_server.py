"""OpenAI compatible API server running vLLM inference engine."""

from http import HTTPStatus

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse, Response
from modal import asgi_app

from backend.vllm_server.infra import stub
from backend.vllm_server.model import Model
from backend.vllm_server.schema.chat import ChatCompletionRequest
from backend.vllm_server.utils import create_error_response

app = FastAPI()


@stub.function(timeout=60 * 10, allow_concurrent_inputs=12)
@asgi_app()
def fastapi_app():
    """FastAPI app for the vLLM server."""
    return app


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc):
    """Handle validation errors."""
    err = create_error_response(message=str(exc))
    return JSONResponse(err.model_dump(), status_code=HTTPStatus.BAD_REQUEST)


@app.get("/health")
async def health() -> Response:
    """Health check.

    Check the health of the vLLM model server to ensure the engine is running correctly.

    Returns:
        A JSON response indicating the health of the server and a HTTP status code.
    """
    model = Model()
    response = await model.check_health.remote.aio()
    print(response)
    if response["status"] != "ok":
        return create_error_response("Model health check failed", err_type="")
    return Response(status_code=HTTPStatus.OK)


@app.post("/v1/chat/completions")
async def create_chat_completion(request: ChatCompletionRequest, raw_request: Request):
    """Generate chat completions.

    Generate chat completions based on the given chat message history and chat settings.

    Args:
        request: The chat completion request.
        raw_request: The raw HTTP request.

    Returns:
        The chat completion response.
    """
    from fastapi.responses import StreamingResponse

    print("inside endpoint")
    print("request", request)
    print("typeof request", type(request))
    print("raw_request", raw_request)

    model = Model()

    if request.stream:

        async def streamer():
            async for (
                partial_result
            ) in model.generate_chat_completion_stream.remote_gen.aio(request):
                print("Partial:\n", partial_result)
                yield partial_result

        return StreamingResponse(streamer(), media_type="text/event-stream")

    else:
        full = await model.generate_chat_completion_full.remote.aio(request)
        print("Got full response in API")
        print(full)
        # return full
        return full
