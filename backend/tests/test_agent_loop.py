"""Tests for the Agent Loop system (tools, workspace, executor, loop, events, budget)."""

import uuid
from dataclasses import dataclass
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from api.src.ai.agent.budget import AgentBudget
from api.src.ai.agent.events import (
    IterationEvent,
    TextEvent,
    ToolCallEvent,
    ToolResultEvent,
)
from api.src.ai.agent.tools import (
    TOOLS,
    ProjectWorkspace,
    ToolExecutor,
    _ext_to_language,
    _ext_to_type,
)


# ============================================================================
# ProjectWorkspace Tests
# ============================================================================


class TestProjectWorkspace:
    """Tests for ProjectWorkspace in-memory file system."""

    def test_create_file_success(self):
        ws = ProjectWorkspace()
        result = ws.create_file("src/App.tsx", "export default () => <div/>;")

        assert "Created" in result
        assert "src/App.tsx" in ws.files
        assert "src/App.tsx" in ws.created

    def test_create_file_already_exists(self):
        ws = ProjectWorkspace({"src/App.tsx": "old content"})
        result = ws.create_file("src/App.tsx", "new content")

        assert "already exists" in result
        assert ws.files["src/App.tsx"] == "old content"  # not overwritten

    def test_update_file_success(self):
        ws = ProjectWorkspace({"src/App.tsx": "old"})
        result = ws.update_file("src/App.tsx", "new")

        assert "Updated" in result
        assert ws.files["src/App.tsx"] == "new"
        assert "src/App.tsx" in ws.updated

    def test_update_file_not_found_creates(self):
        ws = ProjectWorkspace()
        result = ws.update_file("src/New.tsx", "content")

        assert "not found, created instead" in result
        assert ws.files["src/New.tsx"] == "content"
        assert "src/New.tsx" in ws.created

    def test_read_file_success(self):
        ws = ProjectWorkspace({"main.py": "print('hello')"})
        result = ws.read_file("main.py")

        assert result == "print('hello')"

    def test_read_file_not_found(self):
        ws = ProjectWorkspace({"main.py": "code"})
        result = ws.read_file("missing.py")

        assert "not found" in result
        assert "main.py" in result  # lists available files

    def test_list_files_empty(self):
        ws = ProjectWorkspace()
        result = ws.list_files()

        assert "No files" in result

    def test_list_files_with_content(self):
        ws = ProjectWorkspace({"a.py": "x", "b.tsx": "yy"})
        ws.create_file("c.css", "body{}")
        ws.update_file("a.py", "xx")

        result = ws.list_files()
        assert "3" in result  # 3 files
        assert "[new]" in result  # c.css
        assert "[modified]" in result  # a.py

    def test_validate_project_passes(self):
        ws = ProjectWorkspace({"main.py": "print('hello')"})
        result = ws.validate_project()

        assert "PASSED" in result

    def test_validate_project_syntax_error(self):
        ws = ProjectWorkspace({"main.py": "def ("})
        result = ws.validate_project()

        assert "FAILED" in result
        assert "Syntax error" in result

    def test_validate_project_empty(self):
        ws = ProjectWorkspace()
        result = ws.validate_project()

        assert "No files" in result

    def test_to_artifacts(self):
        ws = ProjectWorkspace({
            "src/App.tsx": "export default () => <div/>;",
            "main.py": "print('hi')",
            "style.css": "body {}",
        })

        artifacts = ws.to_artifacts()

        assert len(artifacts) == 3
        titles = {a["title"] for a in artifacts}
        assert "src/App.tsx" in titles
        assert "main.py" in titles
        assert "style.css" in titles

        # Check type mappings
        for a in artifacts:
            if a["title"] == "src/App.tsx":
                assert a["type"] == "react"
                assert a["language"] == "tsx"
            elif a["title"] == "main.py":
                assert a["type"] == "python"
                assert a["language"] == "python"
            elif a["title"] == "style.css":
                assert a["type"] == "css"
                assert a["language"] == "css"

    def test_initial_files(self):
        initial = {"existing.py": "# existing"}
        ws = ProjectWorkspace(initial)

        assert "existing.py" in ws.files
        assert ws.files["existing.py"] == "# existing"
        assert "existing.py" not in ws.created
        assert "existing.py" not in ws.updated


