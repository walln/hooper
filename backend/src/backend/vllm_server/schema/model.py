"""Model related schemas compatible with the OpenAI API."""

import time
from typing import List, Optional

from pydantic import BaseModel, Field

from backend.vllm_server.utils import random_uuid

# NOTE: These are currently unused as not all endpoints are implemented


class ModelPermission(BaseModel):
    """Model permission schema."""

    id: str = Field(default_factory=lambda: f"modelperm-{random_uuid()}")
    object: str = "model_permission"
    created: int = Field(default_factory=lambda: int(time.time()))
    allow_create_engine: bool = False
    allow_sampling: bool = True
    allow_logprobs: bool = True
    allow_search_indices: bool = False
    allow_view: bool = True
    allow_fine_tuning: bool = False
    organization: str = "*"
    group: Optional[str] = None
    is_blocking: str = False


class ModelCard(BaseModel):
    """Model card schema."""

    id: str
    object: str = "model"
    created: int = Field(default_factory=lambda: int(time.time()))
    owned_by: str = "vllm"
    root: Optional[str] = None
    parent: Optional[str] = None
    permission: List[ModelPermission] = Field(default_factory=list)


class ModelList(BaseModel):
    """Model list schema."""

    object: str = "list"
    data: List[ModelCard] = Field(default_factory=list)
