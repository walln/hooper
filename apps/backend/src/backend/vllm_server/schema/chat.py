"""Chat related schemas compatible with the OpenAI API."""

import time
from typing import Dict, List, Literal, Optional, Union

from pydantic import BaseModel, Field, model_validator
from vllm.sampling_params import SamplingParams
from vllm.utils import random_uuid

from backend.vllm_server.schema.common import (
    DeltaMessage,
    LogProbs,
    ResponseFormat,
    UsageInfo,
)


class ChatCompletionRequest(BaseModel):
    """Chat completion endpoint API request body compliant schema."""

    # Ordered by official OpenAI API documentation
    # https://platform.openai.com/docs/api-reference/chat/create
    messages: List[Dict[str, str]]
    model: str
    frequency_penalty: Optional[float] = 0.0
    logit_bias: Optional[Dict[str, float]] = None
    logprobs: Optional[bool] = False
    top_logprobs: Optional[int] = None
    max_tokens: Optional[int] = None
    n: Optional[int] = 1
    presence_penalty: Optional[float] = 0.0
    response_format: Optional[ResponseFormat] = None
    seed: Optional[int] = None
    stop: Optional[Union[str, List[str]]] = Field(default_factory=list)
    stream: Optional[bool] = False
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 1.0
    user: Optional[str] = None

    # doc: begin-chat-completion-sampling-params
    best_of: Optional[int] = None
    use_beam_search: Optional[bool] = False
    top_k: Optional[int] = -1
    min_p: Optional[float] = 0.0
    repetition_penalty: Optional[float] = 1.0
    length_penalty: Optional[float] = 1.0
    early_stopping: Optional[bool] = False
    ignore_eos: Optional[bool] = False
    min_tokens: Optional[int] = 0
    stop_token_ids: Optional[List[int]] = Field(default_factory=list)
    skip_special_tokens: Optional[bool] = True
    spaces_between_special_tokens: Optional[bool] = True
    # doc: end-chat-completion-sampling-params

    # doc: begin-chat-completion-extra-params
    echo: Optional[bool] = Field(
        default=False,
        description=(
            "If true, the new message will be prepended with the last message "
            "if they belong to the same role."
        ),
    )
    add_generation_prompt: Optional[bool] = Field(
        default=True,
        description=(
            "If true, the generation prompt will be added to the chat template. "
            "This is a parameter used by chat template in tokenizer config of the "
            "model."
        ),
    )
    include_stop_str_in_output: Optional[bool] = Field(
        default=False,
        description=(
            "Whether to include the stop string in the output. "
            "This is only applied when the stop or stop_token_ids is set."
        ),
    )
    guided_json: Optional[Union[str, dict, BaseModel]] = Field(
        default=None,
        description=("If specified, the output will follow the JSON schema."),
    )
    guided_regex: Optional[str] = Field(
        default=None,
        description=("If specified, the output will follow the regex pattern."),
    )
    guided_choice: Optional[List[str]] = Field(
        default=None,
        description=("If specified, the output will be exactly one of the choices."),
    )
    guided_grammar: Optional[str] = Field(
        default=None,
        description=("If specified, the output will follow the context free grammar."),
    )

    def to_sampling_params(self) -> SamplingParams:
        """Construct the sampling parameters from the request."""
        if self.logprobs and not self.top_logprobs:
            raise ValueError("Top logprobs must be set when logprobs is.")

        logits_processors = None
        if self.logit_bias:

            def logit_bias_logits_processor(token_ids: List[int], logits):
                for token_id, bias in self.logit_bias.items():
                    # Clamp the bias between -100 and 100 per OpenAI API spec
                    bias = min(100, max(-100, bias))
                    logits[int(token_id)] += bias
                return logits

            logits_processors = [logit_bias_logits_processor]

        params = SamplingParams(
            n=self.n,
            best_of=self.best_of,
            presence_penalty=self.presence_penalty,
            frequency_penalty=self.frequency_penalty,
            repetition_penalty=self.repetition_penalty,
            temperature=self.temperature,
            top_p=self.top_p,
            top_k=self.top_k,
            min_p=self.min_p,
            # seed=self.seed,
            use_beam_search=self.use_beam_search,
            length_penalty=self.length_penalty,
            early_stopping=self.early_stopping,
            stop=self.stop,
            stop_token_ids=self.stop_token_ids,
            include_stop_str_in_output=self.include_stop_str_in_output,
            ignore_eos=self.ignore_eos,
            max_tokens=self.max_tokens,
            logprobs=self.top_logprobs if self.logprobs else None,
            prompt_logprobs=self.top_logprobs if self.echo else None,
            skip_special_tokens=self.skip_special_tokens,
            spaces_between_special_tokens=self.spaces_between_special_tokens,
            logits_processors=logits_processors,
        )

        # TODO: the vllm version that is on the modal registry has pytorch incompatible
        # with the current version of the vllm package. So the modal instance is
        # running an older patch. But vllm violated semver the sampling params
        # signature has changed. So the seed parameter is not available in modal runtime
        # Fix this once updated vllm on modal image.
        params.seed = self.seed

        return params

    @model_validator(mode="before")
    @classmethod
    def check_guided_decoding_count(cls, data):
        """Check that only one type of guided decoding is used."""
        guide_count = sum(
            [
                "guided_json" in data and data["guided_json"] is not None,
                "guided_regex" in data and data["guided_regex"] is not None,
                "guided_choice" in data and data["guided_choice"] is not None,
            ]
        )
        if guide_count > 1:
            raise ValueError(
                "You can only use one kind of guided decoding "
                "('guided_json', 'guided_regex' or 'guided_choice')."
            )
        return data


class ChatMessage(BaseModel):
    """Chat message schema."""

    role: str
    content: str


class ChatCompletionResponseChoice(BaseModel):
    """Chat completion response choice schema."""

    index: int
    message: ChatMessage
    logprobs: Optional[LogProbs] = None
    finish_reason: Optional[Literal["stop", "length"]] = None
    stop_reason: Union[None, int, str] = None


class ChatCompletionResponse(BaseModel):
    """Chat completion endpoint API response body compliant schema."""

    id: str = Field(default_factory=lambda: f"chatcmpl-{random_uuid()}")
    object: str = "chat.completion"
    created: int = Field(default_factory=lambda: int(time.time()))
    model: str
    choices: List[ChatCompletionResponseChoice]
    usage: UsageInfo


class ChatCompletionResponseStreamChoice(BaseModel):
    """Chat completion response choice schema for streaming responses."""

    index: int
    delta: DeltaMessage
    logprobs: Optional[LogProbs] = None
    finish_reason: Optional[Literal["stop", "length"]] = None
    stop_reason: Union[None, int, str] = None


class ChatCompletionStreamResponse(BaseModel):
    """Chat completion endpoint API response body compliant schema for streaming."""

    id: str = Field(default_factory=lambda: f"chatcmpl-{random_uuid()}")
    object: str = "chat.completion.chunk"
    created: int = Field(default_factory=lambda: int(time.time()))
    model: str
    choices: List[ChatCompletionResponseStreamChoice]
    usage: Optional[UsageInfo] = Field(default=None)
