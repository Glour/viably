"""Tests for AI generation module."""

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.prompts import build_generation_prompt, extract_code_files
from app.auth.models import User
from app.projects.models import Project, ProjectStatus
from app.templates.models import Template


# =============================================================================
# T009: Test build_generation_prompt
# =============================================================================


class TestBuildGenerationPrompt:
    """Tests for build_generation_prompt function."""

    def test_replaces_simple_variables(self) -> None:
        """Test that simple string variables are replaced correctly."""
        template = "Create a bot named {{bot_name}} for {{purpose}}"
        config = {"bot_name": "ShopBot", "purpose": "e-commerce"}

        result = build_generation_prompt(template, config)

        assert result == "Create a bot named ShopBot for e-commerce"

    def test_handles_list_values(self) -> None:
        """Test that list values are JSON-serialized with proper formatting."""
        template = "Include these features: {{features}}"
        config = {"features": ["inline keyboard", "payment system", "admin panel"]}

        result = build_generation_prompt(template, config)

        # Verify JSON formatting is present
        assert "[\n" in result
        assert '"inline keyboard"' in result
        assert '"payment system"' in result
        assert '"admin panel"' in result

        # Verify it's valid JSON
        extracted = result.replace("Include these features: ", "")
        parsed = json.loads(extracted)
        assert parsed == config["features"]

    def test_handles_dict_values(self) -> None:
        """Test that dict values are JSON-serialized with proper formatting."""
        template = "Use this config: {{settings}}"
        config = {
            "settings": {
                "max_items": 10,
                "currency": "USD",
                "notifications": True,
            }
        }

        result = build_generation_prompt(template, config)

        # Verify JSON formatting
        assert "{\n" in result
        assert '"max_items": 10' in result
        assert '"currency": "USD"' in result
        assert '"notifications": true' in result

        # Verify it's valid JSON
        extracted = result.replace("Use this config: ", "")
        parsed = json.loads(extracted)
        assert parsed == config["settings"]

    def test_replaces_multiple_variables(self) -> None:
        """Test that multiple variables are replaced in a single template."""
        template = """
Bot Name: {{bot_name}}
Category: {{category}}
Features: {{features}}
Max Users: {{max_users}}
"""
        config = {
            "bot_name": "TestBot",
            "category": "utility",
            "features": ["feature1", "feature2"],
            "max_users": 1000,
        }

        result = build_generation_prompt(template, config)

        assert "Bot Name: TestBot" in result
        assert "Category: utility" in result
        assert '"feature1"' in result
        assert '"feature2"' in result
        assert "Max Users: 1000" in result

    def test_handles_number_values(self) -> None:
        """Test that numeric values are converted to strings correctly."""
        template = "Max items: {{max_items}}, Price: {{price}}"
        config = {"max_items": 100, "price": 19.99}

        result = build_generation_prompt(template, config)

        assert result == "Max items: 100, Price: 19.99"

    def test_handles_boolean_values(self) -> None:
        """Test that boolean values are converted correctly."""
        template = "Enabled: {{enabled}}, Public: {{is_public}}"
        config = {"enabled": True, "is_public": False}

        result = build_generation_prompt(template, config)

        assert result == "Enabled: True, Public: False"

    def test_handles_missing_variables(self) -> None:
        """Test that template with placeholders that have no config values remains unchanged."""
        template = "Name: {{bot_name}}, Type: {{bot_type}}"
        config = {"bot_name": "TestBot"}  # bot_type is missing

        result = build_generation_prompt(template, config)

        assert result == "Name: TestBot, Type: {{bot_type}}"

    def test_handles_empty_config(self) -> None:
        """Test that empty config leaves template unchanged."""
        template = "Name: {{bot_name}}"
        config: dict[str, str] = {}

        result = build_generation_prompt(template, config)

        assert result == "Name: {{bot_name}}"

    def test_handles_unicode_characters(self) -> None:
        """Test that Unicode characters are preserved (ensure_ascii=False)."""
        template = "Bot name: {{bot_name}}"
        config = {"bot_name": "МойБот"}  # Cyrillic

        result = build_generation_prompt(template, config)

        assert result == "Bot name: МойБот"

    def test_handles_nested_dict_values(self) -> None:
        """Test that nested dicts are properly JSON-serialized."""
        template = "Config: {{config}}"
        config: dict[str, dict[str, dict[str, str | int] | list[str]]] = {
            "config": {
                "database": {
                    "host": "localhost",
                    "port": 5432,
                },
                "features": ["a", "b"],
            }
        }

        result = build_generation_prompt(template, config)

        # Verify nested structure is preserved
        assert '"database":' in result
        assert '"host": "localhost"' in result
        assert '"port": 5432' in result
        assert '"features":' in result

        # Verify valid JSON
        extracted = result.replace("Config: ", "")
        parsed = json.loads(extracted)
        assert parsed == config["config"]


