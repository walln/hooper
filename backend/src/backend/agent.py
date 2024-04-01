"""Agent module for orchestrating LLM interactions."""

import datetime
import os

from modal import Image, Mount, Stub, enter, gpu, method

from backend.schema import DescribeDatasetArgs
from backend.utils import logger

GPU_TYPE = gpu.A10G()

stub = Stub("hooper-backend")


def download_model_weights() -> None:
    """Download the model weights from the huggingface hub.

    Download the model weights from the huggingface hub and save them to the cache
    path. This stores the artifcats in NFS so that the public network does not
    need to get hit on container initialization.
    """
    from huggingface_hub import snapshot_download

    logger.info("Downloading model weights")
    snapshot_download(repo_id=MODEL_NAME, cache_dir=CACHE_PATH)
    logger.info("Model weights downloaded")


image = (
    Image.debian_slim()
    .apt_install("git")
    .pip_install("wheel", "ninja", "packaging")
    .pip_install(
        "polars",
        "langchain",
        "pydantic>=2.6.4",
        "fastapi>=0.110.0",
    )
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

LOCAL_DATA_PATH = os.path.join(os.getcwd(), "backend/nba_data")
CACHE_PATH = "/root/model_cache"
MODEL_NAME = "NousResearch/Hermes-2-Pro-Mistral-7B"
QUESTION = "Who has lead the league is scoring this season?"

with image.imports():
    import polars as pl
    import torch
    from transformers import BitsAndBytesConfig, LlamaTokenizer, MistralForCausalLM


@stub.local_entrypoint()
def test_agent():
    """Test the agent by prompting it with a question."""
    logger.info("Running test_agent...")
    response = Agent().generate_completion.remote(QUESTION)
    print(f"Response:\n {response}")


# TODO: Wire up to the vLLM server with OpenAI compliant API
@stub.cls(
    image=image,
    gpu=GPU_TYPE,
    mounts=[Mount.from_local_dir(LOCAL_DATA_PATH, remote_path="/root/nba_data")],
)
class Agent:
    """Agent class for generating queries and responses.

    Attributes:
        tokenizer: The tokenizer for the model.
        model: The model for generating responses.
    """

    @enter()
    def configure_agent(self):
        """Configure the agent with the necessary artifacts.

        This method is called on container start and is used to load the model,
        tokenizer, datasets, and other necessary artifacts.
        """
        self.load_model()
        self.load_data()

    def load_model(self):
        """Load huggingface artifacts on container start."""
        logger.info(f"Loading {MODEL_NAME} tokenizer")
        self.tokenizer = LlamaTokenizer.from_pretrained(
            MODEL_NAME,
            local_files_only=True,
            cache_dir=CACHE_PATH,
            device_map="auto",
        )

        logger.info(f"Loading {MODEL_NAME} model")
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

        logger.info(f"{MODEL_NAME} model and tokenizer loaded")

    def load_data(self):
        """Load the NBA data."""
        logger.info("Loading NBA data")
        self.datasets = os.listdir("/root/nba_data")
        self.data = pl.read_csv("/root/nba_data/player_data_2022_2023.csv")
        logger.info("NBA data loaded")
        for dataset in self.datasets:
            logger.info(f"Loaded dataset: {dataset}")
            dataset = pl.read_csv(f"/root/nba_data/{dataset}")
            print(dataset.head(5))

    def run_inference(self, prompt: str, max_new_tokens=1500) -> str:
        """Run inference on the model.

        Run inference on the model with the given prompt and return the
        completion. Validation and structure enforcement is done later in
        the pipeline.

        Args:
            prompt: The prompt to use for the model.
            max_new_tokens: The maximum number of tokens to generate.

        Returns:
            The completion from the model.
        """
        inputs = self.tokenizer.apply_chat_template(
            prompt, add_generation_prompt=True, return_tensors="pt"
        )

        tokens = self.model.generate(
            inputs.to(self.model.device),
            max_new_tokens=max_new_tokens,
            temperature=0.8,
            repetition_penalty=1.1,
            do_sample=True,
            eos_token_id=self.tokenizer.eos_token_id,
        )

        completion = self.tokenizer.decode(
            tokens[0], skip_special_tokens=False, clean_up_tokenization_space=True
        )
        return completion

    @method()
    def generate_completion(self, query: str, max_depth=5) -> str:
        """Generate a completion for the given query.

        Args:
            query: The query to generate a completion for.
            max_depth: The maximum depth of the recursive iteration.

        Returns:
            The completion for the query.
        """
        logger.info(f"Generating completion for query: {query}")

        current_date = datetime.datetime.now().strftime("%m-%d-%Y")

        tool_names = ["describe_dataset", "query_dataset"]

        system = f"""You are a helpful assistant here to answer questions about \
NBA basketball. The current date is {current_date}. \

You have access can work with tools to answer questions about player stats, \
team stats, etc. Do not respond as if you have already called the function or can \
invoke the tool directly. Ask the user for more details if needed. If you have \
decided to use a tool, you should provide the user with the tool's name and input \
schema as indicated in the format below. The user will then provide the input to the \
tool and give you the output. You can only use the tools provided below.

The following tools are available:

Tool 1: describe_dataset
Description: Describe a dataset by providing a summary of the dataset.
Action Input Schema: {DescribeDatasetArgs.model_json_schema()}

The following datasets are available:

DATASETS:
{"\n".join(self.datasets)}

When given instructions you should break them down into smaller steps and follow them.

Use the following format:

Question: the input question you must answer
Thought: you should think about the instruction and what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action, this must adhere to the schema for the action \
Your output will be parsed and type checked according to the schema, so make sure all
fields in your output match exactly!

After providing the Action Input, you must stop responding and wait \
for the user to provide the result of the action. \
Do not generate any text after the Action Input line.

<USER_RESPONSE>

The user will provide the result of the action here. Once you receive the user's \
response, you can continue the Thought/Action/Action Input cycle until you have enough \
information to provide the final answer.

When you have enough information to answer the original question you should \
respond in the format:

Final Answer: the final answer to the original input question
"""

        print("System:")
        print(system)

        prompt = [
            {
                "role": "system",
                "content": system,
            },
            {
                "role": "user",
                "content": f"Question: {query}",
            },
        ]

        completion = self.run_inference(prompt)
        return completion
