"""Unit tests for ConversationAIService."""

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.conversations.ai_service import ConversationAIService
from infrastructure.database.models.conversations import Artifact, Conversation, Message
from infrastructure.database.models.projects import Project
from infrastructure.database.models.templates import Template


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    redis_mock = AsyncMock()
    redis_mock.get = AsyncMock(return_value=None)
    redis_mock.setex = AsyncMock()
    redis_mock.delete = AsyncMock()
    return redis_mock


@pytest.fixture
def mock_anthropic_client():
    """Mock Anthropic client."""
    client_mock = MagicMock()
    client_mock.default_model = "claude-3-5-sonnet-20241022"
    return client_mock


@pytest.fixture
async def test_template(db_session: AsyncSession) -> Template:
    """Create a test template."""
    template = Template(
        id=uuid.uuid4(),
        name="Test Template",
        description="Test template for unit tests",
        category="telegram-bots",
        prompt_template="You are a bot creator. Create a bot for {{bot_name}}.",
        config_schema={
            "type": "object",
            "properties": {
                "bot_name": {"type": "string"}
            }
        },
        credit_cost=10,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(template)
    await db_session.commit()
    await db_session.refresh(template)
    return template


@pytest.fixture
async def test_project(db_session: AsyncSession, test_user, test_template) -> Project:
    """Create a test project."""
    project = Project(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Test Project",
        description="Test project for conversation",
        template_id=test_template.id,
        config={"bot_name": "TestBot"},
        status="draft",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


@pytest.fixture
async def test_conversation(
    db_session: AsyncSession, test_user, test_project
) -> Conversation:
    """Create a test conversation."""
    conversation = Conversation(
        id=uuid.uuid4(),
        project_id=test_project.id,
        user_id=test_user.id,
        title="Test Conversation",
        metadata_={},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(conversation)
    await db_session.commit()
    await db_session.refresh(conversation)
    return conversation


class TestBuildConversationContext:
    """Tests for build_conversation_context method."""

    @pytest.mark.asyncio
    async def test_empty_conversation_with_template(
        self,
        db_session: AsyncSession,
        test_conversation: Conversation,
        test_template: Template,
        mock_redis,
    ):
        """Test context building for empty conversation with template."""
        service = ConversationAIService(db_session)

        with patch.object(service, '_get_redis', return_value=mock_redis):
            context = await service.build_conversation_context(test_conversation.id)

        # Should have system message from template
        assert len(context) == 1
        assert context[0]["role"] == "__system__"
        assert "bot creator" in context[0]["content"].lower()
        assert context[0]["cache_control"] == {"type": "ephemeral"}

        # Should cache result
        mock_redis.setex.assert_called_once()
        cache_key = f"conversation:{test_conversation.id}:context"
        assert mock_redis.setex.call_args[0][0] == cache_key
        assert mock_redis.setex.call_args[0][1] == 3600  # 1 hour TTL

    @pytest.mark.asyncio
    async def test_conversation_with_existing_messages(
        self,
        db_session: AsyncSession,
        test_conversation: Conversation,
        mock_redis,
    ):
        """Test context building with existing messages."""
        # Add some messages
        user_msg = Message(
            id=uuid.uuid4(),
            conversation_id=test_conversation.id,
            role="user",
            content="Create a hello world bot",
            tokens_used=0,
            created_at=datetime.now(timezone.utc),
        )
        assistant_msg = Message(
            id=uuid.uuid4(),
            conversation_id=test_conversation.id,
            role="assistant",
            content="Sure! Here's a bot...",
            tokens_used=100,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add_all([user_msg, assistant_msg])
        await db_session.commit()

        service = ConversationAIService(db_session)

        with patch.object(service, '_get_redis', return_value=mock_redis):
            context = await service.build_conversation_context(test_conversation.id)

        # Should have system message + 2 messages
        assert len(context) == 3
        assert context[0]["role"] == "__system__"
        assert context[1]["role"] == "user"
        assert context[1]["content"] == "Create a hello world bot"
        assert context[2]["role"] == "assistant"
        assert context[2]["content"] == "Sure! Here's a bot..."

    @pytest.mark.asyncio
    async def test_cache_hit(
        self,
        db_session: AsyncSession,
        test_conversation: Conversation,
        mock_redis,
    ):
        """Test Redis cache hit."""
        cached_data = [
            {"role": "__system__", "content": "System prompt"},
            {"role": "user", "content": "Hello"},
        ]
        mock_redis.get.return_value = json.dumps(cached_data)

        service = ConversationAIService(db_session)

        with patch.object(service, '_get_redis', return_value=mock_redis):
            context = await service.build_conversation_context(test_conversation.id)

        # Should return cached data
        assert context == cached_data
        mock_redis.get.assert_called_once()
        mock_redis.setex.assert_not_called()

    @pytest.mark.asyncio
    async def test_conversation_not_found(
        self,
        db_session: AsyncSession,
        mock_redis,
    ):
        """Test error when conversation not found."""
        service = ConversationAIService(db_session)
        fake_id = uuid.uuid4()

        with patch.object(service, '_get_redis', return_value=mock_redis):
            with pytest.raises(ValueError, match="Conversation .* not found"):
                await service.build_conversation_context(fake_id)


class TestExtractArtifacts:
    """Tests for extract_artifacts method."""

    def test_extract_python_artifact(self, db_session: AsyncSession):
        """Test extracting Python code artifact."""
        service = ConversationAIService(db_session)

        response = """
        Here's a Python script:

        ```python
        # filename: main.py
        def hello():
            print("Hello, world!")

        hello()
        ```
        """

        artifacts = service.extract_artifacts(response)

        assert len(artifacts) == 1
        assert artifacts[0]["type"] == "python"
        assert artifacts[0]["title"] == "main.py"
        assert "def hello():" in artifacts[0]["content"]
        assert artifacts[0]["language"] == "python"

    def test_extract_multiple_artifacts(self, db_session: AsyncSession):
        """Test extracting multiple artifacts."""
        service = ConversationAIService(db_session)

        response = """
        Here are the files:

        ```python
        # filename: bot.py
        import asyncio
        ```

        ```yaml
        # filename: config.yml
        bot_token: "123"
        ```

        ```html
        <!-- filename: index.html -->
        <html></html>
        ```
        """

        artifacts = service.extract_artifacts(response)

        assert len(artifacts) == 3
        assert artifacts[0]["type"] == "python"
        assert artifacts[0]["title"] == "bot.py"
        assert artifacts[1]["type"] == "yaml"
        assert artifacts[1]["title"] == "config.yml"
        assert artifacts[2]["type"] == "html"
        assert artifacts[2]["title"] == "index.html"

    def test_extract_react_artifact(self, db_session: AsyncSession):
        """Test extracting React component."""
        service = ConversationAIService(db_session)

        response = """
        ```react
        // filename: App.jsx
        export default function App() {
            return <div>Hello</div>;
        }
        ```
        """

        artifacts = service.extract_artifacts(response)

        assert len(artifacts) == 1
        assert artifacts[0]["type"] == "react"
        assert artifacts[0]["title"] == "App.jsx"

    def test_extract_artifact_without_filename(self, db_session: AsyncSession):
        """Test artifact extraction without filename comment."""
        service = ConversationAIService(db_session)

        response = """
        ```javascript
        console.log("Hello");
        ```
        """

        artifacts = service.extract_artifacts(response)

        assert len(artifacts) == 1
        assert artifacts[0]["type"] == "javascript"
        assert artifacts[0]["title"] == "file.javascript"

    def test_ignore_invalid_artifact_types(self, db_session: AsyncSession):
        """Test that invalid artifact types are ignored."""
        service = ConversationAIService(db_session)

        response = """
        ```unknown_language
        some code
        ```

        ```python
        # filename: valid.py
        print("valid")
        ```
        """

        artifacts = service.extract_artifacts(response)

        # Should only extract the valid Python artifact
        assert len(artifacts) == 1
        assert artifacts[0]["type"] == "python"


class TestSendMessageStreaming:
    """Tests for send_message_streaming method."""

    @pytest.mark.asyncio
    async def test_streaming_with_artifacts(
        self,
        db_session: AsyncSession,
        test_conversation: Conversation,
        test_user,
        mock_redis,
        mock_anthropic_client,
    ):
        """Test streaming message with artifact extraction."""
        # Mock streaming response
        async def mock_stream(prompt, system_prompt):
            tokens = [
                "Here's ",
                "a bot:\n\n",
                "```python\n",
                "# filename: bot.py\n",
                "print('Hello')\n",
                "```",
            ]
            for token in tokens:
                yield token

        mock_anthropic_client.generate_code_streaming = mock_stream

        service = ConversationAIService(db_session)

        events = []
        with patch.object(service, '_get_redis', return_value=mock_redis):
            with patch('app.conversations.ai_service.get_anthropic_client', return_value=mock_anthropic_client):
                async for event in service.send_message_streaming(
                    test_conversation.id,
                    "Create a hello bot",
                    test_user.id,
                ):
                    events.append(event)

        # Check events
        token_events = [e for e in events if e["type"] == "token"]
        artifact_events = [e for e in events if e["type"] == "artifact"]
        done_events = [e for e in events if e["type"] == "done"]

        assert len(token_events) == 6  # Should have 6 token events
        assert len(artifact_events) == 1  # Should extract 1 artifact
        assert len(done_events) == 1  # Should have done event

        # Check artifact
        artifact = artifact_events[0]["artifact"]
        assert artifact["type"] == "python"
        assert artifact["title"] == "bot.py"
        assert "print('Hello')" in artifact["content"]

        # Check messages saved to DB
        messages = await db_session.execute(
            db_session.query(Message).filter_by(conversation_id=test_conversation.id)
        )
        message_list = list(messages.scalars())
        assert len(message_list) == 2  # User + assistant
        assert message_list[0].role == "user"
        assert message_list[1].role == "assistant"

        # Check cache invalidated
        mock_redis.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_streaming_error_handling(
        self,
        db_session: AsyncSession,
        test_conversation: Conversation,
        test_user,
        mock_redis,
        mock_anthropic_client,
    ):
        """Test error handling during streaming."""
        # Mock streaming that raises error
        async def mock_stream_error(prompt, system_prompt):
            yield "Starting"
            raise Exception("API Error")

        mock_anthropic_client.generate_code_streaming = mock_stream_error

        service = ConversationAIService(db_session)

        events = []
        with patch.object(service, '_get_redis', return_value=mock_redis):
            with patch('app.conversations.ai_service.get_anthropic_client', return_value=mock_anthropic_client):
                async for event in service.send_message_streaming(
                    test_conversation.id,
                    "Test message",
                    test_user.id,
                ):
                    events.append(event)

        # Should have error event
        error_events = [e for e in events if e["type"] == "error"]
        assert len(error_events) == 1
        assert "API Error" in error_events[0]["error"]


class TestMapLanguageToType:
    """Tests for _map_language_to_type method."""

    def test_language_mapping(self, db_session: AsyncSession):
        """Test language to artifact type mapping."""
        service = ConversationAIService(db_session)

        assert service._map_language_to_type("python") == "python"
        assert service._map_language_to_type("py") == "python"
        assert service._map_language_to_type("javascript") == "javascript"
        assert service._map_language_to_type("js") == "javascript"
        assert service._map_language_to_type("typescript") == "typescript"
        assert service._map_language_to_type("ts") == "typescript"
        assert service._map_language_to_type("react") == "react"
        assert service._map_language_to_type("jsx") == "react"
        assert service._map_language_to_type("tsx") == "react"
        assert service._map_language_to_type("vue") == "vue"
        assert service._map_language_to_type("html") == "html"
        assert service._map_language_to_type("css") == "css"
        assert service._map_language_to_type("scss") == "css"
        assert service._map_language_to_type("yaml") == "yaml"
        assert service._map_language_to_type("yml") == "yaml"
        assert service._map_language_to_type("json") == "json"
        assert service._map_language_to_type("markdown") == "markdown"
        assert service._map_language_to_type("md") == "markdown"
        assert service._map_language_to_type("unknown") == "text"


class TestExtractTitleFromContent:
    """Tests for _extract_title_from_content method."""

    def test_python_filename_comment(self, db_session: AsyncSession):
        """Test extracting filename from Python comment."""
        service = ConversationAIService(db_session)

        content = """# filename: bot.py
import asyncio

async def main():
    pass
"""

        title = service._extract_title_from_content(content, "python")
        assert title == "bot.py"

    def test_javascript_filename_comment(self, db_session: AsyncSession):
        """Test extracting filename from JavaScript comment."""
        service = ConversationAIService(db_session)

        content = """// filename: app.js
const express = require('express');
"""

        title = service._extract_title_from_content(content, "javascript")
        assert title == "app.js"

    def test_html_filename_comment(self, db_session: AsyncSession):
        """Test extracting filename from HTML comment."""
        service = ConversationAIService(db_session)

        content = """<!-- filename: index.html -->
<!DOCTYPE html>
<html></html>
"""

        title = service._extract_title_from_content(content, "html")
        assert title == "index.html"

    def test_no_filename_comment(self, db_session: AsyncSession):
        """Test when there's no filename comment."""
        service = ConversationAIService(db_session)

        content = """
def hello():
    print("Hello")
"""

        title = service._extract_title_from_content(content, "python")
        assert title is None

    def test_title_comment_variant(self, db_session: AsyncSession):
        """Test extracting from 'title' comment."""
        service = ConversationAIService(db_session)

        content = """# title: my_script.py
print("Hello")
"""

        title = service._extract_title_from_content(content, "python")
        assert title == "my_script.py"
