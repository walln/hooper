"""vLLM OpenAI compatible server test client."""

from openai import OpenAI

from backend.vllm_server.infra import BASE_MODEL

client = OpenAI(
    base_url="https://walln-walln--vllm-openai-server-fastapi-app-dev.modal.run/v1",
    api_key="token-abc123",
)

response = client.chat.completions.create(
    model=BASE_MODEL,
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Why is the sky blue?"},
    ],
    stream=True,
    temperature=0,
)

for chunk in response:
    print(chunk)
    print(chunk.choices[0].delta.content)
    print("****************")
