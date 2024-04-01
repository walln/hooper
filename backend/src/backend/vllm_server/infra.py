"""Modal infrastructure for the vLLM server."""

from modal import Image, Stub, gpu

MODEL_DIR = "/model"
BASE_MODEL = "mistralai/Mistral-7B-Instruct-v0.1"
GPU_CONFIG = gpu.A100(count=1, memory=40)


def download_model_to_folder():
    """Download the model weights from the huggingface hub.

    Download the model weights from the huggingface hub and save them to the cache
    path. This stores the artifcats in NFS so that the public network does not
    need to get hit on container initialization.
    """
    from huggingface_hub import snapshot_download

    snapshot_download(
        BASE_MODEL,
        local_dir=MODEL_DIR,
        ignore_patterns=["*.pt", "*.gguf"],
    )


image = (
    Image.from_registry("nvidia/cuda:12.1.0-base-ubuntu22.04", add_python="3.10")
    .pip_install("vllm==0.2.6")
    .pip_install(
        "pydantic>=2.6.4",
        "fastapi>=0.110.0",
    )
    .run_function(
        download_model_to_folder,
        timeout=60 * 20,
    )
)

stub = Stub("vLLM-OpenAI-server", image=image)
