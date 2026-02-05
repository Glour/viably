"""Tests for projects module."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.projects.models import Project, ProjectStatus
from app.templates.models import Template


# =============================================================================
# User Story 1: Create Project
# =============================================================================


@pytest.mark.asyncio
async def test_create_project_success(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
    test_template: Template,
) -> None:
    """Test creating a new project with valid data."""
    response = await client.post(
        "/api/projects",
        json={
            "name": "My Bot",
            "description": "Test bot description",
            "template_id": str(test_template.id),
            "config": {"bot_name": "TestBot"},
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Bot"
    assert data["description"] == "Test bot description"
    assert data["status"] == "draft"
    assert data["user_id"] == str(test_user.id)
    assert data["template_id"] == str(test_template.id)
    assert data["config"] == {"bot_name": "TestBot"}
    assert data["is_public"] is False


@pytest.mark.asyncio
async def test_create_project_invalid_template(
    client: AsyncClient,
    auth_token: str,
) -> None:
    """Test creating project with non-existent template returns 404."""
    fake_template_id = str(uuid.uuid4())
    response = await client.post(
        "/api/projects",
        json={
            "name": "My Bot",
            "template_id": fake_template_id,
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_project_invalid_config(
    client: AsyncClient,
    auth_token: str,
    test_template: Template,
) -> None:
    """Test creating project with invalid config returns 400."""
    # test_template requires bot_name field
    response = await client.post(
        "/api/projects",
        json={
            "name": "My Bot",
            "template_id": str(test_template.id),
            "config": {},  # Missing required bot_name
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 400
    assert "validation" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_project_unauthorized(
    client: AsyncClient,
    test_template: Template,
) -> None:
    """Test creating project without auth returns 401."""
    response = await client.post(
        "/api/projects",
        json={
            "name": "My Bot",
            "template_id": str(test_template.id),
        },
    )

    assert response.status_code in [401, 403]


# =============================================================================
# User Story 2: View and Manage Projects
# =============================================================================


@pytest.mark.asyncio
async def test_list_projects_pagination(
    client: AsyncClient,
    auth_token: str,
    multiple_projects: list[Project],
) -> None:
    """Test listing projects with pagination."""
    # Page 1 with 10 items
    response = await client.get(
        "/api/projects?page=1&per_page=10",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "pages" in data
    assert len(data["items"]) == 10
    assert data["total"] == 25
    assert data["pages"] == 3


@pytest.mark.asyncio
async def test_list_projects_filter_by_status(
    client: AsyncClient,
    auth_token: str,
    multiple_projects: list[Project],
) -> None:
    """Test filtering projects by status."""
    response = await client.get(
        "/api/projects?status=ready",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    # multiple_projects creates 25 projects, odd indices have READY status
    assert len(data["items"]) > 0
    for item in data["items"]:
        assert item["status"] == "ready"


@pytest.mark.asyncio
async def test_get_project_details(
    client: AsyncClient,
    auth_token: str,
    test_project: Project,
) -> None:
    """Test getting project details."""
    response = await client.get(
        f"/api/projects/{test_project.id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_project.id)
    assert data["name"] == test_project.name
    assert "generated_code" in data  # DetailResponse includes this field


@pytest.mark.asyncio
async def test_get_project_not_found(
    client: AsyncClient,
    auth_token: str,
) -> None:
    """Test getting non-existent project returns 404."""
    fake_id = str(uuid.uuid4())
    response = await client.get(
        f"/api/projects/{fake_id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 404


# =============================================================================
# User Story 3: Update Project
# =============================================================================


@pytest.mark.asyncio
async def test_update_project_success(
    client: AsyncClient,
    auth_token: str,
    test_project: Project,
) -> None:
    """Test updating project fields."""
    response = await client.patch(
        f"/api/projects/{test_project.id}",
        json={"name": "Updated Name", "is_public": True},
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["is_public"] is True


@pytest.mark.asyncio
async def test_update_project_not_found(
    client: AsyncClient,
    auth_token: str,
) -> None:
    """Test updating non-existent project returns 404."""
    fake_id = str(uuid.uuid4())
    response = await client.patch(
        f"/api/projects/{fake_id}",
        json={"name": "Updated"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 404


# =============================================================================
# User Story 4: Delete Project
# =============================================================================


@pytest.mark.asyncio
async def test_delete_project_success(
    client: AsyncClient,
    auth_token: str,
    test_project: Project,
) -> None:
    """Test deleting a project."""
    response = await client.delete(
        f"/api/projects/{test_project.id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 204

    # Verify deleted
    response = await client.get(
        f"/api/projects/{test_project.id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_project_not_found(
    client: AsyncClient,
    auth_token: str,
) -> None:
    """Test deleting non-existent project returns 404."""
    fake_id = str(uuid.uuid4())
    response = await client.delete(
        f"/api/projects/{fake_id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 404


# =============================================================================
# User Story 5: Trigger Code Generation
# =============================================================================


@pytest.mark.asyncio
async def test_trigger_generation_success(
    client: AsyncClient,
    auth_token: str,
    test_project: Project,
) -> None:
    """Test triggering generation for draft project."""
    response = await client.post(
        f"/api/projects/{test_project.id}/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "generating"


@pytest.mark.asyncio
async def test_trigger_generation_non_draft(
    client: AsyncClient,
    auth_token: str,
    db_session: AsyncSession,
    test_project: Project,
) -> None:
    """Test triggering generation on non-draft project returns 400."""
    # First trigger to change status to generating
    await client.post(
        f"/api/projects/{test_project.id}/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    # Try to trigger again
    response = await client.post(
        f"/api/projects/{test_project.id}/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 400
    assert "draft" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_status_transitions(
    client: AsyncClient,
    auth_token: str,
    test_project: Project,
) -> None:
    """Test project status transitions."""
    # Initial status is draft
    response = await client.get(
        f"/api/projects/{test_project.id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.json()["status"] == "draft"

    # Trigger generation
    response = await client.post(
        f"/api/projects/{test_project.id}/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.json()["status"] == "generating"

    # Cannot trigger again
    response = await client.post(
        f"/api/projects/{test_project.id}/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 400


# =============================================================================
# User Story 6: Access Control
# =============================================================================


@pytest.mark.asyncio
async def test_owner_only_access(
    client: AsyncClient,
    auth_token: str,
    other_user_token: str,
    test_project: Project,
) -> None:
    """Test that only owner can access their project."""
    # Owner can access
    response = await client.get(
        f"/api/projects/{test_project.id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 200

    # Other user cannot access (gets 404, not 403)
    response = await client.get(
        f"/api/projects/{test_project.id}",
        headers={"Authorization": f"Bearer {other_user_token}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_public_project_access(
    client: AsyncClient,
    public_project: Project,
) -> None:
    """Test that public projects are accessible without auth."""
    response = await client.get(
        f"/api/projects/public/{public_project.id}",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(public_project.id)
    assert data["is_public"] is True


@pytest.mark.asyncio
async def test_private_project_not_public(
    client: AsyncClient,
    test_project: Project,
) -> None:
    """Test that private projects are not accessible via public endpoint."""
    response = await client.get(
        f"/api/projects/public/{test_project.id}",
    )

    assert response.status_code == 404
