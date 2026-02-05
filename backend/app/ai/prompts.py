"""Prompt building and code extraction utilities for AI generation."""

import json
import re
from typing import Any

SYSTEM_PROMPT = """You are a senior Python developer specializing in Telegram bots using aiogram 3.x.

Your task: Generate PRODUCTION-READY code.

Requirements:
- Clean, readable code with type hints
- Proper error handling
- Environment variables for config
- SQLite/PostgreSQL for data
- Comprehensive docstrings
- Best practices only

Output format: Complete file structure with all code.
Each file should be wrapped in markdown code blocks with the filename as a comment:
```python
# filename: main.py
<code here>
```
"""


def build_generation_prompt(
    template_prompt: str,
    user_config: dict[str, Any],
) -> str:
    """Build generation prompt by replacing template variables.

    Template variables use {{variable_name}} syntax.

    Args:
        template_prompt: Template with {{placeholders}}.
        user_config: Dict of values to substitute.

    Returns:
        Prompt with variables replaced.

    Examples:
        >>> build_generation_prompt("Create bot for {{topic}}", {"topic": "weather"})
        'Create bot for weather'
        >>> build_generation_prompt("Features: {{features}}", {"features": ["a", "b"]})
        'Features: [\\n  "a",\\n  "b"\\n]'
    """
    prompt = template_prompt

    for key, value in user_config.items():
        placeholder = f"{{{{{key}}}}}"

        # Convert complex types to JSON for readability
        if isinstance(value, (list, dict)):
            value_str = json.dumps(value, ensure_ascii=False, indent=2)
        else:
            value_str = str(value)

        prompt = prompt.replace(placeholder, value_str)

    return prompt


def extract_code_files(response: str) -> dict[str, str]:
    """Extract code files from AI response.

    Expected format:
    ```python
    # filename: path/to/file.py
    <code>
    ```

    Supports multiple file extensions: python, dockerfile, yaml, json, txt, toml, env.

    Args:
        response: AI response text containing code blocks.

    Returns:
        Dict mapping filename to code content.

    Examples:
        >>> response = '''```python
        ... # filename: main.py
        ... print("hello")
        ... ```'''
        >>> extract_code_files(response)
        {'main.py': 'print("hello")'}
    """
    files: dict[str, str] = {}

    # Pattern to match code blocks with filename comment
    # Supports: python, dockerfile, yaml, json, txt, toml, env, sh, bash, requirements
    pattern = (
        r"```(?:python|dockerfile|yaml|json|txt|toml|env|sh|bash|requirements)?\s*\n"
        r"#\s*filename:\s*(.+?)\n"
        r"(.*?)"
        r"```"
    )
    matches = re.findall(pattern, response, re.DOTALL | re.IGNORECASE)

    for filename, code in matches:
        filename = filename.strip()
        code = code.strip()
        files[filename] = code

    return files


def count_code_files(files: dict[str, str]) -> dict[str, int]:
    """Count files by extension for logging/metrics.

    Args:
        files: Dict mapping filename to code content.

    Returns:
        Dict mapping extension to count.
    """
    counts: dict[str, int] = {}

    for filename in files:
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "unknown"
        counts[ext] = counts.get(ext, 0) + 1

    return counts
