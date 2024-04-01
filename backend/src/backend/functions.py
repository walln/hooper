"""Tools that the Agent can use."""

from langchain_core.utils.function_calling import convert_to_openai_function
from pydantic import BaseModel, Field, field_validator


class Think(BaseModel):
    """Write down your thoughts or reasoning without taking any external action."""

    thoughts: str = Field(description="The thoughts or reasoning to write down.")


class DescribeDataset(BaseModel):
    """Describe the dataframe with the first 5 rows and the column names."""

    dataset_name: str = Field(description="The name of the dataset.")

    @field_validator("dataset_name")
    @classmethod
    def dataset_name_must_be_valid(cls, field):
        """Ensure that the dataset name is valid."""
        if not field:
            raise ValueError("Dataset name must be valid.")
        return field


tool_schemas = [Think, DescribeDataset]
tool_schemas_openai = [
    convert_to_openai_function(tool_schema) for tool_schema in tool_schemas
]

print(tool_schemas_openai)
