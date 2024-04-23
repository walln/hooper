"""Function calling schemas."""

from pydantic import BaseModel, Field


class DescribeDatasetArgs(BaseModel):
    """Request schema for describing a dataset."""

    dataset_name: str = Field(description="The name of the dataset to describe.")


class DescribeDatasetResponse(BaseModel):
    """Response schema for describing a dataset."""

    description: dict = Field(description="The description of the dataset.")
