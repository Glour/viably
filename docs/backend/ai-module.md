# Backend Module: AI Generation

**Module:** `app/ai`
**Status:** Not Started
**Priority:** P0 (Must have for MVP)
**Estimated Time:** 5-6 days
**Dependencies:** Projects, Templates, Credits

---

## 📋 Overview

Core AI engine that generates code using Claude Sonnet 4, reviews for quality, tests in sandbox, and packages files.

**Responsibilities:**
- Build prompts from templates and user config
- Generate code via Anthropic API
- Review generated code for quality/security
- Test code in sandbox (optional)
- Package files and save to project
- Handle errors and refund credits

---

## 🔧 Dependencies

```python
# requirements.txt additions
anthropic>=0.20.0
celery>=5.3.0
redis>=5.0.0
```

---

## 🤖 Components

### 1. Anthropic Client

File: `app/ai/client.py`

```python
from anthropic import AsyncAnthropic
from typing import Optional
import os

from app.core.config import settings


class AnthropicClient:
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.default_model = "claude-sonnet-4-20250514"

    async def generate_code(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 8192
    ) -> str:
        """Generate code using Claude API."""
        response = await self.client.messages.create(
            model=model or self.default_model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return response.content[0].text

    async def review_code(
        self,
        code: str,
        context: str
    ) -> dict:
        """Review code for security and best practices."""
        review_prompt = f"""
Review the following code for:
1. Security vulnerabilities
2. Best practices violations
3. Potential bugs
4. Performance issues

Context: {context}

Code:
```python
{code}
```

Respond with JSON:
{{
    "passed": true/false,
    "issues": [
        {{"severity": "high/medium/low", "description": "...", "line": N}}
    ],
    "suggestions": ["..."]
}}
"""

        response = await self.generate_code(
            prompt=review_prompt,
            system_prompt="You are a senior code reviewer. Respond only with valid JSON.",
            max_tokens=2048
        )

        import json
        return json.loads(response)


# Singleton instance
anthropic_client = AnthropicClient()
```

---

### 2. Prompt Builder

File: `app/ai/prompts.py`

```python
from typing import Dict, Any
import re


SYSTEM_PROMPT = '''You are a senior Python developer specializing in Telegram bots using aiogram 3.x.

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
'''


def build_generation_prompt(
    template_prompt: str,
    user_config: Dict[str, Any]
) -> str:
    """
    Build generation prompt by replacing template variables with user config.

    Template variables use {{variable_name}} syntax.
    """
    prompt = template_prompt

    for key, value in user_config.items():
        placeholder = f"{{{{{key}}}}}"
        if isinstance(value, (list, dict)):
            import json
            value = json.dumps(value, ensure_ascii=False, indent=2)
        prompt = prompt.replace(placeholder, str(value))

    return prompt


def extract_code_files(response: str) -> Dict[str, str]:
    """
    Extract code files from AI response.

    Expected format:
    ```python
    # filename: path/to/file.py
    <code>
    ```
    """
    files = {}

    # Pattern to match code blocks with filename
    pattern = r'```(?:python|dockerfile|yaml|json|txt)?\s*\n#\s*filename:\s*(.+?)\n(.*?)```'
    matches = re.findall(pattern, response, re.DOTALL)

    for filename, code in matches:
        filename = filename.strip()
        code = code.strip()
        files[filename] = code

    return files
```

---

### 3. Generation Pipeline

File: `app/ai/service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime
import logging

from app.ai.client import anthropic_client
from app.ai.prompts import SYSTEM_PROMPT, build_generation_prompt, extract_code_files
from app.projects.models import Project
from app.projects.schemas import ProjectStatus
from app.templates.models import Template
from app.credits.service import CreditService

logger = logging.getLogger(__name__)


class AIGenerationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_project_code(self, project_id: UUID) -> dict:
        """
        Complete generation workflow.

        Steps:
        1. Validate project status (must be draft/generating)
        2. Load template + user config
        3. Build AI prompt
        4. Generate code (Claude Sonnet 4)
        5. Parse and extract files
        6. Review code
        7. Save to project.generated_code
        8. Update status → ready

        If error: Set status=error with message
        """
        # Get project
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project:
            raise ValueError(f"Project {project_id} not found")

        try:
            # Get template
            result = await self.db.execute(
                select(Template).where(Template.id == project.template_id)
            )
            template = result.scalar_one_or_none()

            if not template:
                raise ValueError(f"Template {project.template_id} not found")

            # Build prompt
            user_prompt = build_generation_prompt(
                template.prompt_template,
                project.config or {}
            )

            # Generate code
            logger.info(f"Generating code for project {project_id}")
            response = await anthropic_client.generate_code(
                prompt=user_prompt,
                system_prompt=SYSTEM_PROMPT
            )

            # Extract files
            files = extract_code_files(response)

            if not files:
                raise ValueError("No code files extracted from AI response")

            # Review code (optional, can skip for MVP)
            # review_result = await self._review_code(files)

            # Save to project
            project.generated_code = {"files": files}
            project.ai_model_used = anthropic_client.default_model
            project.status = ProjectStatus.READY
            project.generated_at = datetime.utcnow()
            project.generation_logs = f"Generated {len(files)} files"

            await self.db.commit()

            logger.info(f"Generation complete for project {project_id}: {len(files)} files")

            return {
                "success": True,
                "files_count": len(files),
                "files": list(files.keys())
            }

        except Exception as e:
            logger.error(f"Generation failed for project {project_id}: {e}")

            # Update project with error
            project.status = ProjectStatus.ERROR
            project.error_message = str(e)
            await self.db.commit()

            raise

    async def _review_code(self, files: dict) -> dict:
        """Review generated code for quality."""
        all_code = "\n\n".join(
            f"# {filename}\n{code}"
            for filename, code in files.items()
        )

        return await anthropic_client.review_code(
            code=all_code,
            context="Telegram bot generated from template"
        )
```

---

### 4. Async Worker

File: `app/ai/worker.py`

```python
from celery import Celery
from uuid import UUID
import asyncio
import logging

from app.core.config import settings
from app.core.database import async_session_maker
from app.ai.service import AIGenerationService
from app.credits.service import CreditService
from app.projects.models import Project
from app.projects.schemas import ProjectStatus

logger = logging.getLogger(__name__)