# ============================================================================
# ToolExecutor Tests
# ============================================================================


class TestToolExecutor:
    """Tests for ToolExecutor dispatch."""

    def test_execute_create_file(self):
        ws = ProjectWorkspace()
        executor = ToolExecutor(ws)

        result, success = executor.execute(
            "create_file",
            {"path": "test.py", "content": "print(1)"},
        )
        assert success
        assert "Created" in result
        assert "test.py" in ws.files

    def test_execute_update_file(self):
        ws = ProjectWorkspace({"test.py": "old"})
        executor = ToolExecutor(ws)

        result, success = executor.execute(
            "update_file",
            {"path": "test.py", "content": "new"},
        )
        assert success
        assert ws.files["test.py"] == "new"

    def test_execute_read_file(self):
        ws = ProjectWorkspace({"test.py": "content"})
        executor = ToolExecutor(ws)

        result, success = executor.execute(
            "read_file", {"path": "test.py"},
        )
        assert success
        assert result == "content"

    def test_execute_read_file_not_found(self):
        ws = ProjectWorkspace()
        executor = ToolExecutor(ws)

        result, success = executor.execute(
            "read_file", {"path": "missing.py"},
        )
        assert not success
        assert "not found" in result

    def test_execute_validate_project(self):
        ws = ProjectWorkspace({"test.py": "x = 1"})
        executor = ToolExecutor(ws)

        result, success = executor.execute("validate_project", {})
        assert success
        assert "PASSED" in result

    def test_execute_list_files(self):
        ws = ProjectWorkspace({"a.py": "x"})
        executor = ToolExecutor(ws)

        result, success = executor.execute("list_files", {})
        assert success
        assert "a.py" in result

    def test_execute_unknown_tool(self):
        ws = ProjectWorkspace()
        executor = ToolExecutor(ws)

        result, success = executor.execute("destroy_world", {})
        assert not success
        assert "Unknown tool" in result

    def test_execute_handles_exception(self):
        ws = ProjectWorkspace()
        executor = ToolExecutor(ws)

        # Force an exception by passing wrong input type
        with patch.object(ws, 'create_file', side_effect=TypeError("bad input")):
            result, success = executor.execute(
                "create_file", {"path": "x", "content": "y"},
            )
        assert not success
        assert "Error" in result


# ============================================================================
# Tool Definitions Tests
# ============================================================================


class TestToolDefinitions:
    """Tests for TOOLS list format (Anthropic API compatibility)."""

    def test_all_tools_have_required_fields(self):
        for tool in TOOLS:
            assert "name" in tool, f"Tool missing name: {tool}"
            assert "description" in tool, f"Tool {tool['name']} missing description"
            assert "input_schema" in tool, f"Tool {tool['name']} missing input_schema"
            assert tool["input_schema"]["type"] == "object"

    def test_tool_names(self):
        names = {t["name"] for t in TOOLS}
        expected = {"create_file", "update_file", "read_file", "validate_project", "list_files"}
        assert names == expected

    def test_create_file_schema(self):
        tool = next(t for t in TOOLS if t["name"] == "create_file")
        props = tool["input_schema"]["properties"]
        assert "path" in props
        assert "content" in props
        assert tool["input_schema"]["required"] == ["path", "content"]

    def test_read_file_schema(self):
        tool = next(t for t in TOOLS if t["name"] == "read_file")
        props = tool["input_schema"]["properties"]
        assert "path" in props
        assert tool["input_schema"]["required"] == ["path"]

    def test_validate_project_no_required_params(self):
        tool = next(t for t in TOOLS if t["name"] == "validate_project")
        assert "required" not in tool["input_schema"]


