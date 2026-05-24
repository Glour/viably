"""Typed events yielded by the agent loop."""

from dataclasses import dataclass
from typing import Any, Union


@dataclass
class TextEvent:
    """Streaming text content from Claude."""

    content: str


@dataclass
class ToolCallEvent:
    """Claude requested a tool call."""

    tool_name: str
    tool_input: dict[str, Any]
    iteration: int


@dataclass
class ToolResultEvent:
    """Result of a tool execution."""

    tool_name: str
    success: bool
    summary: str
    iteration: int


@dataclass
class IterationEvent:
    """Agent loop iteration progress."""

    current: int
    max_iterations: int
    tokens_used: int


@dataclass
class FinalTextEvent:
    """Final user-facing text from the agent loop (shown in chat)."""

    content: str


AgentEvent = Union[TextEvent, ToolCallEvent, ToolResultEvent, IterationEvent, FinalTextEvent]
