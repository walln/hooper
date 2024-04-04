"""Tools that the Agent can use."""

from typing import Union

from pydantic import BaseModel, Field, field_validator


class Think(BaseModel):
    """Write down your thoughts or reasoning without taking any external action."""

    thoughts: str = Field(description="The thoughts or reasoning to write down.")


class ListDatasets(BaseModel):
    """List the available datasets."""

    league: str = Field(description="The league of the dataset.", default="NBA")

    def process(self):
        """Process the ListDatasets action."""
        return self.league


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


class TakeAction(BaseModel):
    """Take an action."""

    action: Union[ListDatasets, DescribeDataset, Think]

    def process(self):
        """Process the action."""
        return self.action.process()
