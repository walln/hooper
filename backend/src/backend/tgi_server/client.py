"""TGI OpenAI compatible server test client."""

import os

import modal

from backend.tgi_server.infra import APP_NAME, client_image

app = modal.App(name=APP_NAME)


@app.function(secrets=[modal.Secret.from_name("hooper-api-key")], image=client_image)
def test_client():
    """TGI OpenAI compatible server test client."""
    from openai import OpenAI

    api_key = os.getenv("HOOPER_API_KEY")
    if not api_key:
        raise ValueError("Hooper secret key not found in environment")

    BASE_URL = "https://walln-walln--hooper-tgi-server-fastapi-app-dev.modal.run/"

    client = OpenAI(
        base_url=f"{BASE_URL}v1",
        api_key=api_key,
    )

    completion = client.chat.completions.create(
        model="tgi",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Why is the sky blue?"},
        ],
        stream=False,
    )

    print(completion.choices[0].message)


@app.local_entrypoint()
def main():
    """Run the TGI OpenAI compatible server test client."""
    test_client.remote()
