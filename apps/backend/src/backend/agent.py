"""Agent module for orchestrating LLM interactions."""

import datetime
import os

import polars as pl
from modal import Image, Mount, Stub, enter, gpu, method
from openai import OpenAI

from backend.functions import TakeAction
from backend.schema import DescribeDatasetArgs
from backend.utils import VLLM_API_URL, logger
from backend.vllm_server.infra import BASE_MODEL

GPU_TYPE = gpu.A10G()

stub = Stub("hooper-backend")

image = (
    Image.debian_slim()
    .apt_install("git")
    # .pip_install("wheel", "ninja", "packaging")
    .pip_install(
        "polars",
        "langchain",
        "pydantic>=2.6.4",
        "fastapi>=0.110.0",
        "openai",
        "anthropic",
        "instructor",
    )
)

LOCAL_DATA_PATH = os.path.join(os.getcwd(), "backend/nba_data")
CACHE_PATH = "/root/model_cache"
# MODEL_NAME = "NousResearch/Hermes-2-Pro-Mistral-7B"
QUESTION = "Who has lead the league is scoring this season?"


# TODO: Wire up to the vLLM server with OpenAI compliant API
@stub.cls(
    image=image,
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

        This method is called on container start and is used to load the api
        client, datasets, and other necessary artifacts.
        """
        self.create_chat_client()
        self.load_data()

    def create_chat_client(self):
        """Create a chat client for the vLLM server."""
        openai_client = OpenAI(
            base_url=VLLM_API_URL,
            api_key="token-abc123",
        )

        import instructor

        client = instructor.from_openai(openai_client)
        self.client = client

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

        datasets_prompt = "\n".join(self.datasets)

        system = f"""You are a helpful assistant here to answer questions about NBA basketball. The current date is {current_date}.

You have access can work with tools to answer questions about player stats, team stats, etc.
Ask the user for more details if needed. If you have decided to use a tool, you should provide the user with the tool's name and input schema as indicated in the format below.
The user will then provide the input to the tool and give you the output. You can only use the tools provided below.

The following tools are available:

Tool 1: describe_dataset
Description: Describe a dataset by providing a summary of the dataset.
Action Input Schema: {DescribeDatasetArgs.model_json_schema()}

The following datasets are available:

DATASETS:
{datasets_prompt}

When given instructions you should break them down into smaller steps and follow them.

Use the following format:

Question: the input question you must answer
Thought: you should think about the instruction and what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action, this must adhere to the schema for the action
Your output will be parsed and type checked according to the schema, so make sure all fields in your output match exactly!

After providing the Action Input, you must stop responding and wait for the user to provide the result of the action.
Do not generate any text after the Action Input line.

<USER_RESPONSE>

The user will provide the result of the action here. Once you receive the user's response, you can continue the Thought/Action/Action Input cycle until you have enough information to provide the final answer.

When you have enough information to answer the original question you should respond in the format:

Final Answer: the final answer to the original input question
"""  # noqa: E501

        print("System:")
        print(system)

        prompt = [
            # {
            #     "role": "system",
            #     "content": system,
            # },
            {
                "role": "user",
                "content": f"Question: {query}",
            },
        ]

        completion = self.client.chat.completions.create(
            model=BASE_MODEL,
            response_model=TakeAction,
            messages=prompt,
            stream=False,
        )

        return completion


# TODO: Check this out https://github.com/vllm-project/vllm/pull/3237
# VLLM guided decoding needs this pr to be merged before tool usage is supported
# could potentially just force a function calling tuned model (Nous/Hermes) to get
# around this issue but then there are reliability issues and stability issues
# for now maybe just fall back to an API provider (Anthropic new tools support looks
# very promising: long context for flattened tools, native CoT tool, etc.)


@stub.local_entrypoint()
def test_agent():
    """Test the agent by prompting it with a question."""
    logger.info("Running test_agent...")
    QUESTION = "What datasets are available?"
    response = Agent().generate_completion.remote(QUESTION)
    print(f"Response:\n {response}")
