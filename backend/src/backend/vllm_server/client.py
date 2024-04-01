"""vLLM OpenAI compatible server test client."""

from openai import OpenAI

from backend.vllm_server.infra import BASE_MODEL

client = OpenAI(
    base_url="https://walln-walln--vllm-openai-server-fastapi-app-dev.modal.run/v1",
    api_key="token-abc123",
)

completion = client.chat.completions.create(
    model=BASE_MODEL,
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Why is the sky blue?"},
    ],
    stream=False,
)

print(completion.choices[0].message)