# ============================================================================
# Extension Mapping Tests
# ============================================================================


class TestExtensionMappings:
    """Tests for _ext_to_type and _ext_to_language helpers."""

    def test_ext_to_type(self):
        assert _ext_to_type("tsx") == "react"
        assert _ext_to_type("jsx") == "react"
        assert _ext_to_type("ts") == "typescript"
        assert _ext_to_type("py") == "python"
        assert _ext_to_type("css") == "css"
        assert _ext_to_type("html") == "html"
        assert _ext_to_type("json") == "json"
        assert _ext_to_type("unknown") == "text"

    def test_ext_to_language(self):
        assert _ext_to_language("tsx") == "tsx"
        assert _ext_to_language("jsx") == "jsx"
        assert _ext_to_language("ts") == "typescript"
        assert _ext_to_language("py") == "python"
        assert _ext_to_language("unknown") == "text"


# ============================================================================
# AgentBudget Tests
# ============================================================================


class TestAgentBudget:
    """Tests for AgentBudget dataclass."""

    def test_default_values(self):
        budget = AgentBudget()
        assert budget.max_iterations == 10
        assert budget.max_total_tokens == 200_000
        assert budget.timeout_seconds == 300

    def test_custom_values(self):
        budget = AgentBudget(max_iterations=5, max_total_tokens=100_000, timeout_seconds=120)
        assert budget.max_iterations == 5
        assert budget.max_total_tokens == 100_000
        assert budget.timeout_seconds == 120

    def test_from_settings(self):
        with patch("api.src.ai.agent.budget.settings") as mock_settings:
            mock_settings.AGENT_MAX_ITERATIONS = 7
            mock_settings.AGENT_MAX_TOKENS = 150_000
            mock_settings.AGENT_TIMEOUT_SECONDS = 180

            budget = AgentBudget.from_settings()

            assert budget.max_iterations == 7
            assert budget.max_total_tokens == 150_000
            assert budget.timeout_seconds == 180


# ============================================================================
# Events Tests
# ============================================================================


class TestEvents:
    """Tests for agent event dataclasses."""

    def test_text_event(self):
        event = TextEvent(content="Hello")
        assert event.content == "Hello"

    def test_tool_call_event(self):
        event = ToolCallEvent(
            tool_name="create_file",
            tool_input={"path": "a.py", "content": "x"},
            iteration=1,
        )
        assert event.tool_name == "create_file"
        assert event.iteration == 1

    def test_tool_result_event(self):
        event = ToolResultEvent(
            tool_name="create_file",
            success=True,
            summary="Created 'a.py' (1 chars)",
            iteration=1,
        )
        assert event.success
        assert "a.py" in event.summary

    def test_iteration_event(self):
        event = IterationEvent(current=3, max_iterations=10, tokens_used=5000)
        assert event.current == 3
        assert event.max_iterations == 10


# ============================================================================
# AgentLoop Tests
# ============================================================================


@dataclass
class MockContentBlock:
    type: str
    text: str = ""
    name: str = ""
    input: dict = None
    id: str = ""

    def __post_init__(self):
        if self.input is None:
            self.input = {}
        if not self.id:
            self.id = f"tool_{uuid.uuid4().hex[:8]}"


@dataclass
class MockUsage:
    input_tokens: int = 100
    output_tokens: int = 200


@dataclass
class MockResponse:
    content: list = None
    stop_reason: str = "end_turn"
    usage: MockUsage = None

    def __post_init__(self):
        if self.content is None:
            self.content = []
        if self.usage is None:
            self.usage = MockUsage()


