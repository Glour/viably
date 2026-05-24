"""Main agent loop: iterative Claude Tool Use until end_turn or budget exceeded."""

import logging
import time
from collections.abc import AsyncGenerator
from typing import Any

from anthropic import AsyncAnthropic

from api.src.ai.agent.budget import AgentBudget
from api.src.ai.agent.events import (
    AgentEvent,
    FinalTextEvent,
    IterationEvent,
    TextEvent,
    ToolCallEvent,
    ToolResultEvent,
)
from api.src.ai.agent.tools import ProjectWorkspace, ToolExecutor

logger = logging.getLogger(__name__)


class AgentLoop:
    """Iterative agent loop using Anthropic Tool Use API.

    Runs Claude in a loop: stream response -> execute tool calls -> feed results
    back -> repeat until Claude says end_turn or budget is exceeded.

    After Claude signals end_turn, a mandatory validation gate runs. If errors
    are found, the validation result is injected back into the conversation and
    Claude gets another chance to fix the issues.
    """

    def __init__(
        self,
        client: AsyncAnthropic,
        model: str,
        system: str,
        tools: list[dict[str, Any]],
        budget: AgentBudget,
        workspace: ProjectWorkspace,
        max_tokens_per_turn: int = 64000,
    ) -> None:
        self.client = client
        self.model = model
        self.system = system
        self.tools = tools
        self.budget = budget
        self.workspace = workspace
        self.executor = ToolExecutor(workspace)
        self.max_tokens_per_turn = max_tokens_per_turn
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self._validation_retries = 0
        self._max_validation_retries = 2

    @property
    def total_tokens(self) -> int:
        return self.total_input_tokens + self.total_output_tokens

    async def run(
        self, messages: list[dict[str, Any]]
    ) -> AsyncGenerator[AgentEvent, None]:
        """Run the agent loop, yielding events as they happen.

        Args:
            messages: Initial conversation messages (user/assistant history).
                      Will be mutated in-place to append assistant/tool messages.

        Yields:
            AgentEvent instances: TextEvent, ToolCallEvent, ToolResultEvent,
            IterationEvent.
        """
        iteration = 0
        start_time = time.monotonic()
        last_text = ""  # Text from the most recent iteration (final answer)

        system_param = [
            {
                "type": "text",
                "text": self.system,
                "cache_control": {"type": "ephemeral"},
            }
        ]

        while iteration < self.budget.max_iterations:
            # Timeout check
            elapsed = time.monotonic() - start_time
            if elapsed > self.budget.timeout_seconds:
                logger.warning(
                    "Agent loop timeout after %.0fs (iteration %d)",
                    elapsed, iteration,
                )
                break

            iteration += 1
            logger.info(
                "Agent loop iteration %d/%d (tokens: %d)",
                iteration, self.budget.max_iterations, self.total_tokens,
            )

            # Call Anthropic API via streaming (required for long requests)
            try:
                async with self.client.messages.stream(
                    model=self.model,
                    max_tokens=self.max_tokens_per_turn,
                    system=system_param,
                    messages=messages,
                    tools=self.tools,
                ) as stream:
                    response = await stream.get_final_message()
            except Exception as e:
                logger.error("Agent loop API error on iteration %d: %s", iteration, e)
                raise

            # Track token usage
            self.total_input_tokens += response.usage.input_tokens
            self.total_output_tokens += response.usage.output_tokens

            # Process content blocks
            tool_uses = []
            text_parts = []

            for block in response.content:
                if block.type == "text":
                    text_parts.append(block.text)
                    # Intermediate TextEvent — NOT shown to user, used for logging
                    yield TextEvent(content=block.text)
                elif block.type == "tool_use":
                    tool_uses.append(block)
                    yield ToolCallEvent(
                        tool_name=block.name,
                        tool_input=block.input,
                        iteration=iteration,
                    )

            # Track last text for final answer
            if text_parts:
                last_text = "".join(text_parts)

            # If Claude finished with end_turn and no tool calls — run validation gate
            if response.stop_reason == "end_turn" and not tool_uses:
                gate_result = self._run_validation_gate(
                    messages, response, iteration,
                )
                for event in gate_result.events:
                    yield event
                if not gate_result.should_continue:
                    break
                # Validation found errors, injected them — continue loop
                continue

            # Execute tool calls
            tool_results = []
            for tool_block in tool_uses:
                result_text, success = self.executor.execute(
                    tool_block.name, tool_block.input,
                )
                yield ToolResultEvent(
                    tool_name=tool_block.name,
                    success=success,
                    summary=result_text[:200],
                    iteration=iteration,
                )
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_block.id,
                    "content": result_text,
                })

            # Append assistant message + tool results to conversation
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

            # If Claude said end_turn but had tool calls, we already executed them.
            # Run validation gate before finishing.
            if response.stop_reason == "end_turn":
                gate_result = self._run_validation_gate(
                    messages, response=None, iteration=iteration,
                )
                for event in gate_result.events:
                    yield event
                if not gate_result.should_continue:
                    break
                continue

            # Yield iteration progress
            yield IterationEvent(
                current=iteration,
                max_iterations=self.budget.max_iterations,
                tokens_used=self.total_tokens,
            )

            # Budget check
            if self.total_tokens > self.budget.max_total_tokens:
                logger.warning(
                    "Agent loop token budget exceeded: %d > %d",
                    self.total_tokens, self.budget.max_total_tokens,
                )
                break

        # Yield the final clean text for the user (only the last iteration text)
        if last_text:
            yield FinalTextEvent(content=last_text)

        logger.info(
            "Agent loop finished: %d iterations, %d tokens (%d in + %d out)",
            iteration,
            self.total_tokens,
            self.total_input_tokens,
            self.total_output_tokens,
        )

    def _run_validation_gate(
        self,
        messages: list[dict[str, Any]],
        response: Any | None,
        iteration: int,
    ) -> "_ValidationGateResult":
        """Run mandatory validation after Claude signals completion.

        Returns a result object with events to yield and whether to continue.
        """
        events: list[AgentEvent] = []

        if self._validation_retries >= self._max_validation_retries:
            logger.warning(
                "Validation retry budget exhausted (%d retries), accepting result",
                self._validation_retries,
            )
            return _ValidationGateResult(should_continue=False, events=events)

        # Run validation
        validation_result = self.workspace.validate_project()

        events.append(ToolCallEvent(
            tool_name="validate_project",
            tool_input={},
            iteration=iteration,
        ))
        events.append(ToolResultEvent(
            tool_name="validate_project",
            success="PASSED" in validation_result,
            summary=validation_result[:200],
            iteration=iteration,
        ))

        if "PASSED" in validation_result:
            logger.info(
                "Validation gate PASSED at iteration %d (tokens: %d)",
                iteration, self.total_tokens,
            )
            return _ValidationGateResult(should_continue=False, events=events)

        # Validation FAILED — inject errors and ask Claude to fix
        self._validation_retries += 1
        logger.warning(
            "Validation gate FAILED at iteration %d (retry %d/%d): %s",
            iteration, self._validation_retries, self._max_validation_retries,
            validation_result[:200],
        )

        # Build the message to inject
        fix_prompt = (
            "MANDATORY VALIDATION FAILED. You MUST fix these errors before finishing.\n\n"
            f"{validation_result}\n\n"
            "Fix ALL errors listed above using update_file, then call validate_project again."
        )

        # Append assistant's last response + our validation feedback
        if response is not None:
            messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": fix_prompt})

        return _ValidationGateResult(should_continue=True, events=events)


class _ValidationGateResult:
    """Result from validation gate check."""
    __slots__ = ("should_continue", "events")

    def __init__(self, should_continue: bool, events: list[AgentEvent]) -> None:
        self.should_continue = should_continue
        self.events = events