# =============================================================================
# T010: Test extract_code_files
# =============================================================================


class TestExtractCodeFiles:
    """Tests for extract_code_files function."""

    def test_extracts_python_file(self) -> None:
        """Test extracting a single Python file from markdown code block."""
        response = """Here's the code:

```python
# filename: main.py
print("Hello, World!")
```
"""
        result = extract_code_files(response)

        assert len(result) == 1
        assert "main.py" in result
        assert result["main.py"] == 'print("Hello, World!")'

    def test_extracts_multiple_files(self) -> None:
        """Test extracting multiple files with different extensions."""
        response = """Generated files:

```python
# filename: bot.py
import asyncio
print("bot")
```

```dockerfile
# filename: Dockerfile
FROM python:3.12
```

```yaml
# filename: docker-compose.yml
version: '3.8'
services:
  app:
    build: .
```

```json
# filename: config.json
{"key": "value"}
```
"""
        result = extract_code_files(response)

        assert len(result) == 4
        assert "bot.py" in result
        assert "import asyncio" in result["bot.py"]
        assert "Dockerfile" in result
        assert "FROM python:3.12" in result["Dockerfile"]
        assert "docker-compose.yml" in result
        assert "version: '3.8'" in result["docker-compose.yml"]
        assert "config.json" in result
        assert '{"key": "value"}' in result["config.json"]

    def test_returns_empty_for_no_code_blocks(self) -> None:
        """Test that response without valid code blocks returns empty dict."""
        response = """This is just text without any code blocks.
No files to extract here."""

        result = extract_code_files(response)

        assert result == {}

    def test_ignores_blocks_without_filename(self) -> None:
        """Test that code blocks without filename comment are ignored."""
        response = """
```python
# This is just a regular code block
print("No filename")
```

```python
# filename: with_filename.py
print("Has filename")
```
"""
        result = extract_code_files(response)

        # Only the one with filename should be extracted
        assert len(result) == 1
        assert "with_filename.py" in result
        assert result["with_filename.py"] == 'print("Has filename")'

    def test_handles_empty_response(self) -> None:
        """Test that empty response returns empty dict."""
        result = extract_code_files("")

        assert result == {}

    def test_handles_nested_path_filenames(self) -> None:
        """Test that nested paths in filenames are preserved."""
        response = """
```python
# filename: src/handlers/start.py
async def start_handler():
    pass
```

```python
# filename: config/settings.py
DATABASE_URL = "sqlite:///db.sqlite"
```
"""
        result = extract_code_files(response)

        assert len(result) == 2
        assert "src/handlers/start.py" in result
        assert "config/settings.py" in result

    def test_extracts_env_file(self) -> None:
        """Test extracting .env file."""
        response = """
```env
# filename: .env
API_KEY=secret123
DATABASE_URL=postgresql://localhost/db
```
"""
        result = extract_code_files(response)

        assert len(result) == 1
        assert ".env" in result
        assert "API_KEY=secret123" in result[".env"]
        assert "DATABASE_URL=postgresql://localhost/db" in result[".env"]

    def test_extracts_requirements_txt(self) -> None:
        """Test extracting requirements.txt."""
        response = """
```requirements
# filename: requirements.txt
fastapi==0.109.0
uvicorn==0.27.0
```
"""
        result = extract_code_files(response)

        assert len(result) == 1
        assert "requirements.txt" in result
        assert "fastapi==0.109.0" in result["requirements.txt"]

    def test_extracts_bash_script(self) -> None:
        """Test extracting shell script."""
        response = """
```bash
# filename: start.sh
#!/bin/bash
python main.py
```
"""
        result = extract_code_files(response)

        assert len(result) == 1
        assert "start.sh" in result
        assert "#!/bin/bash" in result["start.sh"]

    def test_handles_code_block_without_language(self) -> None:
        """Test extracting from code block without language specifier."""
        response = """
```
# filename: README.txt
This is a readme file
```
"""
        result = extract_code_files(response)

        assert len(result) == 1
        assert "README.txt" in result
        assert "This is a readme file" in result["README.txt"]

    def test_strips_whitespace_from_code(self) -> None:
        """Test that leading/trailing whitespace is stripped from code."""
        response = """
```python
# filename: test.py


def test():
    pass


```
"""
        result = extract_code_files(response)

        # Should strip leading/trailing empty lines
        assert result["test.py"] == "def test():\n    pass"

    def test_preserves_internal_whitespace(self) -> None:
        """Test that internal whitespace in code is preserved."""
        response = """
```python
# filename: test.py
def func1():
    pass

def func2():
    pass
```
"""
        result = extract_code_files(response)

        # Internal blank line should be preserved
        assert "\n\n" in result["test.py"]
        assert result["test.py"] == "def func1():\n    pass\n\ndef func2():\n    pass"

    def test_handles_filename_with_spaces(self) -> None:
        """Test that filenames with extra spaces are trimmed."""
        response = """
```python
# filename:   config file.py
content = "test"
```
"""
        result = extract_code_files(response)

        assert "config file.py" in result

    def test_case_insensitive_language_matching(self) -> None:
        """Test that language specifiers are case-insensitive."""
        response = """
```PYTHON
# filename: test1.py
pass
```

```Python
# filename: test2.py
pass
```
"""
        result = extract_code_files(response)

        assert len(result) == 2
        assert "test1.py" in result
        assert "test2.py" in result


