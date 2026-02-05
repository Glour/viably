# Quickstart: AI Code Generation Module

**Feature Branch**: `006-ai-generation`
**Date**: 2026-02-05

## Prerequisites

1. Backend сервер запущен (`uvicorn app.main:app`)
2. Redis запущен (`redis-server` или Docker)
3. Переменные окружения настроены

## Environment Setup

```bash
# Добавить в .env файл:
ANTHROPIC_API_KEY=sk-ant-api03-...

# Celery (опционально, если отличается от default)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Generation settings (опционально)
GENERATION_COST=10
GENERATION_MAX_TOKENS=8192
GENERATION_MODEL=claude-sonnet-4-20250514
```

## Install Dependencies

```bash
cd backend
pip install anthropic>=0.20.0 celery>=5.3.0 redis>=5.0.0
# или обновить requirements.txt и:
pip install -r requirements.txt
```

## Start Services

### Terminal 1: FastAPI Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Terminal 2: Celery Worker

```bash
cd backend
celery -A app.ai.worker.celery_app worker --loglevel=info
```

### Terminal 3: Redis (если не запущен)

```bash
redis-server
# или через Docker:
docker run -d -p 6379:6379 redis:alpine
```

## API Usage

### 1. Authenticate (get JWT token)

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Save token
TOKEN="eyJ..."
```

### 2. Create Project

```bash
# Get template ID first
curl http://localhost:8000/api/templates \
  -H "Authorization: Bearer $TOKEN"

# Create project with template
curl -X POST http://localhost:8000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Shop Bot",
    "template_id": "TEMPLATE_UUID_HERE",
    "config": {
      "bot_name": "ShopBot",
      "shop_name": "My Store",
      "products": ["Product 1", "Product 2"]
    }
  }'

# Save project ID
PROJECT_ID="..."
```

### 3. Trigger Generation

```bash
curl -X POST http://localhost:8000/api/projects/$PROJECT_ID/generate \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "id": "...",
#   "status": "generating",
#   ...
# }
```

### 4. Poll for Result

```bash
# Check status every 5 seconds
curl http://localhost:8000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"

# When status = "ready", generated_code will contain files
# When status = "error", error_message will explain what happened
```

### 5. View Generated Code

```bash
# Get project with generated code
curl http://localhost:8000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.generated_code.files'

# Output:
# {
#   "main.py": "import asyncio\n...",
#   "handlers/start.py": "...",
#   "requirements.txt": "aiogram>=3.0.0\n..."
# }
```

## Admin: Check AI Status

```bash
# Requires admin user
curl http://localhost:8000/api/ai/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Response:
# {
#   "status": "operational",
#   "model": "claude-sonnet-4-20250514"
# }
```

## Error Handling

### Insufficient Credits

```bash
# Response (422):
{
  "detail": "Insufficient credits. Required: 10, Available: 5"
}
```

### Project Not in Draft

```bash
# Response (400):
{
  "detail": "Generation can only be triggered for draft projects"
}
```

### Generation Failed (check project)

```bash
# Project response when status = "error":
{
  "id": "...",
  "status": "error",
  "error_message": "No code files extracted from AI response"
}
# Credits are automatically refunded on error
```

## Testing

```bash
cd backend
pytest tests/test_ai.py -v
```

## Monitoring Celery

```bash
# View active tasks
celery -A app.ai.worker.celery_app inspect active

# View registered tasks
celery -A app.ai.worker.celery_app inspect registered

# Flower dashboard (optional)
pip install flower
celery -A app.ai.worker.celery_app flower --port=5555
```