class TestAgentLoop:
    """Tests for the main AgentLoop."""

    async def test_simple_text_response(self):
        """Agent returns text with end_turn on first call."""
        from api.src.ai.agent.loop import AgentLoop

        mock_client = AsyncMock()
        mock_client.messages.create = AsyncMock(return_value=MockResponse(
            content=[MockContentBlock(type="text", text="Done!")],
            stop_reason="end_turn",
        ))

        workspace = ProjectWorkspace()
        budget = AgentBudget(max_iterations=5)

        agent = AgentLoop(
            client=mock_client,
            model="claude-sonnet-4-6",
            system="You are a helper",
            tools=TOOLS,
            budget=budget,
            workspace=workspace,
        )

        events = []
        async for event in agent.run([{"role": "user", "content": "Hello"}]):
            events.append(event)

        assert len(events) == 1
        assert isinstance(events[0], TextEvent)
        assert events[0].content == "Done!"
        assert agent.total_input_tokens == 100
        assert agent.total_output_tokens == 200

    async def test_tool_use_then_end(self):
        """Agent calls create_file, then ends."""
        from api.src.ai.agent.loop import AgentLoop

        call_count = 0

        async def mock_create(*, model, max_tokens, system, messages, tools):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return MockResponse(
                    content=[
                        MockContentBlock(
                            type="tool_use",
                            name="create_file",
                            input={"path": "main.py", "content": "print('hi')"},
                            id="tool_1",
                        ),
                    ],
                    stop_reason="tool_use",
                    usage=MockUsage(input_tokens=50, output_tokens=100),
                )
            else:
                return MockResponse(
                    content=[MockContentBlock(type="text", text="Created main.py!")],
                    stop_reason="end_turn",
                    usage=MockUsage(input_tokens=80, output_tokens=50),
                )

        mock_client = AsyncMock()
        mock_client.messages.create = mock_create

        workspace = ProjectWorkspace()
        budget = AgentBudget(max_iterations=5)

        agent = AgentLoop(
            client=mock_client,
            model="claude-sonnet-4-6",
            system="You are a helper",
            tools=TOOLS,
            budget=budget,
            workspace=workspace,
        )

        events = []
        async for event in agent.run([{"role": "user", "content": "Create main.py"}]):
            events.append(event)

        # Events: ToolCallEvent, ToolResultEvent, IterationEvent, TextEvent
        tool_calls = [e for e in events if isinstance(e, ToolCallEvent)]
        tool_results = [e for e in events if isinstance(e, ToolResultEvent)]
        text_events = [e for e in events if isinstance(e, TextEvent)]

        assert len(tool_calls) == 1
        assert tool_calls[0].tool_name == "create_file"
        assert len(tool_results) == 1
        assert tool_results[0].success
        assert len(text_events) == 1
        assert text_events[0].content == "Created main.py!"

        # File should be in workspace
        assert "main.py" in workspace.files
        assert workspace.files["main.py"] == "print('hi')"

        # Token accounting
        assert agent.total_input_tokens == 130  # 50 + 80
        assert agent.total_output_tokens == 150  # 100 + 50

    async def test_budget_max_iterations(self):
        """Agent stops when max iterations exceeded."""
        from api.src.ai.agent.loop import AgentLoop

        async def always_tool_use(*, model, max_tokens, system, messages, tools):
            return MockResponse(
                content=[
                    MockContentBlock(
                        type="tool_use",
                        name="list_files",
                        input={},
                    ),
                ],
                stop_reason="tool_use",
            )

        mock_client = AsyncMock()
        mock_client.messages.create = always_tool_use

        workspace = ProjectWorkspace()
        budget = AgentBudget(max_iterations=3)

        agent = AgentLoop(
            client=mock_client,
            model="test",
            system="test",
            tools=TOOLS,
            budget=budget,
            workspace=workspace,
        )

        events = []
        async for event in agent.run([{"role": "user", "content": "go"}]):
            events.append(event)

        iterations = [e for e in events if isinstance(e, IterationEvent)]
        # IterationEvent is yielded after tool execution, before the next
        # iteration starts. All 3 iterations run (yielding events 1, 2, 3),
        # then the while condition `iteration < max_iterations` stops the loop.
        assert len(iterations) == 3
        assert iterations[-1].current == 3

    async def test_budget_token_limit(self):
        """Agent stops when token budget exceeded."""
        from api.src.ai.agent.loop import AgentLoop

        async def tool_use_with_high_tokens(
            *, model, max_tokens, system, messages, tools
        ):
            return MockResponse(
                content=[
                    MockContentBlock(
                        type="tool_use",
                        name="list_files",
                        input={},
                    ),
                ],
                stop_reason="tool_use",
                usage=MockUsage(input_tokens=60_000, output_tokens=60_000),
            )

        mock_client = AsyncMock()
        mock_client.messages.create = tool_use_with_high_tokens

        workspace = ProjectWorkspace()
        budget = AgentBudget(max_iterations=10, max_total_tokens=100_000)

        agent = AgentLoop(
            client=mock_client,
            model="test",
            system="test",
            tools=TOOLS,
            budget=budget,
            workspace=workspace,
        )

        events = []
        async for event in agent.run([{"role": "user", "content": "go"}]):
            events.append(event)

        # Should stop after 1 iteration (120k > 100k budget)
        assert agent.total_tokens == 120_000
        iterations = [e for e in events if isinstance(e, IterationEvent)]
        # IterationEvent is yielded after tool execution, then budget check
        # breaks the loop before iteration 2
        assert len(iterations) == 1
        assert iterations[0].current == 1

    async def test_timeout(self):
        """Agent stops when timeout exceeded."""
        from api.src.ai.agent.loop import AgentLoop

        mock_client = AsyncMock()
        mock_client.messages.create = AsyncMock(return_value=MockResponse(
            content=[MockContentBlock(type="text", text="hi")],
            stop_reason="end_turn",
        ))

        workspace = ProjectWorkspace()
        budget = AgentBudget(timeout_seconds=0)

        agent = AgentLoop(
            client=mock_client,
            model="test",
            system="test",
            tools=TOOLS,
            budget=budget,
            workspace=workspace,
        )

        events = []
        async for event in agent.run([{"role": "user", "content": "go"}]):
            events.append(event)

        # Should not execute any iterations (timeout = 0)
        assert len(events) == 0
        mock_client.messages.create.assert_not_called()

    async def test_api_error_propagates(self):
        """API errors should propagate up."""
        from api.src.ai.agent.loop import AgentLoop

        mock_client = AsyncMock()
        mock_client.messages.create = AsyncMock(
            side_effect=Exception("API down"),
        )

        workspace = ProjectWorkspace()
        budget = AgentBudget(max_iterations=3)

        agent = AgentLoop(
            client=mock_client,
            model="test",
            system="test",
            tools=TOOLS,
            budget=budget,
            workspace=workspace,
        )

        with pytest.raises(Exception, match="API down"):
            async for _ in agent.run([{"role": "user", "content": "go"}]):
                pass

    async def test_end_turn_with_tool_calls(self):
        """end_turn + tool calls: execute tools then stop."""
        from api.src.ai.agent.loop import AgentLoop

        mock_client = AsyncMock()
        mock_client.messages.create = AsyncMock(return_value=MockResponse(
            content=[
                MockContentBlock(type="text", text="Creating file..."),
                MockContentBlock(
                    type="tool_use",
                    name="create_file",
                    input={"path": "app.py", "content": "code"},
                    id="tool_1",
                ),
            ],
            stop_reason="end_turn",
        ))

        workspace = ProjectWorkspace()
        budget = AgentBudget(max_iterations=5)

        agent = AgentLoop(
            client=mock_client,
            model="test",
            system="test",
            tools=TOOLS,
            budget=budget,
            workspace=workspace,
        )

        events = []
        async for event in agent.run([{"role": "user", "content": "go"}]):
            events.append(event)

        # Should have text + tool_call + tool_result (no more iterations)
        text_events = [e for e in events if isinstance(e, TextEvent)]
        tool_calls = [e for e in events if isinstance(e, ToolCallEvent)]
        tool_results = [e for e in events if isinstance(e, ToolResultEvent)]

        assert len(text_events) == 1
        assert len(tool_calls) == 1
        assert len(tool_results) == 1
        assert "app.py" in workspace.files

        # Only 1 API call should be made
        mock_client.messages.create.assert_called_once()

    async def test_multiple_tool_calls_in_single_response(self):
        """Claude can return multiple tool calls in one response."""
        from api.src.ai.agent.loop import AgentLoop

        call_count = 0

        async def mock_create(*, model, max_tokens, system, messages, tools):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return MockResponse(
                    content=[
                        MockContentBlock(
                            type="tool_use",
                            name="create_file",
                            input={"path": "a.py", "content": "x=1"},
                            id="tool_a",
                        ),
                        MockContentBlock(
                            type="tool_use",
                            name="create_file",
                            input={"path": "b.py", "content": "y=2"},
                            id="tool_b",
                        ),
                    ],
                    stop_reason="tool_use",
                )
            else:
                return MockResponse(
                    content=[MockContentBlock(type="text", text="Done")],
                    stop_reason="end_turn",
                )

        mock_client = AsyncMock()
        mock_client.messages.create = mock_create

        workspace = ProjectWorkspace()
        budget = AgentBudget(max_iterations=5)

        agent = AgentLoop(
            client=mock_client,
            model="test",
            system="test",
            tools=TOOLS,
            budget=budget,
            workspace=workspace,
        )

        events = []
        async for event in agent.run([{"role": "user", "content": "go"}]):
            events.append(event)

        tool_calls = [e for e in events if isinstance(e, ToolCallEvent)]
        tool_results = [e for e in events if isinstance(e, ToolResultEvent)]

        assert len(tool_calls) == 2
        assert len(tool_results) == 2
        assert "a.py" in workspace.files
        assert "b.py" in workspace.files


