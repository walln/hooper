"""Modal infrastructure for the TGI server."""

import subprocess

from modal import Image, Secret, gpu

# TODO: Use custom llama3 based model using OpenChatML/dolphin with function calling
MODEL_ID = "teknium/OpenHermes-2.5-Mistral-7B"
# Add `["--quantize", "gptq"]` for TheBloke GPTQ models.
LAUNCH_FLAGS = [
    "--model-id",
    MODEL_ID,
    "--port",
    "8000",
]

APP_NAME = "hooper-tgi-server"


def download_model():
    """Download the model weights from the huggingface hub.

    Download the model weights from the huggingface hub and save them to the cache
    path. This stores the artifcats in NFS so that the public network does not
    need to get hit on container initialization.
    """
    subprocess.run(
        [
            "text-generation-server",
            "download-weights",
            MODEL_ID,
        ],
    )


tgi_image = (
    Image.from_registry("ghcr.io/huggingface/text-generation-inference:1.4")
    .dockerfile_commands("ENTRYPOINT []")
    .run_function(
        download_model,
        secrets=[Secret.from_name("huggingface-secret")],
        timeout=3600,
    )
    .pip_install("text-generation")
    .pip_install("pydantic>=2.6.4", "fastapi>=0.110.0")
)

client_image = Image.debian_slim().pip_install("openai")

GPU_CONFIG = gpu.A100(count=1, memory=40)
