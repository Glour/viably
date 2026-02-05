# Quickstart: Projects Module

**Feature**: 005-projects-module
**Branch**: `005-projects-module`

---

## Prerequisites

- Python 3.12+
- PostgreSQL (или SQLite для тестов)
- Реализованы модули: auth, users, templates, credits

---

## Setup

### 1. Установка зависимости

```bash
cd backend
pip install jsonschema>=4.20.0
```

Или добавить в `requirements.txt`:
```
jsonschema>=4.20.0
```

### 2. Создание миграции

```bash
cd backend
alembic revision --autogenerate -m "add_projects_table"
alembic upgrade head
```

---

## Project Structure

```
backend/app/projects/
├── __init__.py       # Package init, exports
├── models.py         # SQLAlchemy model
├── schemas.py        # Pydantic schemas
├── service.py        # Business logic
└── routes.py         # FastAPI endpoints
```

---

## Quick API Reference

### Create Project

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Bot",
    "description": "Test bot",
    "template_id": "uuid-here",
    "config": {"bot_name": "TestBot"}
  }'
```

### List Projects

```bash
curl http://localhost:8000/api/projects?page=1&per_page=20&status=draft \
  -H "Authorization: Bearer $TOKEN"
```

### Get Project

```bash
curl http://localhost:8000/api/projects/{project_id} \
  -H "Authorization: Bearer $TOKEN"
```

### Update Project

```bash
curl -X PATCH http://localhost:8000/api/projects/{project_id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "is_public": true}'
```

### Delete Project

```bash
curl -X DELETE http://localhost:8000/api/projects/{project_id} \
  -H "Authorization: Bearer $TOKEN"
```

### Trigger Generation

```bash
curl -X POST http://localhost:8000/api/projects/{project_id}/generate \
  -H "Authorization: Bearer $TOKEN"
```

### View Public Project

```bash
curl http://localhost:8000/api/projects/public/{project_id}
```

---

## Running Tests

```bash
cd backend
pytest tests/test_projects.py -v
```

---

## Integration Points

### With Templates Module

```python
from app.templates.service import get_template_by_id, increment_usage_count

# При создании проекта:
template = await get_template_by_id(data.template_id, db)
# Валидация config против template.config_schema
# increment_usage_count после успешного создания
```

### With Credits Module

```python
from app.credits.service import deduct_credits

# При запуске генерации:
await deduct_credits(user_id, template.credit_cost, project_id, db)
```

### With AI Module (future)

```python
# Заглушка в текущей версии:
async def trigger_generation(project_id, user_id):
    # TODO: вызов AI модуля
    # await ai_service.generate(project_id)
    pass
```

---

## Status Flow

```
draft ─── generate ───> generating ─── success ───> ready
                             │
                             └── error ───> error
```

---

## Common Issues

### "Template not found"
- Убедитесь, что template_id существует и is_active=True

### "Config validation failed"
- Проверьте config против template.config_schema

### "Project not in draft status"
- Генерация возможна только из статуса draft
