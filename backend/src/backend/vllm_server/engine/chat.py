"""Chat completion vLLM engine implementing OpenAI api functionality."""

import codecs
import time
from typing import AsyncGenerator, AsyncIterator, Union

from vllm.engine.async_llm_engine import AsyncLLMEngine

# from vllm.model_executor.guided_decoding import get_guided_decoding_logits_processor
from vllm.outputs import RequestOutput

from backend.vllm_server.engine.base import BaseEngine
from backend.vllm_server.logger import init_logger
from backend.vllm_server.schema.chat import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionResponseChoice,
    ChatCompletionResponseStreamChoice,
    ChatCompletionStreamResponse,
    ChatMessage,
)
from backend.vllm_server.schema.common import (
    DeltaMessage,
    ErrorResponse,
    UsageInfo,
)
from backend.vllm_server.utils import (
    create_error_response,
    create_streaming_error_response,
)

logger = init_logger(__name__)


class ChatEngine(BaseEngine):
    """Chat completion vLLM engine implementing OpenAI api functionality."""

    def __init__(
        self,
        engine: AsyncLLMEngine,
        model_name: str,
        response_role: str,
        chat_template=None,
    ):
        """Initialize the chat engine.

        Creates a chat engine for generating chat completions based on the given
        chat message history and chat settings. Also configures the chat template
        for the tokenizer.

        Args:
            engine: The vLLM engine to use.
            model_name: The name of the model being served.
            response_role: The role of the response in the chat.
            chat_template: The chat template to use for the tokenizer.
        """
        super().__init__(engine=engine, model_name=model_name)
        self.response_role = response_role
        self._load_chat_template(chat_template)

    async def create_chat_completion_generator(
        self, request: ChatCompletionRequest, request_id: str
    ) -> Union[ErrorResponse, AsyncIterator[RequestOutput]]:
        """Completion API compliant with OpenAI API.

        Mimics the OpenAI API for generating chat completions based on the given
        chat history and chat settings.

        Needs updating to support function calling in the future.

        Args:
            request: The chat completion request.
            request_id: The request ID.

        Returns:
            The chat completion generator and the request_id.
        """
        model_validation_err = self.check_model(request)
        if model_validation_err is not None:
            return model_validation_err

        try:
            prompt = self.tokenizer.apply_chat_template(
                conversation=request.messages,
                tokenize=False,
                add_generation_prompt=request.add_generation_prompt,
            )
        except Exception as e:
            logger.error(f"Failed to apply chat template: {e!s}")
            logger.error(f"conversation: {request.messages}")
            return create_error_response(str(e))

        try:
            token_ids = self._validate_prompt_and_tokenize(request, prompt=prompt)
            print("In chat engine. Typeof request", type(request))
            sampling_params = request.to_sampling_params()
            # sampling_params = request.to_sampling_params()

            # guided_decoding_logits_processor = (
            #     await get_guided_decoding_logits_processor(
            #         request, await self.engine.get_tokenizer()
            #     )
            # )
            # if guided_decoding_logits_processor:
            #     if sampling_params.logits_processors is None:
            #         sampling_params.logits_processors = []
            #     sampling_params.logits_processors.append(
            #         guided_decoding_logits_processor
            #     )

        except ValueError as e:
            return create_error_response(str(e))

        results_generator = self.engine.generate(
            prompt, sampling_params, request_id, token_ids
        )
        print("created results_generator")
        return results_generator

    def get_chat_request_role(self, request: ChatCompletionRequest) -> str:
        """Get the role of the chat request.

        Args:
            request: The chat completion request.

        Returns:
            The role of the chat request.
        """
        if request.add_generation_prompt:
            return self.response_role
        else:
            return request.messages[-1]["role"]

    async def chat_completion_stream_generator(
        self,
        request: ChatCompletionRequest,
        results_generator: AsyncIterator[RequestOutput],
        request_id: str,
    ) -> Union[ErrorResponse, AsyncGenerator[str, None]]:
        """Generate the chat completion stream.

        Generate a stream of tokens for the chat completion based on the given chat
        history and chat settings.

        Args:
            request: The chat completion request.
            results_generator: The generator of request outputs.
            request_id: The request ID.

        Returns:
            The chat completion stream or an error.
        """
        model_name = self.model_name
        created_time = int(time.time())
        chunk_object_type = "chat.completion.chunk"
        first_iteration = True

        # Send response for each token for each request.n (index)
        previous_texts = [""] * request.n
        previous_num_tokens = [0] * request.n
        finish_reason_sent = [False] * request.n

        try:
            async for res in results_generator:
                res: RequestOutput
                # We need to do it here, because if there are exceptions in
                # the result_generator, it needs to be sent as the FIRST
                # response (by the try...catch).
                if first_iteration:
                    # Send first response for each request.n (index) with
                    # the role
                    role = self.get_chat_request_role(request)
                    for i in range(request.n):
                        choice_data = ChatCompletionResponseStreamChoice(
                            index=i,
                            delta=DeltaMessage(role=role),
                            logprobs=None,
                            finish_reason=None,
                        )
                        chunk = ChatCompletionStreamResponse(
                            id=request_id,
                            object=chunk_object_type,
                            created=created_time,
                            choices=[choice_data],
                            model=model_name,
                        )
                        data = chunk.model_dump_json(exclude_unset=True)
                        yield f"data: {data}\n\n"

                    # Send response to echo the input portion of the
                    # last message
                    if request.echo:
                        last_msg_content = ""
                        if (
                            request.messages
                            and isinstance(request.messages, list)
                            and request.messages[-1].get("content")
                            and request.messages[-1].get("role") == role
                        ):
                            last_msg_content = request.messages[-1]["content"]

                        if last_msg_content:
                            for i in range(request.n):
                                choice_data = ChatCompletionResponseStreamChoice(
                                    index=i,
                                    delta=DeltaMessage(content=last_msg_content),
                                    finish_reason=None,
                                )
                                chunk = ChatCompletionStreamResponse(
                                    id=request_id,
                                    object=chunk_object_type,
                                    created=created_time,
                                    choices=[choice_data],
                                    logprobs=None,
                                    model=model_name,
                                )
                                data = chunk.model_dump_json(exclude_unset=True)
                                yield f"data: {data}\n\n"
                    first_iteration = False

                for output in res.outputs:
                    i = output.index

                    if finish_reason_sent[i]:
                        continue

                    delta_token_ids = output.token_ids[previous_num_tokens[i] :]
                    top_logprobs = (
                        output.logprobs[previous_num_tokens[i] :]
                        if output.logprobs
                        else None
                    )

                    if request.logprobs:
                        logprobs = self._create_logprobs(
                            token_ids=delta_token_ids,
                            top_logprobs=top_logprobs,
                            num_output_top_logprobs=request.logprobs,
                            initial_text_offset=len(previous_texts[i]),
                        )
                    else:
                        logprobs = None

                    delta_text = output.text[len(previous_texts[i]) :]
                    previous_texts[i] = output.text
                    previous_num_tokens[i] = len(output.token_ids)
                    if output.finish_reason is None:
                        # Send token-by-token response for each request.n
                        choice_data = ChatCompletionResponseStreamChoice(
                            index=i,
                            delta=DeltaMessage(content=delta_text),
                            logprobs=logprobs,
                            finish_reason=None,
                        )
                        chunk = ChatCompletionStreamResponse(
                            id=request_id,
                            object=chunk_object_type,
                            created=created_time,
                            choices=[choice_data],
                            model=model_name,
                        )
                        data = chunk.model_dump_json(exclude_unset=True)
                        yield f"data: {data}\n\n"
                    else:
                        # Send the finish response for each request.n only once
                        prompt_tokens = len(res.prompt_token_ids)
                        final_usage = UsageInfo(
                            prompt_tokens=prompt_tokens,
                            completion_tokens=previous_num_tokens[i],
                            total_tokens=prompt_tokens + previous_num_tokens[i],
                        )
                        choice_data = ChatCompletionResponseStreamChoice(
                            index=i,
                            delta=DeltaMessage(content=delta_text),
                            logprobs=logprobs,
                            finish_reason=output.finish_reason,
                        )
                        chunk = ChatCompletionStreamResponse(
                            id=request_id,
                            object=chunk_object_type,
                            created=created_time,
                            choices=[choice_data],
                            model=model_name,
                        )
                        if final_usage is not None:
                            chunk.usage = final_usage
                        data = chunk.model_dump_json(
                            exclude_unset=True, exclude_none=True
                        )
                        yield f"data: {data}\n\n"
                        finish_reason_sent[i] = True
        except ValueError as e:
            data = create_streaming_error_response(str(e))
            yield f"data: {data}\n\n"
        # Send the final done message after all response.n are finished
        yield "data: [DONE]\n\n"

    async def chat_completion_full_generator(
        self,
        request: ChatCompletionRequest,
        results_generator: AsyncIterator[RequestOutput],
        request_id: str,
    ) -> Union[ErrorResponse, ChatCompletionResponse]:
        """Generate the full chat completion response.

        Generate the full chat completion response based on the given chat history
        this is a blocking operation rather than a generation stream. If the stream
        operation fails this is also the fallback generator.

        Args:
            request: The chat completion request.
            results_generator: The generator of request outputs.
            request_id: The request ID.

        Returns:
            The chat completion response or an error.
        """
        model_name = self.model_name
        created_time = int(time.time())
        final_res: RequestOutput = None

        async for res in results_generator:
            final_res = res
        assert final_res is not None

        choices = []
        role = self.get_chat_request_role(request)

        for output in final_res.outputs:
            token_ids = output.token_ids
            top_logprobs = output.logprobs

            if request.logprobs:
                logprobs = self._create_logprobs(
                    token_ids=token_ids,
                    top_logprobs=top_logprobs,
                    num_output_top_logprobs=request.logprobs,
                )
            else:
                logprobs = None

            choice_data = ChatCompletionResponseChoice(
                index=output.index,
                message=ChatMessage(role=role, content=output.text),
                logprobs=logprobs,
                finish_reason=output.finish_reason,
                # stop_reason=output.stop_reason,
            )
            choices.append(choice_data)

        if request.echo:
            last_msg_content = ""
            if (
                request.messages
                and isinstance(request.messages, list)
                and request.messages[-1].get("content")
                and request.messages[-1].get("role") == role
            ):
                last_msg_content = request.messages[-1]["content"]

            for choice in choices:
                full_message = last_msg_content + choice.message.content
                choice.message.content = full_message

        num_prompt_tokens = len(final_res.prompt_token_ids)
        num_generated_tokens = sum(
            len(output.token_ids) for output in final_res.outputs
        )
        usage = UsageInfo(
            prompt_tokens=num_prompt_tokens,
            completion_tokens=num_generated_tokens,
            total_tokens=num_prompt_tokens + num_generated_tokens,
        )
        print("Created usage info", usage)
        response = ChatCompletionResponse(
            id=request_id,
            created=created_time,
            model=model_name,
            choices=choices,
            usage=usage,
        )

        print("chat completion response", response.model_dump())

        return response

    def _load_chat_template(self, chat_template: str):
        if chat_template is not None:
            try:
                with open(chat_template) as f:
                    self.tokenizer.chat_template = f.read()
            except OSError:
                # If the file does not exist or cannot be opened, fallback to
                # using the supplied template as a decoded template

                self.tokenizer.chat_template = codecs.decode(
                    chat_template, "unicode_escape"
                )

                logger.info(
                    f"Using supplied chat template: \n{self.tokenizer.chat_template}"
                )

        elif self.tokenizer.chat_template is not None:
            logger.info(
                f"Using default chat template: \n{self.tokenizer.chat_template}"
            )

        else:
            logger.error("No chat template provided or set in tokenizer")