# ============================================================================
# Integration: Workspace → Validator flow
# ============================================================================


class TestWorkspaceValidatorIntegration:
    """Test that validate_project works correctly end-to-end."""

    def test_validate_detects_python_syntax_error(self):
        ws = ProjectWorkspace()
        ws.create_file("main.py", "def (broken")
        result = ws.validate_project()

        assert "FAILED" in result
        assert "PYTHON_SYNTAX_ERROR" in result or "Syntax error" in result

    def test_validate_passes_for_valid_project(self):
        ws = ProjectWorkspace()
        ws.create_file("main.py", "print('hello')")
        ws.create_file("utils.py", "def add(a, b):\n    return a + b\n")

        result = ws.validate_project()
        assert "PASSED" in result

    def test_validate_detects_placeholder(self):
        ws = ProjectWorkspace()
        ws.create_file("index.html", "<h1>{{title}}</h1>")

        result = ws.validate_project()
        # Placeholders are warnings, not errors
        assert "PASSED" in result or "Warnings" in result.lower() or "PLACEHOLDER" in result

    def test_validate_and_autofix_html(self):
        ws = ProjectWorkspace()
        ws.create_file("index.html", "<html><head></head><body></body></html>")

        result = ws.validate_project()
        # Auto-fix should add DOCTYPE
        content = ws.files["index.html"]
        assert "<!DOCTYPE html>" in content

    def test_full_workflow_create_validate_fix(self):
        """Simulate agent workflow: create files, validate, fix."""
        ws = ProjectWorkspace()
        executor = ToolExecutor(ws)

        # Create a file with syntax error
        executor.execute("create_file", {
            "path": "main.py",
            "content": "def hello(\n    print('hi')",
        })

        # Validate
        result, success = executor.execute("validate_project", {})
        assert not success
        assert "Syntax error" in result

        # Fix the file
        executor.execute("update_file", {
            "path": "main.py",
            "content": "def hello():\n    print('hi')\n",
        })

        # Validate again
        result, success = executor.execute("validate_project", {})
        assert success
        assert "PASSED" in result
