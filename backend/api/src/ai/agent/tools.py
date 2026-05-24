"""Tool definitions, ProjectWorkspace, and ToolExecutor for agent loop."""

import logging
import re
from typing import Any

from api.src.ai.core.validators import OutputValidator

logger = logging.getLogger(__name__)

# Anthropic tool definitions passed to the API
TOOLS: list[dict[str, Any]] = [
    {
        "name": "create_file",
        "description": (
            "Create a new file in the project. Use this for every file you generate. "
            "The path should match the project structure (e.g. src/App.tsx, src/pages/Home.tsx)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "File path relative to project root (e.g. src/App.tsx)",
                },
                "content": {
                    "type": "string",
                    "description": "Complete file content",
                },
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "update_file",
        "description": (
            "Update an existing file in the project. Returns error if file doesn't exist. "
            "Always provide the COMPLETE updated file content."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "File path to update",
                },
                "content": {
                    "type": "string",
                    "description": "Complete new file content (replaces old content entirely)",
                },
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "read_file",
        "description": "Read the content of an existing file in the project.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "File path to read",
                },
            },
            "required": ["path"],
        },
    },
    {
        "name": "validate_project",
        "description": (
            "Run validation on all project files. Checks for syntax errors, "
            "missing dependencies, placeholder content, and structural issues. "
            "Call this after creating/updating files to catch problems early."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "list_files",
        "description": "List all files currently in the project with their sizes.",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
]


class ProjectWorkspace:
    """In-memory file system for a generation session.

    Tracks all files, their content, and which were created/updated.
    Persisted to DB only after the agent loop finishes.
    """

    def __init__(self, initial_files: dict[str, str] | None = None) -> None:
        self.files: dict[str, str] = dict(initial_files) if initial_files else {}
        self.created: set[str] = set()
        self.updated: set[str] = set()

    def create_file(self, path: str, content: str) -> str:
        if path in self.files:
            return f"File '{path}' already exists. Use update_file to modify it."
        self.files[path] = content
        self.created.add(path)
        return f"Created '{path}' ({len(content)} chars)"

    def update_file(self, path: str, content: str) -> str:
        if path not in self.files:
            # Auto-create if file doesn't exist (common in first-generation)
            self.files[path] = content
            self.created.add(path)
            return f"File '{path}' not found, created instead ({len(content)} chars)"
        self.files[path] = content
        self.updated.add(path)
        return f"Updated '{path}' ({len(content)} chars)"

    def read_file(self, path: str) -> str:
        if path not in self.files:
            return f"File '{path}' not found. Available files: {', '.join(sorted(self.files))}"
        return self.files[path]

    def list_files(self) -> str:
        if not self.files:
            return "No files in workspace."
        lines = []
        for path in sorted(self.files):
            size = len(self.files[path])
            status = ""
            if path in self.created:
                status = " [new]"
            elif path in self.updated:
                status = " [modified]"
            lines.append(f"  {path} ({size} chars){status}")
        return f"Project files ({len(self.files)}):\n" + "\n".join(lines)

    def validate_project(self) -> str:
        if not self.files:
            return "No files to validate."
        validator = OutputValidator()
        files_fixed, result = validator.validate_and_fix(self.files)
        # Apply auto-fixes
        self.files = files_fixed

        parts = []
        if result.passed:
            parts.append("Validation PASSED.")
        else:
            parts.append(f"Validation FAILED ({len(result.errors)} errors).")

        if result.auto_fixed_count > 0:
            parts.append(f"Auto-fixed {result.auto_fixed_count} issues.")

        if result.errors:
            parts.append("\nErrors:")
            for err in result.errors:
                line_info = f" line {err.line}" if err.line else ""
                parts.append(f"  - [{err.file_path}{line_info}] {err.message}")

        if result.warnings:
            parts.append(f"\nWarnings ({len(result.warnings)}):")
            for warn in result.warnings[:5]:
                parts.append(f"  - [{warn.file_path}] {warn.message}")
            if len(result.warnings) > 5:
                parts.append(f"  ... and {len(result.warnings) - 5} more")

        return "\n".join(parts)

    def to_artifacts(self) -> list[dict[str, Any]]:
        """Convert workspace files to artifact dicts for DB saving."""
        artifacts = []
        for path, content in self.files.items():
            ext = path.rsplit(".", 1)[-1].lower() if "." in path else "text"
            artifact_type = _ext_to_type(ext)
            language = _ext_to_language(ext)
            artifacts.append({
                "type": artifact_type,
                "title": path,
                "content": _strip_filename_comment(content),
                "language": language,
            })
        return artifacts


_FILENAME_COMMENT_RE = re.compile(
    r"^(?://|#|<!--)\s*(?:filename|title)\s*:\s*.+?(?:-->)?\s*\n",
    re.IGNORECASE,
)


def _strip_filename_comment(content: str) -> str:
    """Strip leading `# filename: ...` / `// filename: ...` comment from content.

    AI sometimes prepends this metadata line even when using tool calls
    where the path is already a separate field.  It causes Vite/Babel parse
    errors in the WebContainer preview.
    """
    return _FILENAME_COMMENT_RE.sub("", content)


def _ext_to_type(ext: str) -> str:
    return {
        "ts": "typescript", "tsx": "react", "js": "javascript",
        "jsx": "react", "css": "css", "html": "html",
        "json": "json", "toml": "toml", "md": "markdown",
        "py": "python", "yaml": "yaml", "yml": "yaml",
        "ini": "ini", "cfg": "ini", "txt": "text",
    }.get(ext, "text")


def _ext_to_language(ext: str) -> str:
    return {
        "ts": "typescript", "tsx": "tsx", "js": "javascript",
        "jsx": "jsx", "css": "css", "html": "html",
        "json": "json", "toml": "toml", "md": "markdown",
        "py": "python", "yaml": "yaml", "yml": "yaml",
        "ini": "ini", "cfg": "ini", "txt": "text",
    }.get(ext, "text")


class ToolExecutor:
    """Execute tool calls against a ProjectWorkspace."""

    def __init__(self, workspace: ProjectWorkspace) -> None:
        self.workspace = workspace

    def execute(self, tool_name: str, tool_input: dict[str, Any]) -> tuple[str, bool]:
        """Execute a tool and return (result_text, success)."""
        try:
            if tool_name == "create_file":
                result = self.workspace.create_file(
                    tool_input["path"], tool_input["content"],
                )
                success = "already exists" not in result
            elif tool_name == "update_file":
                result = self.workspace.update_file(
                    tool_input["path"], tool_input["content"],
                )
                success = True
            elif tool_name == "read_file":
                result = self.workspace.read_file(tool_input["path"])
                success = "not found" not in result
            elif tool_name == "validate_project":
                result = self.workspace.validate_project()
                success = "PASSED" in result
            elif tool_name == "list_files":
                result = self.workspace.list_files()
                success = True
            else:
                result = f"Unknown tool: {tool_name}"
                success = False

            logger.info(
                "Tool executed: %s -> %s",
                tool_name,
                result[:100],
            )
            return result, success

        except Exception as e:
            logger.error("Tool execution error: %s %s", tool_name, e)
            return f"Error executing {tool_name}: {e}", False