# =============================================================================
# T011: Test Generation Service (placeholder for future implementation)
# =============================================================================


class TestGenerationService:
    """Tests for AIGenerationService."""

    @pytest.mark.asyncio
    async def test_generation_success(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test successful AI code generation flow.

        Verifies:
        1. Create project in draft status
        2. Mock Anthropic API to return valid code blocks
        3. Call AIGenerationService.generate_project_code()
        4. Verify project status changes to ready
        5. Verify generated_code field contains extracted files
        """
        from app.ai.service import AIGenerationService

        # Create project in draft status
        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Test Project",
            description="Test project for AI generation",
            template_id=test_template.id,
            config={"bot_name": "TestBot"},
            status=ProjectStatus.DRAFT.value,
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()
        await db_session.refresh(project)

        # Mock Anthropic API response with valid code blocks
        mock_response = """Here's your bot:

```python
# filename: main.py
import asyncio
from aiogram import Bot, Dispatcher

async def main():
    bot = Bot(token="TOKEN")
    dp = Dispatcher()
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
```

```python
# filename: config.py
DATABASE_URL = "sqlite:///bot.db"
```

```dockerfile
# filename: Dockerfile
FROM python:3.12
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "main.py"]
```
"""

        # Mock the Anthropic client
        with patch("app.ai.service.anthropic_client.generate_code") as mock_generate:
            mock_generate.return_value = mock_response

            service = AIGenerationService(db_session)
            result = await service.generate_project_code(project.id)

            # Verify result
            assert result["success"] is True
            assert result["files_count"] == 3
            assert "main.py" in result["files"]
            assert "config.py" in result["files"]
            assert "Dockerfile" in result["files"]

            # Verify project state
            await db_session.refresh(project)
            assert project.status == ProjectStatus.READY.value
            assert project.generated_code is not None
            assert "files" in project.generated_code
            assert "main.py" in project.generated_code["files"]
            assert "config.py" in project.generated_code["files"]
            assert "Dockerfile" in project.generated_code["files"]
            assert project.generated_at is not None
            assert project.error_message is None

    @pytest.mark.asyncio
    async def test_generation_updates_project_status(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that generation updates project status correctly.

        Expected status transitions:
        - draft -> ready (when generation completes successfully)
        """
        from app.ai.service import AIGenerationService

        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Status Test Project",
            template_id=test_template.id,
            config={"bot_name": "StatusBot"},
            status=ProjectStatus.DRAFT.value,
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        mock_response = """
```python
# filename: main.py
print("hello")
```
"""
        with patch("app.ai.service.anthropic_client.generate_code") as mock_generate:
            mock_generate.return_value = mock_response

            service = AIGenerationService(db_session)
            await service.generate_project_code(project.id)

            await db_session.refresh(project)
            assert project.status == ProjectStatus.READY.value
            assert project.generated_at is not None

    @pytest.mark.asyncio
    async def test_generation_error_handling(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that generation errors are handled correctly.

        Expected behavior when Anthropic API fails:
        1. Project status should be set to "error"
        2. Error message should be stored
        3. Exception should be raised to caller
        """
        from app.ai.service import AIGenerationService

        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Error Test Project",
            template_id=test_template.id,
            config={"bot_name": "ErrorBot"},
            status=ProjectStatus.DRAFT.value,
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        with patch("app.ai.service.anthropic_client.generate_code") as mock_generate:
            mock_generate.side_effect = Exception("API Error")

            service = AIGenerationService(db_session)

            with pytest.raises(Exception, match="API Error"):
                await service.generate_project_code(project.id)

            await db_session.refresh(project)
            assert project.status == ProjectStatus.ERROR.value
            assert project.error_message == "API Error"

    @pytest.mark.asyncio
    async def test_generation_project_not_found(
        self,
        db_session: AsyncSession,
    ) -> None:
        """Test that generation fails for non-existent project."""
        from app.ai.service import AIGenerationService

        service = AIGenerationService(db_session)
        non_existent_id = uuid.uuid4()

        with pytest.raises(ValueError, match=f"Project {non_existent_id} not found"):
            await service.generate_project_code(non_existent_id)

    @pytest.mark.asyncio
    async def test_generation_invalid_status(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that generation fails for projects not in draft or error status."""
        from app.ai.service import AIGenerationService

        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Ready Project",
            template_id=test_template.id,
            config={"bot_name": "ReadyBot"},
            status=ProjectStatus.READY.value,  # Not draft or error
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        service = AIGenerationService(db_session)

        with pytest.raises(ValueError, match="Project status must be 'draft' or 'error'"):
            await service.generate_project_code(project.id)

    @pytest.mark.asyncio
    async def test_generation_from_error_status(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that regeneration works for projects in error status."""
        from app.ai.service import AIGenerationService

        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Error Project",
            template_id=test_template.id,
            config={"bot_name": "ErrorBot"},
            status=ProjectStatus.ERROR.value,  # Can be regenerated
            error_message="Previous error",
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        mock_response = """
```python
# filename: main.py
print("regenerated")
```
"""
        with patch("app.ai.service.anthropic_client.generate_code") as mock_generate:
            mock_generate.return_value = mock_response

            service = AIGenerationService(db_session)
            result = await service.generate_project_code(project.id)

            assert result["success"] is True
            await db_session.refresh(project)
            assert project.status == ProjectStatus.READY.value
            assert project.error_message is None  # Cleared on success

    @pytest.mark.asyncio
    async def test_generation_no_files_extracted(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that generation fails if AI returns no valid code files."""
        from app.ai.service import AIGenerationService

        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="No Files Project",
            template_id=test_template.id,
            config={"bot_name": "NoFilesBot"},
            status=ProjectStatus.DRAFT.value,
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        # AI returns text without valid code blocks
        mock_response = "Here is some text without any code blocks"

        with patch("app.ai.service.anthropic_client.generate_code") as mock_generate:
            mock_generate.return_value = mock_response

            service = AIGenerationService(db_session)

            with pytest.raises(ValueError, match="No code files extracted"):
                await service.generate_project_code(project.id)

            await db_session.refresh(project)
            assert project.status == ProjectStatus.ERROR.value

    @pytest.mark.asyncio
    async def test_validate_project_for_generation(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test project validation for generation."""
        from app.ai.service import AIGenerationService

        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Valid Project",
            template_id=test_template.id,
            config={"bot_name": "ValidBot"},
            status=ProjectStatus.DRAFT.value,
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        service = AIGenerationService(db_session)
        validated_project = await service.validate_project_for_generation(project.id)

        assert validated_project.id == project.id
        assert validated_project.status == ProjectStatus.DRAFT.value


# =============================================================================
# T016: Test viewing generated code via GET /projects/{id}
# =============================================================================


class TestViewGeneratedCode:
    """Tests for viewing generated code via project detail endpoint."""

    @pytest.mark.asyncio
    async def test_view_generated_code_after_generation(
        self,
        client,
        auth_token: str,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that generated code is accessible via GET /projects/{id}."""
        from httpx import AsyncClient

        # Create a project with generated code (simulating post-generation state)
        generated_files = {
            "main.py": 'print("Hello, World!")',
            "config.py": 'BOT_TOKEN = "your-token-here"',
            "handlers/__init__.py": "# Handlers module",
        }

        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Generated Project",
            template_id=test_template.id,
            config={"bot_name": "TestBot"},
            status=ProjectStatus.READY.value,
            generated_code={"files": generated_files},
            ai_model_used="claude-sonnet-4-20250514",
            generated_at=datetime.now(timezone.utc),
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        # Get project details
        response = await client.get(
            f"/api/projects/{project.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify project status and generated code
        assert data["status"] == "ready"
        assert data["generated_code"] is not None
        assert "files" in data["generated_code"]
        assert data["generated_code"]["files"]["main.py"] == 'print("Hello, World!")'
        assert data["generated_code"]["files"]["config.py"] == 'BOT_TOKEN = "your-token-here"'
        assert data["ai_model_used"] == "claude-sonnet-4-20250514"
        assert data["generated_at"] is not None

    @pytest.mark.asyncio
    async def test_view_project_without_generated_code(
        self,
        client,
        auth_token: str,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that draft project returns null for generated_code."""
        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Draft Project",
            template_id=test_template.id,
            config={"bot_name": "DraftBot"},
            status=ProjectStatus.DRAFT.value,
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        response = await client.get(
            f"/api/projects/{project.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "draft"
        assert data["generated_code"] is None
        assert data["ai_model_used"] is None
        assert data["generated_at"] is None

    @pytest.mark.asyncio
    async def test_view_project_with_error_status(
        self,
        client,
        auth_token: str,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that error project shows error_message."""
        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Failed Project",
            template_id=test_template.id,
            config={"bot_name": "FailBot"},
            status=ProjectStatus.ERROR.value,
            error_message="API rate limit exceeded",
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        response = await client.get(
            f"/api/projects/{project.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "error"
        assert data["error_message"] == "API rate limit exceeded"
        assert data["generated_code"] is None


# =============================================================================
# T017, T018: Test Error Handling with Credit Refund
# =============================================================================


class TestErrorHandlingWithCreditRefund:
    """Tests for error handling and credit refund on generation failure."""

    @pytest.mark.asyncio
    async def test_credit_refund_on_api_error(
        self,
        client,
        auth_token: str,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that credits are refunded when AI generation fails (T017).

        Verifies:
        1. Create project in draft status
        2. User has sufficient credits
        3. Trigger generation with mocked API failure
        4. Verify credits are refunded (original balance restored)
        """
        from app.core.config import settings

        # Store initial credits
        initial_credits = test_user.credits
        generation_cost = settings.GENERATION_COST

        # Create draft project
        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Refund Test Project",
            template_id=test_template.id,
            config={"bot_name": "RefundBot"},
            status=ProjectStatus.DRAFT.value,
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        # Mock AI service to raise an error
        with patch("app.ai.service.AIGenerationService") as mock_ai_service:
            mock_instance = MagicMock()
            mock_instance.generate_project_code = AsyncMock(
                side_effect=Exception("Simulated API error")
            )
            mock_ai_service.return_value = mock_instance

            # Trigger generation (should fail)
            response = await client.post(
                f"/api/projects/{project.id}/generate",
                headers={"Authorization": f"Bearer {auth_token}"},
            )

        # Verify the request failed
        assert response.status_code == 500
        assert "Generation failed" in response.json()["detail"]

        # Refresh user to get updated credits
        await db_session.refresh(test_user)

        # Credits should be fully refunded (back to initial)
        assert test_user.credits == initial_credits

    @pytest.mark.asyncio
    async def test_error_status_and_message_saved(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test that error status and message are saved to project (T018).

        Verifies:
        1. When AI generation fails, project status = 'error'
        2. Error message is stored in project.error_message
        """
        from app.ai.service import AIGenerationService

        # Create draft project
        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Error Message Test",
            template_id=test_template.id,
            config={"bot_name": "ErrorMsgBot"},
            status=ProjectStatus.DRAFT.value,
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        # Mock API to return error
        with patch("app.ai.service.anthropic_client.generate_code") as mock_generate:
            error_message = "Rate limit exceeded: too many requests"
            mock_generate.side_effect = Exception(error_message)

            service = AIGenerationService(db_session)

            with pytest.raises(Exception, match="Rate limit exceeded"):
                await service.generate_project_code(project.id)

        # Verify project state
        await db_session.refresh(project)
        assert project.status == ProjectStatus.ERROR.value
        assert project.error_message == error_message

    @pytest.mark.asyncio
    async def test_regeneration_from_error_status(
        self,
        client,
        auth_token: str,
        db_session: AsyncSession,
        test_user: User,
        test_template: Template,
    ) -> None:
        """Test regeneration from error status succeeds (T020).

        Verifies:
        1. Project with status='error' can be regenerated
        2. Previous error_message is cleared
        3. Generation completes successfully
        """
        # Create project in error status
        project = Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Retry Test Project",
            template_id=test_template.id,
            config={"bot_name": "RetryBot"},
            status=ProjectStatus.ERROR.value,
            error_message="Previous generation failed",
            is_public=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        await db_session.commit()

        # Mock successful AI generation
        async def mock_generate(project_id):
            from sqlalchemy import select
            result = await db_session.execute(
                select(Project).where(Project.id == project_id)
            )
            proj = result.scalar_one()
            proj.status = ProjectStatus.READY.value
            proj.generated_code = {"files": {"main.py": "# Generated code"}}
            proj.error_message = None  # Clear previous error
            await db_session.commit()
            return {"success": True, "files_count": 1, "files": ["main.py"]}

        with patch("app.ai.service.AIGenerationService") as mock_ai_service:
            mock_instance = MagicMock()
            mock_instance.generate_project_code = mock_generate
            mock_ai_service.return_value = mock_instance

            # Trigger regeneration
            response = await client.post(
                f"/api/projects/{project.id}/generate",
                headers={"Authorization": f"Bearer {auth_token}"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert data["error_message"] is None
