# Backend Module: Templates

**Module:** `app/templates`  
**Status:** Not Started  
**Priority:** P0 (Must have for MVP)  
**Estimated Time:** 2 days  
**Dependencies:** None

---

## 📋 Overview

The Templates module manages bot and API service templates that users can customize and generate.

**Responsibilities:**
- List available templates
- Get template details with config schema
- Template categorization (telegram_bot, api_service)
- Usage tracking
- Template seeding

---

## 🔧 Dependencies

```python
# requirements.txt additions
sqlalchemy>=2.0
pydantic>=2.5.0
```

---

## 🗄️ Database Models

### Template Model

File: `app/templates/models.py`

```python
from sqlalchemy import Column, String, Integer, Boolean, ARRAY, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Template(Base):
    __tablename__ = "templates"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Template info
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)  # telegram_bot, api_service
    
    # Pricing
    credit_cost = Column(Integer, nullable=False, default=0)
    
    # Configuration schema (JSON Schema format)
    config_schema = Column(JSONB, nullable=False, default={})
    
    # Code template and prompts
    code_template = Column(JSONB, nullable=True, default={})
    prompt_template = Column(Text, nullable=False)
    
    # Metadata
    preview_image_url = Column(Text, nullable=True)
    features = Column(ARRAY(Text), default=[])
    tags = Column(ARRAY(Text), default=[])
    
    # Stats
    usage_count = Column(Integer, default=0, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Ordering
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

---

## 📝 Pydantic Schemas

File: `app/templates/schemas.py`

```python
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class TemplateListItem(BaseModel):
    """Template in list view (compact)"""
    id: UUID
    name: str
    slug: str
    description: str | None
    category: str
    credit_cost: int
    preview_image_url: str | None
    features: list[str]
    tags: list[str]
    usage_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TemplateDetail(BaseModel):
    """Full template details"""
    id: UUID
    name: str
    slug: str
    description: str | None
    category: str
    credit_cost: int
    config_schema: dict  # JSON Schema
    preview_image_url: str | None
    features: list[str]
    tags: list[str]
    usage_count: int
    example_config: dict | None = None  # Example values for config
    created_at: datetime
    
    class Config:
        from_attributes = True

class TemplateCreate(BaseModel):
    """Schema for creating template (admin)"""
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    description: str | None = None
    category: str = Field(..., pattern="^(telegram_bot|api_service)$")
    credit_cost: int = Field(default=0, ge=0)
    config_schema: dict
    code_template: dict | None = None
    prompt_template: str
    preview_image_url: str | None = None
    features: list[str] = []
    tags: list[str] = []
    sort_order: int = 0
    is_active: bool = True
