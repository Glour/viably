"""Comprehensive API endpoints test suite.

Tests all API endpoints for functionality, authentication, and error handling.
Covers:
- Authentication (register, login, refresh, logout)
- Users (profile, credits, transactions)
- Templates (list, get by id/slug)
- Projects (CRUD, generate, deploy, code download)
- Conversations (CRUD, messages, artifacts)
- Credits (balance, transactions, daily bonus)
- AI (status)
- Emails (logs, retry)
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


# =============================================================================
# Authentication Endpoints
# =============================================================================


class TestAuthEndpoints:
    """Test authentication endpoints."""

    async def test_register_success(self, client: AsyncClient):
        """Test successful user registration."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "SecurePass123!",
                "full_name": "New User",
            },
        )
        assert response.status_code == 201
        data = response.json()["data"]
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "newuser@example.com"

    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        """Test registration with duplicate email."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": test_user.email,
                "password": "SecurePass123!",
                "full_name": "Duplicate User",
            },
        )
        assert response.status_code == 409

    async def test_register_weak_password(self, client: AsyncClient):
        """Test registration with weak password."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "weak@example.com",
                "password": "123",
                "full_name": "Weak Password",
            },
        )
        assert response.status_code == 422  # Validation error, not 400

    async def test_login_success(self, client: AsyncClient, test_user):
        """Test successful login."""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "Test1234!",
            },
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_invalid_credentials(self, client: AsyncClient, test_user):
        """Test login with invalid credentials."""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "WrongPassword!",
            },
        )
        assert response.status_code == 401

    async def test_login_inactive_user(self, client: AsyncClient, inactive_user):
        """Test login with inactive user."""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": inactive_user.email,
                "password": "Test1234!",
            },
        )
        assert response.status_code == 403

    async def test_refresh_token_success(self, client: AsyncClient, test_user):
        """Test token refresh."""
        from api.src.auth.service import create_refresh_token

        refresh_token = create_refresh_token(test_user.id)
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_logout_success(self, client: AsyncClient, auth_token):
        """Test successful logout."""
        response = await client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 204


# =============================================================================
# Users Endpoints
# =============================================================================


