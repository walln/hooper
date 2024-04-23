"""Common response schemas compatible with the OpenAI API."""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Error response schema compliant with OpenAI API specification."""

    object: str = "error"
    message: str
    type: str
    param: Optional[str] = None
    code: int


class UsageInfo(BaseModel):
    """Usage information schema."""

    prompt_tokens: int = 0
    total_tokens: int = 0
    completion_tokens: Optional[int] = 0


class ResponseFormat(BaseModel):
    """Response format schema."""

    type: str = Literal["text", "json_object"]


class LogProbs(BaseModel):
    """Logprobs schema."""

    text_offset: List[int] = Field(default_factory=list)
    token_logprobs: List[Optional[float]] = Field(default_factory=list)
    tokens: List[str] = Field(default_factory=list)
    top_logprobs: Optional[List[Optional[Dict[str, float]]]] = None


class DeltaMessage(BaseModel):
    """Delta message schema."""

    role: Optional[str] = None
    content: Optional[str] = None
