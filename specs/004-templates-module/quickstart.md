# Quickstart: Templates Module

**Feature**: 004-templates-module
**Date**: 2026-02-04

## Prerequisites

- Python 3.12+
- PostgreSQL 14+ (development) or SQLite (testing)
- Virtual environment activated

## Setup

### 1. Install Dependencies

No new dependencies required. Existing `requirements.txt` covers all needs.

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Module Structure

```bash
mkdir -p backend/app/templates
touch backend/app/templates/__init__.py
touch backend/app/templates/models.py
touch backend/app/templates/schemas.py
touch backend/app/templates/service.py
touch backend/app/templates/routes.py
touch backend/app/templates/seed.py
```

### 3. Run Migration

After implementing models.py:

```bash
cd backend
alembic revision --autogenerate -m "add templates table"
alembic upgrade head
```

### 4. Seed Templates

After implementing seed.py and running migration:

```bash
cd backend
python -c "
import asyncio
from app.core.database import async_session_maker
from app.templates.seed import seed_templates

async def main():
    async with async_session_maker() as session:
        await seed_templates(session)
        print('Templates seeded successfully')

asyncio.run(main())
"
```

### 5. Register Router

In `backend/app/main.py`, add:

```python
from app.templates.routes import router as templates_router

app.include_router(templates_router, prefix="/api/templates", tags=["templates"])
```

### 6. Run Server

```bash
cd backend
uvicorn app.main:app --reload
```

## API Usage

### List Templates

```bash
# All templates
curl http://localhost:8000/api/templates

# Filter by category
curl "http://localhost:8000/api/templates?category=telegram_bot"

# Search
curl "http://localhost:8000/api/templates?search=shop"
```

### Get Template Details

```bash
# By UUID
curl http://localhost:8000/api/templates/550e8400-e29b-41d4-a716-446655440001

# By slug
curl http://localhost:8000/api/templates/faq-bot
```

## Testing

### Run All Tests

```bash
cd backend
pytest tests/test_templates.py -v
```

### Run with Coverage

```bash
cd backend
pytest tests/test_templates.py -v --cov=app/templates --cov-report=term-missing
```

### Expected Test Cases

| Test | Description |
|------|-------------|
| `test_list_templates` | GET /api/templates returns template list |
| `test_list_templates_by_category` | Category filter works correctly |
| `test_search_templates` | Search in name/description works |
| `test_get_template_by_id` | GET /api/templates/{uuid} returns details |
| `test_get_template_by_slug` | GET /api/templates/{slug} returns details |
| `test_get_template_not_found` | 404 for non-existent template |
| `test_inactive_template_not_in_list` | Inactive templates hidden from list |
| `test_inactive_template_returns_404` | Inactive template direct access returns 404 |
| `test_template_has_valid_schema` | config_schema is valid JSON Schema |
| `test_templates_sorted_by_order` | Templates sorted by sort_order |

## File Structure

```
backend/
├── app/
│   ├── templates/
│   │   ├── __init__.py      # Export router, models
│   │   ├── models.py        # Template SQLAlchemy model
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── service.py       # Business logic functions
│   │   ├── routes.py        # FastAPI endpoints
│   │   └── seed.py          # Initial template data
│   └── main.py              # Add templates router
├── alembic/
│   └── versions/
│       └── xxx_add_templates_table.py
└── tests/
    └── test_templates.py    # Template tests
```

## Common Issues

### 1. JSONB Not Supported in SQLite

SQLAlchemy automatically maps JSONB to JSON for SQLite. No action needed.

### 2. ARRAY Type in SQLite

For testing, SQLAlchemy maps PostgreSQL ARRAY to JSON. Arrays are stored as JSON arrays.

### 3. Migration Conflicts

If migration fails:
```bash
alembic downgrade -1
alembic upgrade head
```

### 4. Seed Data Already Exists

The seed script should check for existing data:
```python
# In seed.py
existing = await session.execute(select(Template).limit(1))
if existing.scalar_one_or_none():
    return  # Already seeded
```

## Validation Checklist

After implementation, verify:

- [ ] `GET /api/templates` returns template list
- [ ] `GET /api/templates?category=telegram_bot` filters correctly
- [ ] `GET /api/templates?search=bot` returns matching templates
- [ ] `GET /api/templates/{uuid}` returns full details with config_schema
- [ ] `GET /api/templates/{slug}` works same as UUID
- [ ] `GET /api/templates/nonexistent` returns 404
- [ ] Inactive templates not visible
- [ ] All 6 seed templates present
- [ ] Type-check passes: `mypy app/templates`
- [ ] Tests pass: `pytest tests/test_templates.py`