class TestUsersEndpoints:
    """Test users endpoints."""

    async def test_get_current_user(self, client: AsyncClient, auth_token, test_user):
        """Test getting current user profile."""
        response = await client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name

    async def test_update_current_user(self, client: AsyncClient, auth_token):
        """Test updating current user profile."""
        response = await client.patch(
            "/api/users/me",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "full_name": "Updated Name",
                "avatar_url": "https://example.com/avatar.jpg",
            },
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["full_name"] == "Updated Name"

    async def test_get_user_credits(self, client: AsyncClient, auth_token, test_user):
        """Test getting user credits."""
        response = await client.get(
            "/api/users/me/credits",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["credits"] == test_user.credits
        assert "plan" in data
        assert "daily_bonus" in data

    async def test_get_user_transactions(
        self, client: AsyncClient, auth_token, user_with_transactions
    ):
        """Test getting user transaction history."""
        response = await client.get(
            "/api/users/me/transactions",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert "transactions" in data
        assert "pagination" in data
        assert len(data["transactions"]) > 0

    async def test_unauthorized_access(self, client: AsyncClient):
        """Test unauthorized access to protected endpoints."""
        response = await client.get("/api/users/me")
        assert response.status_code == 401


# =============================================================================
# Templates Endpoints
# =============================================================================


class TestTemplatesEndpoints:
    """Test templates endpoints."""

    async def test_list_templates(self, client: AsyncClient, multiple_templates):
        """Test listing all templates."""
        response = await client.get("/api/templates")
        assert response.status_code == 200
        data = response.json()["data"]
        assert "templates" in data
        assert len(data["templates"]) == len(multiple_templates)

    async def test_filter_templates_by_category(
        self, client: AsyncClient, multiple_templates
    ):
        """Test filtering templates by category."""
        response = await client.get("/api/templates?category=telegram_bot")
        assert response.status_code == 200
        data = response.json()["data"]
        templates = data["templates"]
        assert all(t["category"] == "telegram_bot" for t in templates)

    async def test_search_templates(self, client: AsyncClient, multiple_templates):
        """Test searching templates."""
        response = await client.get("/api/templates?search=faq")
        assert response.status_code == 200
        data = response.json()["data"]
        templates = data["templates"]
        assert len(templates) > 0
        assert any("faq" in t["name"].lower() for t in templates)

    async def test_get_template_by_id(self, client: AsyncClient, test_template):
        """Test getting template by ID."""
        response = await client.get(f"/api/templates/{test_template.id}")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["id"] == str(test_template.id)
        assert data["name"] == test_template.name

    async def test_get_template_by_slug(self, client: AsyncClient, test_template):
        """Test getting template by slug."""
        response = await client.get(f"/api/templates/{test_template.slug}")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["slug"] == test_template.slug

    async def test_get_nonexistent_template(self, client: AsyncClient):
        """Test getting non-existent template."""
        fake_id = uuid.uuid4()
        response = await client.get(f"/api/templates/{fake_id}")
        assert response.status_code == 404


# =============================================================================
# Projects Endpoints
# =============================================================================


class TestProjectsEndpoints:
    """Test projects endpoints."""

    async def test_create_project(
        self, client: AsyncClient, auth_token, test_template
    ):
        """Test creating a new project."""
        response = await client.post(
            "/api/projects",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "New Project",
                "description": "Test project",
                "template_id": str(test_template.id),
                "config": {"bot_name": "TestBot"},
            },
        )
        assert response.status_code == 201
        assert response.json()["name"] == "New Project"

    async def test_list_projects(
        self, client: AsyncClient, auth_token, multiple_projects
    ):
        """Test listing user projects."""
        response = await client.get(
            "/api/projects",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == len(multiple_projects)

    async def test_list_projects_with_status_filter(
        self, client: AsyncClient, auth_token, multiple_projects
    ):
        """Test filtering projects by status."""
        response = await client.get(
            "/api/projects?status=draft",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert all(p["status"] == "draft" for p in data["items"])

    async def test_get_project(self, client: AsyncClient, auth_token, test_project):
        """Test getting project details."""
        response = await client.get(
            f"/api/projects/{test_project.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_project.id)
        assert data["name"] == test_project.name

    async def test_update_project(self, client: AsyncClient, auth_token, test_project):
        """Test updating project."""
        response = await client.patch(
            f"/api/projects/{test_project.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Updated Project Name",
                "description": "Updated description",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Project Name"

    async def test_delete_project(self, client: AsyncClient, auth_token, test_project):
        """Test deleting project."""
        response = await client.delete(
            f"/api/projects/{test_project.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 204

    async def test_trigger_generation(
        self, client: AsyncClient, auth_token, test_project
    ):
        """Test triggering code generation."""
        with patch("api.src.ai.tasks.process_generation.delay") as mock_task:
            mock_task.return_value = MagicMock(id="task-123")
            response = await client.post(
                f"/api/projects/{test_project.id}/generate",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"user_prompt": "Add error handling"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "generating"

    async def test_get_project_code(
        self, client: AsyncClient, auth_token, ready_project
    ):
        """Test getting project code."""
        response = await client.get(
            f"/api/projects/{ready_project.id}/code",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        assert len(data["files"]) > 0

    async def test_download_project(
        self, client: AsyncClient, auth_token, ready_project
    ):
        """Test downloading project as ZIP."""
        response = await client.get(
            f"/api/projects/{ready_project.id}/download",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/zip"

    async def test_deploy_project(
        self, client: AsyncClient, auth_token, ready_project
    ):
        """Test deploying project."""
        with patch("api.src.deploy.tasks.process_deployment.delay") as mock_task:
            mock_task.return_value = MagicMock(id="deploy-task-123")
            response = await client.post(
                f"/api/projects/{ready_project.id}/deploy",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "platform": "docker",
                    "env_variables": {"BOT_TOKEN": "test-token"},
                },
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "pending"

    async def test_get_public_project(self, client: AsyncClient, public_project):
        """Test getting public project (no auth required)."""
        response = await client.get(f"/api/projects/public/{public_project.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(public_project.id)

    async def test_access_other_user_project(
        self, client: AsyncClient, other_user_token, test_project
    ):
        """Test accessing another user's project."""
        response = await client.get(
            f"/api/projects/{test_project.id}",
            headers={"Authorization": f"Bearer {other_user_token}"},
        )
        assert response.status_code == 404


# =============================================================================
# Conversations Endpoints
# =============================================================================


class TestConversationsEndpoints:
    """Test conversations endpoints."""

    async def test_create_conversation(
        self, client: AsyncClient, auth_token, test_project
    ):
        """Test creating a new conversation."""
        response = await client.post(
            "/api/conversations",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "project_id": str(test_project.id),
                "title": "Test Conversation",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Conversation"
        assert data["project_id"] == str(test_project.id)

    async def test_get_conversation(self, client: AsyncClient, auth_token, test_conversation):
        """Test getting conversation details."""
        response = await client.get(
            f"/api/conversations/{test_conversation.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_conversation.id)

    async def test_update_conversation(
        self, client: AsyncClient, auth_token, test_conversation
    ):
        """Test updating conversation."""
        response = await client.patch(
            f"/api/conversations/{test_conversation.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"title": "Updated Title"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    async def test_delete_conversation(
        self, client: AsyncClient, auth_token, test_conversation
    ):
        """Test deleting conversation."""
        response = await client.delete(
            f"/api/conversations/{test_conversation.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 204


# =============================================================================
# Credits Endpoints
# =============================================================================


class TestCreditsEndpoints:
    """Test credits endpoints."""

    async def test_get_balance(self, client: AsyncClient, auth_token, test_user):
        """Test getting credit balance."""
        response = await client.get(
            "/api/credits/balance",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["credits"] == test_user.credits
        assert data["plan"] == test_user.plan

    async def test_get_transactions(
        self, client: AsyncClient, auth_token, user_with_transactions
    ):
        """Test getting credit transactions."""
        response = await client.get(
            "/api/credits/transactions",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "meta" in data
        assert len(data["data"]) > 0

    async def test_get_daily_bonus_status(self, client: AsyncClient, auth_token):
        """Test getting daily bonus status."""
        response = await client.get(
            "/api/credits/daily-bonus",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert "claimed_today" in data
        assert "amount" in data
        assert isinstance(data["claimed_today"], bool)

    async def test_claim_daily_bonus(self, client: AsyncClient, auth_token):
        """Test claiming daily bonus."""
        response = await client.post(
            "/api/credits/daily-bonus",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert "amount" in data
        assert "new_balance" in data

    async def test_claim_daily_bonus_already_claimed(
        self, client: AsyncClient, auth_token, user_with_today_bonus
    ):
        """Test claiming daily bonus when already claimed."""
        # Auth token is for test_user, need to create token for user_with_today_bonus
        from api.src.auth.service import create_access_token

        bonus_user_token = create_access_token(user_with_today_bonus.id)
        response = await client.post(
            "/api/credits/daily-bonus",
            headers={"Authorization": f"Bearer {bonus_user_token}"},
        )
        assert response.status_code == 409  # Conflict - already claimed


# =============================================================================
# AI Endpoints
# =============================================================================


class TestAIEndpoints:
    """Test AI endpoints."""

    async def test_get_ai_status(self, client: AsyncClient, admin_token):
        """Test getting AI service status (admin only)."""
        response = await client.get(
            "/api/ai/status",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "model" in data

    async def test_get_ai_status_non_admin(self, client: AsyncClient, auth_token):
        """Test getting AI status as non-admin."""
        response = await client.get(
            "/api/ai/status",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403


# =============================================================================
# Emails Endpoints
# =============================================================================


class TestEmailsEndpoints:
    """Test emails endpoints."""

    async def test_get_email_logs(self, client: AsyncClient, auth_token):
        """Test getting email logs."""
        response = await client.get(
            "/api/emails/logs",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert isinstance(data, list)

    async def test_test_send_email(self, client: AsyncClient, auth_token):
        """Test sending test email."""
        # Mock the EmailTemplateRenderer class before EmailService is instantiated
        with patch("api.src.emails.service.EmailTemplateRenderer") as MockRenderer, \
             patch("api.celery_tasks.email_tasks.send_template_email_task.delay") as mock_task:

            # Setup mocks
            mock_task.return_value = MagicMock(id="email-task-123")

            # Mock renderer instance
            mock_renderer_instance = MagicMock()
            mock_renderer_instance.get_available_templates.return_value = [
                "welcome", "generation-complete", "deploy-success", "low-credits"
            ]
            MockRenderer.return_value = mock_renderer_instance

            response = await client.post(
                "/api/emails/test-send",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "template_name": "welcome",
                    "recipient": "test@example.com",
                },
            )
            assert response.status_code == 200
            data = response.json()["data"]
            assert data["template"] == "welcome"
            assert data["recipient"] == "test@example.com"
            assert "task_id" in data


# =============================================================================
# Health Check
# =============================================================================


class TestHealthCheck:
    """Test health check endpoint."""

    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint."""
        response = await client.get("/health")
        assert response.status_code in [200, 503]
        data = response.json()
        assert "status" in data
        assert "database" in data


# =============================================================================
# Rate Limiting Tests
# =============================================================================


class TestRateLimiting:
    """Test rate limiting on endpoints."""

    @pytest.mark.skip(reason="Rate limiting requires Redis, skipped in unit tests")
    async def test_rate_limit_exceeded(self, client: AsyncClient, auth_token):
        """Test rate limit exceeded."""
        # Make many requests to trigger rate limit
        for _ in range(50):
            await client.get(
                "/api/users/me",
                headers={"Authorization": f"Bearer {auth_token}"},
            )

        # This should be rate limited
        response = await client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 429