celery_app = Celery(
    "ai_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)


@celery_app.task(bind=True, max_retries=3)
def process_generation(self, project_id: str):
    """
    Celery task for code generation.

    Workflow:
    1. Update status to generating
    2. Check credits
    3. Deduct credits
    4. Generate code
    5. On success: Update status to ready
    6. On error: Refund credits, set status to error
    """
    asyncio.run(_process_generation_async(self, UUID(project_id)))


async def _process_generation_async(task, project_id: UUID):
    """Async implementation of generation task."""
    async with async_session_maker() as db:
        try:
            # Get project
            from sqlalchemy import select
            result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                logger.error(f"Project {project_id} not found")
                return

            # Check and deduct credits
            credit_service = CreditService(db)

            # Check if user has enough credits
            balance = await credit_service.get_balance(project.user_id)
            generation_cost = 10  # Cost per generation

            if balance.total_available < generation_cost:
                project.status = ProjectStatus.ERROR
                project.error_message = "Insufficient credits"
                await db.commit()
                return

            # Deduct credits
            await credit_service.deduct_credits(
                user_id=project.user_id,
                amount=generation_cost,
                description=f"Code generation for project: {project.name}",
                reference_type="generation",
                reference_id=project_id
            )

            # Generate code
            ai_service = AIGenerationService(db)
            result = await ai_service.generate_project_code(project_id)

            logger.info(f"Generation completed: {result}")

            # TODO: Send WebSocket notification
            # await notify_user(project.user_id, "generation_complete", {"project_id": str(project_id)})

        except Exception as e:
            logger.error(f"Generation failed: {e}")

            # Refund credits on error
            try:
                await credit_service.refund_credits(
                    user_id=project.user_id,
                    amount=generation_cost,
                    description=f"Refund for failed generation: {project.name}",
                    reference_type="generation_refund",
                    reference_id=project_id
                )
            except Exception as refund_error:
                logger.error(f"Failed to refund credits: {refund_error}")

            # Retry if retries available
            if task.request.retries < task.max_retries:
                raise task.retry(exc=e, countdown=60 * (task.request.retries + 1))
```

---

## 🌐 API Endpoints

File: `app/ai/routes.py`

Note: Generation is triggered via `/api/projects/{id}/generate` in projects module.
This module provides internal services only.

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_admin_user

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status")
async def get_ai_status(
    current_user = Depends(get_current_admin_user)
):
    """Get AI service status (admin only)."""
    from app.ai.client import anthropic_client

    # Simple health check
    return {
        "status": "operational",
        "model": anthropic_client.default_model
    }
```

---

## 🧪 Tests

File: `tests/test_ai.py`

```python
import pytest
from unittest.mock import AsyncMock, patch

from app.ai.prompts import build_generation_prompt, extract_code_files
from app.ai.service import AIGenerationService


class TestPromptBuilder:
    def test_build_prompt_replaces_variables(self):
        """Test that variables are replaced in prompt."""
        template = "Create a bot named {{bot_name}} for {{shop_name}}"
        config = {"bot_name": "ShopBot", "shop_name": "MyStore"}

        result = build_generation_prompt(template, config)

        assert "ShopBot" in result
        assert "MyStore" in result
        assert "{{" not in result

    def test_build_prompt_handles_lists(self):
        """Test that lists are JSON serialized."""
        template = "Products: {{products}}"
        config = {"products": ["Item1", "Item2"]}

        result = build_generation_prompt(template, config)

        assert '"Item1"' in result
        assert '"Item2"' in result


class TestCodeExtraction:
    def test_extract_code_files(self):
        """Test extracting code files from AI response."""
        response = '''
Here's your bot:

```python
# filename: main.py
import asyncio
print("Hello")
```

```python
# filename: handlers/start.py
async def start():
    pass
```
'''

        files = extract_code_files(response)

        assert "main.py" in files
        assert "handlers/start.py" in files
        assert "import asyncio" in files["main.py"]

    def test_extract_no_files(self):
        """Test with no valid code blocks."""
        response = "No code here"

        files = extract_code_files(response)

        assert files == {}


@pytest.mark.asyncio
async def test_generation_service_success(db_session, project, template):
    """Test successful code generation."""
    with patch("app.ai.client.anthropic_client.generate_code") as mock_generate:
        mock_generate.return_value = '''
```python
# filename: main.py
print("Hello")
```
'''

        service = AIGenerationService(db_session)
        result = await service.generate_project_code(project.id)

        assert result["success"] is True
        assert result["files_count"] == 1


@pytest.mark.asyncio
async def test_generation_service_error_handling(db_session, project):
    """Test error handling in generation."""
    with patch("app.ai.client.anthropic_client.generate_code") as mock_generate:
        mock_generate.side_effect = Exception("API Error")

        service = AIGenerationService(db_session)

        with pytest.raises(Exception):
            await service.generate_project_code(project.id)

        # Check project status updated to error
        await db_session.refresh(project)
        assert project.status == "error"
        assert "API Error" in project.error_message


@pytest.mark.asyncio
async def test_credit_refund_on_error(db_session, project, user_with_credits):
    """Test that credits are refunded on generation error."""
    # Implementation depends on credits module
    pass
```

---

## 📊 Success Criteria

- [ ] Claude API integration works
- [ ] Prompt building with variable replacement works
- [ ] Code generation returns valid files
- [ ] Code parsing extracts files correctly
- [ ] Code review functional (optional for MVP)
- [ ] Files packaged correctly in JSON structure
- [ ] Credits deducted before generation
- [ ] Credits refunded on error
- [ ] Error handling is robust
- [ ] Retry logic works (3 attempts)

---

## 💡 Implementation Tips

- Use async/await everywhere
- Implement retry logic (3 attempts with exponential backoff)
- Log all API calls for debugging
- Cache prompt templates
- Rate limit API calls (consider Anthropic limits)
- Store full AI response in generation_logs for debugging
- Consider streaming for long generations

---

## 🔒 Security Considerations

- Never expose API key in logs or responses
- Sanitize user config before inserting into prompts
- Review generated code for malicious patterns
- Limit max_tokens to prevent abuse
- Rate limit generation requests per user

---

**Last Updated:** February 5, 2026