```

---

## 🛣️ API Endpoints

File: `app/templates/routes.py`

### GET /api/templates

List all active templates (optionally filtered).

**Query Parameters:**
- `category` (optional): Filter by category (telegram_bot, api_service)
- `search` (optional): Search in name/description

**Response:** 200 OK
```json
{
  "data": {
    "templates": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Shop Bot",
        "slug": "shop-bot",
        "description": "E-commerce bot with catalog and cart",
        "category": "telegram_bot",
        "credit_cost": 5,
        "preview_image_url": "https://...",
        "features": [
          "Product catalog",
          "Shopping cart",
          "Payment integration"
        ],
        "tags": ["telegram", "ecommerce", "shop"],
        "usage_count": 150,
        "created_at": "2026-01-01T00:00:00Z"
      },
      {
        "id": "...",
        "name": "FAQ Bot",
        "slug": "faq-bot",
        "description": "Simple Q&A bot",
        "category": "telegram_bot",
        "credit_cost": 3,
        "features": ["Inline keyboard", "Quick answers"],
        "tags": ["telegram", "simple"],
        "usage_count": 320,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/templates/{id}

Get full template details including config schema.

**Response:** 200 OK
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Shop Bot",
    "slug": "shop-bot",
    "description": "Full-featured e-commerce bot",
    "category": "telegram_bot",
    "credit_cost": 5,
    "config_schema": {
      "type": "object",
      "properties": {
        "shop_name": {
          "type": "string",
          "title": "Shop Name",
          "description": "Name of your shop"
        },
        "products": {
          "type": "array",
          "title": "Products",
          "items": {
            "type": "object",
            "properties": {
              "name": {"type": "string"},
              "price": {"type": "number"}
            }
          }
        },
        "payment_provider": {
          "type": "string",
          "enum": ["yookassa", "stripe"],
          "title": "Payment Provider"
        }
      },
      "required": ["shop_name", "products"]
    },
    "preview_image_url": "https://...",
    "features": ["Catalog", "Cart", "Payments"],
    "tags": ["telegram", "ecommerce"],
    "usage_count": 150,
    "example_config": {
      "shop_name": "Demo Store",
      "products": [
        {"name": "Item 1", "price": 1000}
      ],
      "payment_provider": "yookassa"
    },
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

**Errors:**
- 404: Template not found

---

## 💼 Business Logic

File: `app/templates/service.py`

### Core Functions:

```python
async def list_templates(
    category: str | None = None,
    search: str | None = None,
    db: AsyncSession = None
) -> list[Template]:
    """
    List all active templates.
    
    Args:
        category: Filter by category (telegram_bot, api_service)
        search: Search in name/description (case-insensitive)
        db: Database session
    
    Returns:
        List of templates sorted by sort_order
    """

async def get_template_by_id(
    template_id: UUID,
    db: AsyncSession
) -> Template:
    """
    Get template by ID.
    
    Raises:
        HTTPException 404: If template not found or inactive
    """

async def get_template_by_slug(
    slug: str,
    db: AsyncSession
) -> Template:
    """
    Get template by slug.
    
    Raises:
        HTTPException 404: If template not found or inactive
    """

async def increment_usage_count(
    template_id: UUID,
    db: AsyncSession
) -> None:
    """
    Increment template usage counter.
    Called when project is created with this template.
    """

async def create_template(
    template_data: TemplateCreate,
    db: AsyncSession
) -> Template:
    """
    Create new template (admin only - for future).
    
    Validates:
    - Unique slug
    - Valid config_schema (JSON Schema format)
    - Valid category
    
    Returns:
        Created template
    """
```

---

## 🌱 Seed Data

File: `app/templates/seed.py`

Initial templates for MVP (will be inserted via migration or script):

```python
INITIAL_TEMPLATES = [
    {
        "name": "FAQ Bot",
        "slug": "faq-bot",
        "description": "Simple Q&A bot with inline buttons for quick answers",
        "category": "telegram_bot",
        "credit_cost": 3,
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {
                    "type": "string",
                    "title": "Bot Name",
                    "description": "Display name for your bot"
                },
                "faq_items": {
                    "type": "array",
                    "title": "FAQ Items",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "answer": {"type": "string"}
                        },
                        "required": ["question", "answer"]
                    },
                    "minItems": 1
                }
            },
            "required": ["bot_name", "faq_items"]
        },
        "prompt_template": "Create a Telegram FAQ bot named '{{bot_name}}' with these Q&A pairs: {{faq_items}}. Use aiogram 3.x, inline keyboards for questions, and clean async/await code.",
        "features": ["Inline keyboard", "Quick answers", "Easy setup"],
        "tags": ["telegram", "simple", "faq"],
        "sort_order": 1,
        "is_active": True
    },
    {
        "name": "Shop Bot",
        "slug": "shop-bot",
        "description": "E-commerce bot with product catalog, shopping cart, and payment integration",
        "category": "telegram_bot",
        "credit_cost": 5,
        "config_schema": {
            "type": "object",
            "properties": {
                "shop_name": {
                    "type": "string",
                    "title": "Shop Name"
                },
                "products": {
                    "type": "array",
                    "title": "Products",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "price": {"type": "number"},
                            "image_url": {"type": "string"}
                        },
                        "required": ["name", "price"]
                    }
                },
                "payment_provider": {
                    "type": "string",
                    "enum": ["yookassa", "stripe"],
                    "title": "Payment Provider"
                },
                "currency": {
                    "type": "string",
                    "default": "RUB",
                    "title": "Currency"
                }
            },
            "required": ["shop_name", "products", "payment_provider"]
        },
        "prompt_template": "Create a Telegram shop bot for '{{shop_name}}' with products: {{products}}. Implement: product catalog with pagination, shopping cart, {{payment_provider}} payment integration, order management. Use aiogram 3.x, SQLite for data, and best practices.",
        "features": [
            "Product catalog",
            "Shopping cart",
            "Payment integration",
            "Order management"
        ],
        "tags": ["telegram", "ecommerce", "shop"],
        "sort_order": 2,
        "is_active": True
    },
    {
        "name": "Notification Bot",
        "slug": "notification-bot",
        "description": "Send scheduled notifications and broadcasts to subscribers",
        "category": "telegram_bot",
        "credit_cost": 3,
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "title": "Bot Name"},
                "notification_types": {
                    "type": "array",
                    "title": "Notification Types",
                    "items": {"type": "string"}
                }
            },
            "required": ["bot_name"]
        },
        "prompt_template": "Create a Telegram notification bot '{{bot_name}}' with subscription management, scheduled notifications, and broadcast features. Use aiogram 3.x, APScheduler for scheduling, SQLite for subscribers.",
        "features": [
            "Subscription management",
            "Scheduled messages",
            "Broadcast to all users"
        ],
        "tags": ["telegram", "notifications", "scheduler"],
        "sort_order": 3,
        "is_active": True
    },
    {
        "name": "Support Bot",
        "slug": "support-bot",
        "description": "Customer support bot with ticket system and admin panel",
        "category": "telegram_bot",
        "credit_cost": 6,
        "config_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "title": "Company Name"},
                "support_categories": {
                    "type": "array",
                    "title": "Support Categories",
                    "items": {"type": "string"}
                },
                "admin_chat_id": {
                    "type": "string",
                    "title": "Admin Telegram Chat ID"
                }
            },
            "required": ["company_name", "admin_chat_id"]
        },
        "prompt_template": "Create a support bot for '{{company_name}}' with ticket system, categories: {{support_categories}}, admin notifications to {{admin_chat_id}}. Features: ticket creation, status tracking, admin replies, auto-close. Use aiogram 3.x, PostgreSQL.",
        "features": [
            "Ticket system",
            "Admin panel",
            "Status tracking",
            "Auto-replies"
        ],
        "tags": ["telegram", "support", "tickets"],
        "sort_order": 4,
        "is_active": True
    },
    {
        "name": "Poll Bot",
        "slug": "poll-bot",
        "description": "Create and manage polls with analytics",
        "category": "telegram_bot",
        "credit_cost": 4,
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "title": "Bot Name"},
                "default_poll_type": {
                    "type": "string",
                    "enum": ["quiz", "regular"],
                    "title": "Default Poll Type"
                }
            },
            "required": ["bot_name"]
        },
        "prompt_template": "Create a Telegram poll bot '{{bot_name}}' with poll creation, voting, results analytics, and export. Support {{default_poll_type}} polls. Use aiogram 3.x, SQLite for data, matplotlib for charts.",
        "features": [
            "Poll creation",
            "Real-time results",
            "Analytics dashboard",
            "Export results"
        ],
        "tags": ["telegram", "polls", "analytics"],
        "sort_order": 5,
        "is_active": True
    },
    {
        "name": "Booking Bot",
        "slug": "booking-bot",
        "description": "Appointment booking system with calendar integration",
        "category": "telegram_bot",
        "credit_cost": 8,
        "config_schema": {
            "type": "object",
            "properties": {
                "business_name": {"type": "string", "title": "Business Name"},
                "services": {
                    "type": "array",
                    "title": "Services",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "duration_minutes": {"type": "number"},
                            "price": {"type": "number"}
                        }
                    }
                },
                "working_hours": {
                    "type": "object",
                    "title": "Working Hours",
                    "properties": {
                        "start": {"type": "string"},
                        "end": {"type": "string"}
                    }
                }
            },
            "required": ["business_name", "services"]
        },
        "prompt_template": "Create a booking bot for '{{business_name}}' with services: {{services}}, working hours: {{working_hours}}. Features: calendar view, time slots, booking confirmation, reminders, cancellation. Use aiogram 3.x, PostgreSQL, APScheduler.",
        "features": [
            "Calendar interface",
            "Time slot management",
            "Booking confirmation",
            "Reminders",
            "Admin dashboard"
        ],
        "tags": ["telegram", "booking", "calendar"],
        "sort_order": 6,
        "is_active": True
    }
]

async def seed_templates(db: AsyncSession):
    """Seed initial templates into database"""
    for template_data in INITIAL_TEMPLATES:
        template = Template(**template_data)
        db.add(template)
    await db.commit()
```

---

## 📁 File Structure

```
app/templates/
├── __init__.py          # Module exports
├── models.py            # SQLAlchemy Template model
├── schemas.py           # Pydantic schemas
├── routes.py            # FastAPI routes
├── service.py           # Business logic
└── seed.py              # Initial template data
```

---

## ✅ Tests

File: `tests/test_templates.py`

### Required Tests:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_templates(client: AsyncClient):
    """Test GET /api/templates"""
    response = await client.get("/api/templates")
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert "templates" in data
    assert len(data["templates"]) > 0

@pytest.mark.asyncio
async def test_list_templates_by_category(client: AsyncClient):
    """Test filtering by category"""
    response = await client.get("/api/templates?category=telegram_bot")
    
    assert response.status_code == 200
    data = response.json()["data"]
    for template in data["templates"]:
        assert template["category"] == "telegram_bot"

@pytest.mark.asyncio
async def test_search_templates(client: AsyncClient):
    """Test search functionality"""
    response = await client.get("/api/templates?search=shop")
    
    assert response.status_code == 200
    data = response.json()["data"]
    # Should find "Shop Bot"
    template_names = [t["name"] for t in data["templates"]]
    assert any("Shop" in name for name in template_names)

@pytest.mark.asyncio
async def test_get_template_by_id(client: AsyncClient, template_id: str):
    """Test GET /api/templates/{id}"""
    response = await client.get(f"/api/templates/{template_id}")
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["id"] == template_id
    assert "config_schema" in data
    assert "example_config" in data

@pytest.mark.asyncio
async def test_get_template_not_found(client: AsyncClient):
    """Test 404 for non-existent template"""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/templates/{fake_id}")
    
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_template_has_valid_schema(client: AsyncClient, template_id: str):
    """Test config_schema is valid JSON Schema"""
    response = await client.get(f"/api/templates/{template_id}")
    
    data = response.json()["data"]
    schema = data["config_schema"]
    
    assert schema["type"] == "object"
    assert "properties" in schema
    assert "required" in schema

@pytest.mark.asyncio
async def test_templates_sorted_by_order(client: AsyncClient):
    """Test templates are returned in sort_order"""
    response = await client.get("/api/templates")
    
    data = response.json()["data"]["templates"]
    # Verify order (FAQ Bot should be first, sort_order=1)
    assert data[0]["slug"] == "faq-bot"
```

---

## 📊 Success Criteria

- [ ] Can list all active templates
- [ ] Can filter by category
- [ ] Can search by name/description
- [ ] Get template returns full details
- [ ] Config schema is valid JSON Schema
- [ ] Templates sorted by sort_order
- [ ] Usage count tracked correctly
- [ ] Inactive templates not shown
- [ ] 404 for non-existent template
- [ ] All 6 seed templates created
- [ ] All tests pass with >90% coverage

---

## 🚀 Implementation Order

1. **Models** (1 hour)
   - Create Template model
   - Add indexes

2. **Schemas** (1 hour)
   - TemplateListItem
   - TemplateDetail
   - TemplateCreate

3. **Service** (2 hours)
   - list_templates()
   - get_template_by_id()
   - get_template_by_slug()
   - increment_usage_count()

4. **Routes** (2 hours)
   - GET /templates
   - GET /templates/{id}

5. **Seed Data** (2 hours)
   - Create seed.py with 6 templates
   - Write migration or script

6. **Tests** (3 hours)
   - All test cases
   - >90% coverage

7. **Integration** (1 hour)
   - Add to main.py
   - Run seed script

**Total:** ~12 hours (2 days)

---

## 🔍 Example Usage

```python
# In main.py
from app.templates.routes import router as templates_router

app.include_router(templates_router, prefix="/api/templates", tags=["templates"])

# Seed templates on startup (dev only)
from app.templates.seed import seed_templates

@app.on_event("startup")
async def startup():
    async with get_db() as db:
        # Check if templates exist
        count = await db.execute(select(func.count(Template.id)))
        if count.scalar() == 0:
            await seed_templates(db)
```

---

**Module Status:** Ready for implementation  
**Last Updated:** February 4, 2026
