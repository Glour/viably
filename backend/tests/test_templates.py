"""Tests for templates module."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.templates.models import Template


# =============================================================================
# User Story 1: Browse Available Templates
# =============================================================================


@pytest.mark.asyncio
async def test_list_templates(client: AsyncClient, multiple_templates: list[Template]) -> None:
    """Test GET /api/templates returns template list."""
    response = await client.get("/api/templates")

    assert response.status_code == 200
    data = response.json()["data"]
    assert "templates" in data
    assert len(data["templates"]) == 3

    # Check template structure
    template = data["templates"][0]
    assert "id" in template
    assert "name" in template
    assert "slug" in template
    assert "category" in template
    assert "credit_cost" in template
    assert "features" in template
    assert "tags" in template
    assert "usage_count" in template


@pytest.mark.asyncio
async def test_templates_sorted_by_order(
    client: AsyncClient, multiple_templates: list[Template]
) -> None:
    """Test templates are returned sorted by sort_order."""
    response = await client.get("/api/templates")

    assert response.status_code == 200
    data = response.json()["data"]
    templates = data["templates"]

    # Should be sorted by sort_order (1, 2, 3)
    assert templates[0]["slug"] == "faq-bot"  # sort_order=1
    assert templates[1]["slug"] == "shop-bot"  # sort_order=2
    assert templates[2]["slug"] == "api-service"  # sort_order=3


@pytest.mark.asyncio
async def test_inactive_template_not_in_list(
    client: AsyncClient, test_template: Template, inactive_template: Template
) -> None:
    """Test inactive templates are not returned in list."""
    response = await client.get("/api/templates")

    assert response.status_code == 200
    data = response.json()["data"]
    templates = data["templates"]

    # Only active template should be in list
    assert len(templates) == 1
    assert templates[0]["slug"] == "test-template"

    # Inactive template should not be present
    slugs = [t["slug"] for t in templates]
    assert "inactive-template" not in slugs


@pytest.mark.asyncio
async def test_empty_templates_list(client: AsyncClient) -> None:
    """Test GET /api/templates returns empty list when no templates exist."""
    response = await client.get("/api/templates")

    assert response.status_code == 200
    data = response.json()["data"]
    assert "templates" in data
    assert len(data["templates"]) == 0


# =============================================================================
# User Story 2: Filter Templates by Category
# =============================================================================


@pytest.mark.asyncio
async def test_list_templates_by_category(
    client: AsyncClient, multiple_templates: list[Template]
) -> None:
    """Test filtering templates by category."""
    # Filter telegram_bot
    response = await client.get("/api/templates?category=telegram_bot")
    assert response.status_code == 200
    data = response.json()["data"]
    templates = data["templates"]

    assert len(templates) == 2
    for template in templates:
        assert template["category"] == "telegram_bot"

    # Filter api_service
    response = await client.get("/api/templates?category=api_service")
    assert response.status_code == 200
    data = response.json()["data"]
    templates = data["templates"]

    assert len(templates) == 1
    assert templates[0]["category"] == "api_service"
    assert templates[0]["slug"] == "api-service"


@pytest.mark.asyncio
async def test_filter_invalid_category(
    client: AsyncClient, multiple_templates: list[Template]
) -> None:
    """Test filtering by non-existent category returns empty list."""
    response = await client.get("/api/templates?category=nonexistent")

    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["templates"]) == 0
