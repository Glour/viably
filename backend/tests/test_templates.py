"""Tests for templates module."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.templates import Template

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


# =============================================================================
# User Story 3: Search Templates
# =============================================================================


@pytest.mark.asyncio
async def test_search_templates(
    client: AsyncClient, multiple_templates: list[Template]
) -> None:
    """Test searching templates by name/description."""
    # Search for "shop" - should find Shop Bot
    response = await client.get("/api/templates?search=shop")
    assert response.status_code == 200
    data = response.json()["data"]
    templates = data["templates"]

    assert len(templates) == 1
    assert templates[0]["slug"] == "shop-bot"

    # Search for "bot" - should find FAQ Bot and Shop Bot
    response = await client.get("/api/templates?search=bot")
    assert response.status_code == 200
    data = response.json()["data"]
    templates = data["templates"]

    assert len(templates) == 2
    slugs = [t["slug"] for t in templates]
    assert "faq-bot" in slugs
    assert "shop-bot" in slugs

    # Case-insensitive search
    response = await client.get("/api/templates?search=FAQ")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["templates"]) == 1


@pytest.mark.asyncio
async def test_search_no_results(
    client: AsyncClient, multiple_templates: list[Template]
) -> None:
    """Test search with no matching results."""
    response = await client.get("/api/templates?search=nonexistent")

    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["templates"]) == 0


@pytest.mark.asyncio
async def test_search_combined_with_category(
    client: AsyncClient, multiple_templates: list[Template]
) -> None:
    """Test search combined with category filter."""
    # Search "bot" but only in telegram_bot category
    response = await client.get("/api/templates?search=bot&category=telegram_bot")
    assert response.status_code == 200
    data = response.json()["data"]
    templates = data["templates"]

    assert len(templates) == 2
    for template in templates:
        assert template["category"] == "telegram_bot"

    # Search "service" in api_service category
    response = await client.get("/api/templates?search=service&category=api_service")
    assert response.status_code == 200
    data = response.json()["data"]
    templates = data["templates"]

    assert len(templates) == 1
    assert templates[0]["slug"] == "api-service"


# =============================================================================
# User Story 4: View Template Details
# =============================================================================


@pytest.mark.asyncio
async def test_get_template_by_id(client: AsyncClient, test_template: Template) -> None:
    """Test GET /api/templates/{id} returns template details by UUID."""
    response = await client.get(f"/api/templates/{test_template.id}")

    assert response.status_code == 200
    data = response.json()["data"]

    assert data["id"] == str(test_template.id)
    assert data["name"] == test_template.name
    assert data["slug"] == test_template.slug
    assert data["category"] == test_template.category
    assert data["credit_cost"] == test_template.credit_cost
    assert "config_schema" in data
    assert data["config_schema"]["type"] == "object"
    assert "features" in data
    assert "tags" in data
    assert "usage_count" in data


@pytest.mark.asyncio
async def test_get_template_by_slug(client: AsyncClient, test_template: Template) -> None:
    """Test GET /api/templates/{slug} returns template details by slug."""
    response = await client.get(f"/api/templates/{test_template.slug}")

    assert response.status_code == 200
    data = response.json()["data"]

    assert data["id"] == str(test_template.id)
    assert data["slug"] == test_template.slug


@pytest.mark.asyncio
async def test_get_template_not_found(client: AsyncClient) -> None:
    """Test GET /api/templates/{id} returns 404 for non-existent template."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/templates/{fake_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_inactive_template_returns_404(
    client: AsyncClient, inactive_template: Template
) -> None:
    """Test GET /api/templates/{id} returns 404 for inactive template."""
    response = await client.get(f"/api/templates/{inactive_template.id}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_template_has_valid_schema(
    client: AsyncClient, test_template: Template
) -> None:
    """Test template config_schema is valid JSON Schema structure."""
    response = await client.get(f"/api/templates/{test_template.id}")

    assert response.status_code == 200
    data = response.json()["data"]
    schema = data["config_schema"]

    # Verify JSON Schema structure
    assert schema["type"] == "object"
    assert "properties" in schema
    assert "required" in schema


# =============================================================================
# User Story 5: View Template Usage Statistics
# =============================================================================


@pytest.mark.asyncio
async def test_usage_count_in_list(
    client: AsyncClient, multiple_templates: list[Template]
) -> None:
    """Test usage_count is included in template list response."""
    response = await client.get("/api/templates")

    assert response.status_code == 200
    data = response.json()["data"]
    templates = data["templates"]

    # All templates should have usage_count field
    for template in templates:
        assert "usage_count" in template
        assert isinstance(template["usage_count"], int)
        assert template["usage_count"] >= 0


@pytest.mark.asyncio
async def test_usage_count_in_detail(
    client: AsyncClient, test_template: Template
) -> None:
    """Test usage_count is included in template detail response."""
    response = await client.get(f"/api/templates/{test_template.id}")

    assert response.status_code == 200
    data = response.json()["data"]

    assert "usage_count" in data
    assert isinstance(data["usage_count"], int)
    assert data["usage_count"] >= 0


@pytest.mark.asyncio
async def test_increment_usage_count(
    db_session: AsyncSession, test_template: Template
) -> None:
    """Test increment_usage_count atomically increments the counter."""
    from api.src.templates.service import increment_usage_count

    initial_count = test_template.usage_count

    # Increment usage count
    await increment_usage_count(test_template.id, db_session)

    # Refresh template from database
    await db_session.refresh(test_template)

    assert test_template.usage_count == initial_count + 1

    # Increment again
    await increment_usage_count(test_template.id, db_session)
    await db_session.refresh(test_template)

    assert test_template.usage_count == initial_count + 2
