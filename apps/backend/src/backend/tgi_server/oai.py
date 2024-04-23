"""OpenAI testing for agent."""

import enum
from typing import List, Union

import modal
from pydantic import BaseModel, Field

app = modal.App(name="openai-test")


class QueryType(str, enum.Enum):
    """Enumeration representing the types of queries that can be asked to a question answer system."""  # noqa: E501

    SINGLE_QUESTION = "SINGLE"
    MERGE_MULTIPLE_RESPONSES = "MERGE_MULTIPLE_RESPONSES"


class Query(BaseModel):
    """Class representing a single question in a query plan."""

    id: int = Field(..., description="Unique id of the query")
    question: str = Field(
        ...,
        description="Question asked using a question answering system",
    )
    dependencies: List[int] = Field(
        default_factory=list,
        description="List of sub questions that need to be answered before asking this question",  # noqa: E501
    )
    node_type: QueryType = Field(
        default=QueryType.SINGLE_QUESTION,
        description="Type of question, either a single question or a multi-question merge",  # noqa: E501
    )


class QueryPlan(BaseModel):
    """Container class representing a tree of questions to ask a question answering system."""  # noqa: E501

    query_graph: List[Query] = Field(
        ..., description="The query graph representing the plan"
    )

    def _dependencies(self, ids: List[int]) -> List[Query]:
        """Returns the dependencies of a query given their ids."""
        return [q for q in self.query_graph if q.id in ids]


class ThinkStep(BaseModel):
    """Think about what to do next."""

    thought: str = Field(..., description="The thought to preserve")

    def execute(self):  # noqa: D102
        print(f"Thinking about: {self.thought}")
        return f"Thought: {self.thought}"


class AnswerQuestion(BaseModel):
    """Respond with a final answer to the question."""

    answer: str = Field(..., description="The answer to the question")

    def execute(self):  # noqa: D102
        print(f"Answering question with: {self.answer}")
        return self.answer


class ListDatasets(BaseModel):
    """List all available datasets in the system."""

    def execute(self):  # noqa: D102
        print("Listing all datasets in the system")
        return [
            {
                "name": "2023-23_player_stats",
                "description": "Player statistics for the 2023-24 NBA season",
            },
            {
                "name": "2023-24_team_stats",
                "description": "Team statistics for the 2023-24 NBA season",
            },
        ]


class QueryDataset(BaseModel):
    """Query a dataset with SQL."""

    name: str = Field(..., description="Name of the dataset")
    query: str = Field(..., description="SQL query to run on the dataset")

    def execute(self):  # noqa: D102
        print(f"Querying dataset {self.name} with query: {self.query}")
        return [{"player_name": "LeBron James", "points": 30}]


class Action(BaseModel):
    """Actions that can be taken."""

    action: Union[ListDatasets, QueryDataset, ThinkStep, AnswerQuestion]

    def execute(self):  # noqa: D102
        return self.action.execute()


@app.local_entrypoint()
def main():
    """Run the OpenAI test client."""
    import os

    import dotenv
    import instructor
    from openai import OpenAI

    dotenv.load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OpenAI secret key not found in environment")

    print(f"API key: {api_key}")

    client = instructor.from_openai(OpenAI(api_key=api_key))

    PLANNING_MODEL = "gpt-4-turbo"

    # question = "What is the capital of France and how large is it compared to Austin?"
    # question = "Who was the best player on the team that lost the NBA finals in 2021?"
    question = "How many points did the best player on the team that lost the NBA finals in 2021 score?"  # noqa: E501
    # messages = [
    #     {
    #         "role": "system",
    #         "content": "You are a world class query planning algorithm capable ofbreaking apart questions into its dependency queries such that the answers can be used to inform the parent question. Do not answer the questions, simply provide a correct compute graph with good specific questions to ask and relevant dependencies. Before you call the function, think step-by-step to get a better understanding of the problem.",  # noqa: E501
    #     },
    #     {
    #         "role": "user",
    #         "content": f"Consider: {question}\n Generate the correct query plan.",
    #     },
    # ]

    # plan = client.chat.completions.create(
    #     model=PLANNING_MODEL,
    #     temperature=0.0,
    #     response_model=QueryPlan,
    #     messages=messages,
    #     max_tokens=512,
    # )

    import json

    # print(json.dumps(plan.model_dump(), indent=2))

    messages = [
        {
            "role": "system",
            "content": "You are a world class query planner that specializes in NBA basketball. You have access to a database of NBA statistics and can answer questions about the NBA. Do not answer the questions, simply provide a correct compute graph with good specific questions to ask and relevant dependencies. Before you call the function, think step-by-step to get a better understanding of the problem.",  # noqa: E501
        },
        {
            "role": "user",
            "content": question,
        },
    ]

    from openai.types.chat import ChatCompletion

    query_depth = 0
    while True:
        print("*" * 80)
        print(f"Iteration: {query_depth}")
        print(f"\nMessages: {json.dumps(messages, indent=2)}\n")
        res, completion = client.chat.completions.create_with_completion(
            model=PLANNING_MODEL,
            temperature=0.0,
            response_model=Action,
            messages=messages,
            max_tokens=512,
        )

        assert isinstance(res, Action), f"Expected Action, got {type(res)}"
        assert isinstance(
            completion, ChatCompletion
        ), f"Expected ChatCompletion, got {type(completion)}"

        print(f"Current action: {res.action.__class__.__name__}")

        action_result = res.execute()
        print(action_result)

        print(f"Completion: {json.dumps(completion.model_dump(), indent=2)}")

        # tool_call = completion.choices[0].message.tool_calls[0]

        messages.append(completion.choices[0].message.model_dump())

        # messages.append(
        #     {
        #         "tool_call_id": tool_call.id,
        #         "role": "tool",
        #         "name": tool_call.function.name,
        #         "content": action_result,
        #     }
        # )
        action_result_message = f"Selected Action: {messages[-1]}"
        print(action_result_message)

        if isinstance(res.action, AnswerQuestion):
            print("Finished!")
            break
        query_depth = query_depth + 1

        if query_depth > 2:
            print("Query depth exceeded")
            break
