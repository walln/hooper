"""Agent module for orchestrating LLM interactions."""

from modal import Image, Stub, enter, gpu, method

GPU_TYPE = gpu.A10G()

stub = Stub("hooper-backend")


def download_model_weights() -> None:
    """Download the model weights from the huggingface hub.

    Download the model weights from the huggingface hub and save them to the cache
    path. This stores the artifcats in NFS so that the public network does not
    need to get hit on container initialization.
    """
    from huggingface_hub import snapshot_download

    print("Downloading model weights")
    snapshot_download(repo_id=MODEL_NAME, cache_dir=CACHE_PATH)
    print("Model weights downloaded")


image = (
    Image.debian_slim()
    .apt_install("git")
    .pip_install("wheel", "ninja", "packaging")
    .pip_install(
        "transformers",
        "torch",
        "sentencepiece",
        "huggingface_hub",
        "accelerate",
        "bitsandbytes",
        gpu=GPU_TYPE,
    )
    .run_function(download_model_weights)
    # .run_commands("pip install flash-attn", gpu=GPU_TYPE)
)

CACHE_PATH = "/root/model_cache"
MODEL_NAME = "NousResearch/Hermes-2-Pro-Mistral-7B"
QUESTION = "Who has lead the league is scoring this season?"

with image.imports():
    import torch
    from transformers import BitsAndBytesConfig, LlamaTokenizer, MistralForCausalLM


@stub.local_entrypoint()
def test_agent():
    """Test the agent by prompting it with a question."""
    print("Testing agent...")
    _response = Agent().prompt.remote(QUESTION)


@stub.cls(image=image, gpu=GPU_TYPE)
class Agent:
    """Agent class for generating queries and responses.

    Attributes:
        tokenizer: The tokenizer for the model.
        model: The model for generating responses.
    """

    @enter()
    def load_model(self):
        """Load huggingface artifacts on container start."""
        print("Loading tokenizer")
        self.tokenizer = LlamaTokenizer.from_pretrained(
            MODEL_NAME,
            local_files_only=True,
            cache_dir=CACHE_PATH,
            device_map="auto",
        )
        print("Loading model")
        self.model = MistralForCausalLM.from_pretrained(
            MODEL_NAME,
            local_files_only=True,
            cache_dir=CACHE_PATH,
            quantization_config=BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=False,  # TODO: experiment with  \
                # double quanitzation performance and tune hw config
                bnb_4bit_compute_dtype=torch.bfloat16,
            ),
            torch_dtype=torch.bfloat16,
            device_map="auto",
            # use_flash_attention_2=True,
        )
        print("Agent loaded")

    @method()
    def prompt(self, question: str) -> str:
        """Prompt the agent with an instruction and return the response.

        Args:
            question: The question to ask the agent.

        Returns:
            The response from the agent.
        """
        print("Prompting agent...")
        print("-" * 50)

        chat = [
            {
                "role": "system",
                "text": (
                    "You are a sentient, superintelligent artificial general "
                    "intelligence, here to teach and assist me."
                ),
            },
            {
                "role": "user",
                "text": (
                    "Write a short story about how the Dallas Mavericks "
                    "won the NBA championship."
                ),
            },
        ]

        prompt = self.tokenizer.apply_chat_template(chat, tokenize=False)

        print(prompt)
        input_ids = self.tokenizer(chat, return_tensors="pt").input_ids.to("cuda")
        generated_ids = self.model.generate(
            input_ids,
            max_new_tokens=750,
            temperature=0.8,
            repetition_penalty=1.1,
            do_sample=True,
            eos_token_id=self.tokenizer.eos_token_id,
        )
        response = self.tokenizer.decode(
            generated_ids[0][input_ids.shape[-1] :],
            skip_special_tokens=True,
            clean_up_tokenization_space=True,
        )
        print(f"Response: {response}")
