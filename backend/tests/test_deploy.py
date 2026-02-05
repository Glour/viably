"""Tests for deploy module."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.deploy.models import Deployment
from app.deploy.schemas import DeploymentStatus
from app.deploy.service import DeploymentService
from app.projects.models import Project


# US1: Deploy Project Tests


@pytest.mark.asyncio
async def test_deploy_project_success(
    client: AsyncClient,
    auth_token: str,
    ready_project: Project,
):
    """Test successful deployment of a ready project."""
    with patch("app.deploy.service.railway_client") as mock_railway:
        # Mock Railway API responses
        mock_railway.create_project = AsyncMock(
            return_value={"id": "rp-123", "name": "test-project"}
        )
        mock_railway.create_service = AsyncMock(
            return_value={"id": "rs-123", "name": "bot"}
        )
        mock_railway.set_env_variables = AsyncMock(return_value=True)
        mock_railway.deploy_from_source = AsyncMock(
            return_value={"id": "rd-123", "status": "BUILDING"}
        )
        mock_railway.get_deployment_status = AsyncMock(
            return_value={"status": "SUCCESS", "url": "https://bot.up.railway.app"}
        )
        mock_railway.get_service_domain = AsyncMock(
            return_value="bot.up.railway.app"
        )

        response = await client.post(
            f"/api/deployments/projects/{ready_project.id}/deploy",
            json={
                "platform": "railway",
                "env_variables": {"BOT_TOKEN": "123:ABC"},
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["project_id"] == str(ready_project.id)
        assert data["platform"] == "railway"
        assert data["status"] in ["active", "deploying", "building", "pending"]


@pytest.mark.asyncio
async def test_deploy_requires_ready_status(
    client: AsyncClient,
    auth_token: str,
    draft_project: Project,
):
    """Test that deployment requires project to be in 'ready' status."""
    response = await client.post(
        f"/api/deployments/projects/{draft_project.id}/deploy",
        json={"platform": "railway", "env_variables": {}},
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 400
    assert "ready" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_deploy_requires_generated_code(
    client: AsyncClient,
    auth_token: str,
    db_session: AsyncSession,
    test_user: User,
    test_template,
):
    """Test that deployment requires generated code."""
    # Create a project in 'ready' status but without generated_code
    project = Project(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="No Code Project",
        template_id=test_template.id,
        config={"bot_name": "NoCodeBot"},
        status="ready",
        generated_code=None,
    )
    db_session.add(project)
    await db_session.commit()

    response = await client.post(
        f"/api/deployments/projects/{project.id}/deploy",
        json={"platform": "railway", "env_variables": {}},
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 400
    assert "code" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_deployment_error_handling(
    client: AsyncClient,
    auth_token: str,
    ready_project: Project,
):
    """Test error handling during deployment."""
    with patch("app.deploy.service.railway_client") as mock_railway:
        mock_railway.create_project = AsyncMock(
            side_effect=Exception("Railway API error")
        )

        response = await client.post(
            f"/api/deployments/projects/{ready_project.id}/deploy",
            json={"platform": "railway", "env_variables": {}},
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        # Should handle error gracefully
        assert response.status_code in [400, 500]


@pytest.mark.asyncio
async def test_deploy_project_not_found(
    client: AsyncClient,
    auth_token: str,
):
    """Test deployment of non-existent project."""
    fake_id = uuid.uuid4()
    response = await client.post(
        f"/api/deployments/projects/{fake_id}/deploy",
        json={"platform": "railway", "env_variables": {}},
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 400
    assert "not found" in response.json()["detail"].lower()


# US2: View Deployment Status Tests


@pytest.mark.asyncio
async def test_get_deployment_status(
    client: AsyncClient,
    auth_token: str,
    deployment: Deployment,
):
    """Test getting deployment status."""
    response = await client.get(
        f"/api/deployments/{deployment.id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(deployment.id)
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_get_deployment_not_found(
    client: AsyncClient,
    auth_token: str,
):
    """Test getting non-existent deployment."""
    fake_id = uuid.uuid4()
    response = await client.get(
        f"/api/deployments/{fake_id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_deployment_unauthorized(
    client: AsyncClient,
    other_user_token: str,
    deployment: Deployment,
):
    """Test that users cannot access other users' deployments."""
    response = await client.get(
        f"/api/deployments/{deployment.id}",
        headers={"Authorization": f"Bearer {other_user_token}"},
    )

    assert response.status_code == 404


# US3: View Deployment Logs Tests


@pytest.mark.asyncio
async def test_get_deployment_logs(
    client: AsyncClient,
    auth_token: str,
    active_deployment: Deployment,
):
    """Test getting deployment logs."""
    with patch("app.deploy.service.railway_client") as mock_railway:
        mock_railway.get_deployment_logs = AsyncMock(
            return_value="[2024-01-01T12:00:00Z] Bot started successfully"
        )

        response = await client.get(
            f"/api/deployments/{active_deployment.id}/logs",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "Bot started" in data["logs"]
        assert data["status"] == "active"


@pytest.mark.asyncio
async def test_get_deployment_logs_not_found(
    client: AsyncClient,
    auth_token: str,
):
    """Test getting logs for non-existent deployment."""
    fake_id = uuid.uuid4()
    response = await client.get(
        f"/api/deployments/{fake_id}/logs",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 404


# US4: Stop Deployment Tests


@pytest.mark.asyncio
async def test_stop_deployment(
    client: AsyncClient,
    auth_token: str,
    active_deployment: Deployment,
):
    """Test stopping a deployment."""
    with patch("app.deploy.service.railway_client") as mock_railway:
        mock_railway.delete_project = AsyncMock(return_value=True)

        response = await client.delete(
            f"/api/deployments/{active_deployment.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 204


@pytest.mark.asyncio
async def test_stop_deployment_not_found(
    client: AsyncClient,
    auth_token: str,
):
    """Test stopping non-existent deployment."""
    fake_id = uuid.uuid4()
    response = await client.delete(
        f"/api/deployments/{fake_id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 404


# US5: Health Check Tests


@pytest.mark.asyncio
async def test_health_check(
    db_session: AsyncSession,
    active_deployment: Deployment,
):
    """Test deployment health check."""
    with patch("app.deploy.service.httpx.AsyncClient") as mock_client:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_instance = AsyncMock()
        mock_instance.get = AsyncMock(return_value=mock_response)
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        service = DeploymentService(db_session)
        healthy = await service.check_health(active_deployment.id)

        assert healthy is True


@pytest.mark.asyncio
async def test_health_check_unhealthy(
    db_session: AsyncSession,
    active_deployment: Deployment,
):
    """Test health check when deployment is unhealthy."""
    with patch("app.deploy.service.httpx.AsyncClient") as mock_client:
        mock_response = AsyncMock()
        mock_response.status_code = 500
        mock_instance = AsyncMock()
        mock_instance.get = AsyncMock(return_value=mock_response)
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        service = DeploymentService(db_session)
        healthy = await service.check_health(active_deployment.id)

        assert healthy is False


@pytest.mark.asyncio
async def test_health_check_no_url(
    db_session: AsyncSession,
    deployment: Deployment,
):
    """Test health check when deployment has no URL."""
    service = DeploymentService(db_session)
    healthy = await service.check_health(deployment.id)

    assert healthy is False
