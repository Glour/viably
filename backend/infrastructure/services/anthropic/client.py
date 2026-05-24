"""Anthropic API client for AI code generation."""

import json
import logging
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Optional

from anthropic import AsyncAnthropic
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from infrastructure.services.anthropic.config import get_max_tokens, get_model_name
from infrastructure.services.common.exceptions import (
    ExternalServiceError,
    ExternalServiceTimeout,
)

# Special marker prefix for token usage data in streaming responses
USAGE_MARKER = "__USAGE__"

logger = logging.getLogger(__name__)


class AnthropicClient:
    """Client for Anthropic Claude API with retry logic.

    Provides async methods for code generation with streaming support.
    Uses dependency injection pattern instead of singleton.

    Example:
        client = AnthropicClient(api_key=settings.ANTHROPIC_API_KEY)
        code = await client.generate_code(
            prompt="Create a FastAPI endpoint",
            system_prompt="You are a Python expert"
        )
    """

    def __init__(
        self,
        api_key: str,
        default_model: str | None = None,
        default_max_tokens: int | None = None,
        base_url: str | None = None,
    ):
        """Initialize Anthropic client.

        Args:
            api_key: Anthropic API key or gateway product key
            default_model: Default model to use (defaults to config)
            default_max_tokens: Default max tokens (defaults to config)
            base_url: Optional base URL override (e.g. AI Gateway URL)
        """
        if base_url:
            self.client = AsyncAnthropic(api_key=api_key, base_url=base_url)
        else:
            self.client = AsyncAnthropic(api_key=api_key)
        self.default_model = get_model_name(default_model)
        self.default_max_tokens = default_max_tokens or 8192

    @retry(
        retry=retry_if_exception_type(Exception),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def generate_code(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Generate code using Claude API with retry logic.

        Args:
            prompt: User prompt with requirements
            system_prompt: System instructions for the model
            model: Model to use (defaults to default_model)
            max_tokens: Max tokens (defaults to default_max_tokens)

        Returns:
            Generated text content from Claude

        Raises:
            ExternalServiceError: If API call fails after retries
            ExternalServiceTimeout: If API call times out
        """
        model_name = get_model_name(model) if model else self.default_model
        tokens = get_max_tokens(
            model_name, max_tokens or self.default_max_tokens
        )

        logger.info(
            "Anthropic API request",
            extra={
                "model": model_name,
                "max_tokens": tokens,
                "prompt_length": len(prompt),
                "system_prompt_length": len(system_prompt),
            },
        )

        try:
            system_param = [
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ]

            response = await self.client.messages.create(
                model=model_name,
                max_tokens=tokens,
                system=system_param,
                messages=[{"role": "user", "content": prompt}],
            )

            # Extract text from first TextBlock in response
            first_block = response.content[0]
            result = first_block.text if hasattr(first_block, "text") else ""

            logger.info(
                "Anthropic API response",
                extra={
                    "model": model_name,
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "response_length": len(result),
                },
            )

            return result

        except Exception as e:
            logger.error(
                "Anthropic API error",
                extra={
                    "model": model_name,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            raise ExternalServiceError(
                "Anthropic",
                f"Code generation failed: {str(e)}",
            ) from e

    async def generate_code_streaming(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate code using Claude API with streaming.

        Yields text deltas as they arrive from the API, enabling
        real-time progress updates and code snippet delivery.

        Args:
            prompt: User prompt with requirements
            system_prompt: System instructions for the model
            model: Model to use (defaults to default_model)
            max_tokens: Max tokens (defaults to default_max_tokens)

        Yields:
            Text chunks as they arrive from the API

        Raises:
            ExternalServiceError: If API call fails
        """
        model_name = get_model_name(model) if model else self.default_model
        tokens = get_max_tokens(
            model_name, max_tokens or self.default_max_tokens
        )

        logger.info(
            "Anthropic API streaming request",
            extra={
                "model": model_name,
                "max_tokens": tokens,
                "prompt_length": len(prompt),
            },
        )

        try:
            system_param = [
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ]

            async with self.client.messages.stream(
                model=model_name,
                max_tokens=tokens,
                system=system_param,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                async for text in stream.text_stream:
                    yield text

                # Extract token usage
                final_message = await stream.get_final_message()
                usage = final_message.usage
                usage_data = {
                    "input_tokens": usage.input_tokens,
                    "output_tokens": usage.output_tokens,
                    "cache_read_tokens": getattr(usage, "cache_read_input_tokens", 0) or 0,
                    "cache_creation_tokens": getattr(usage, "cache_creation_input_tokens", 0) or 0,
                    "model": model_name,
                }

            yield f"{USAGE_MARKER}{json.dumps(usage_data)}"

            logger.info(
                "Anthropic API streaming complete",
                extra={
                    "model": model_name,
                    "input_tokens": usage_data["input_tokens"],
                    "output_tokens": usage_data["output_tokens"],
                },
            )

        except Exception as e:
            logger.error(
                "Anthropic API streaming error",
                extra={
                    "model": model_name,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            raise ExternalServiceError(
                "Anthropic",
                f"Streaming code generation failed: {str(e)}",
            ) from e

    async def stream_messages(
        self,
        messages: list[dict],
        system: str | list[dict],
        model: str | None = None,
        max_tokens: int | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream messages with full conversation history.

        Args:
            messages: List of message dicts with role/content.
            system: System prompt string or list of content blocks with cache_control.
            model: Model override.
            max_tokens: Max tokens override.

        Yields:
            Text chunks from the API, followed by a final USAGE_MARKER
            chunk with JSON token usage data.
        """
        model_name = get_model_name(model) if model else self.default_model
        tokens = get_max_tokens(
            model_name, max_tokens or self.default_max_tokens
        )

        logger.info(
            "Anthropic API stream_messages request",
            extra={
                "model": model_name,
                "max_tokens": tokens,
                "message_count": len(messages),
            },
        )

        try:
            # Build system param: accept both str and list[dict] for prompt caching
            if isinstance(system, list):
                system_param = system
            elif system:
                system_param = [
                    {
                        "type": "text",
                        "text": system,
                        "cache_control": {"type": "ephemeral"},
                    }
                ]
            else:
                system_param = None

            async with self.client.messages.stream(
                model=model_name,
                max_tokens=tokens,
                system=system_param,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield text

                # Ensure stream fully consumed (message_stop processed) before snapshot
                final_message = await stream.get_final_message()
                usage = final_message.usage
                usage_data = {
                    "input_tokens": usage.input_tokens,
                    "output_tokens": usage.output_tokens,
                    "cache_read_tokens": getattr(usage, "cache_read_input_tokens", 0) or 0,
                    "cache_creation_tokens": getattr(usage, "cache_creation_input_tokens", 0) or 0,
                    "model": model_name,
                }

            # Yield usage marker after stream context manager exits
            yield f"{USAGE_MARKER}{json.dumps(usage_data)}"

            logger.info(
                "Anthropic API stream_messages complete",
                extra={
                    "model": model_name,
                    "input_tokens": usage_data["input_tokens"],
                    "output_tokens": usage_data["output_tokens"],
                    "cache_read_tokens": usage_data["cache_read_tokens"],
                    "cache_creation_tokens": usage_data["cache_creation_tokens"],
                },
            )

        except Exception as e:
            logger.error(
                "Anthropic API stream_messages error",
                extra={
                    "model": model_name,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            raise ExternalServiceError(
                "Anthropic",
                f"Stream messages failed: {str(e)}",
            ) from e


def get_anthropic_client(api_key: str) -> AnthropicClient:
    """Factory function for dependency injection.

    Args:
        api_key: Anthropic API key

    Returns:
        Configured AnthropicClient instance

    Example:
        # In FastAPI dependency
        def get_client() -> AnthropicClient:
            return get_anthropic_client(settings.ANTHROPIC_API_KEY)
    """
    return AnthropicClient(api_key=api_key)
