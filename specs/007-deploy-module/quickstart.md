# Quickstart: Deploy Module

**Feature Branch**: `007-deploy-module`
**Date**: 2026-02-05

## Prerequisites

1. Railway account с API token
2. Project в статусе `ready` с `generated_code`
3. BOT_TOKEN для Telegram бота

## Configuration

Добавить в `.env`:

```bash
RAILWAY_API_TOKEN=your-railway-api-token
```

## API Usage

### 1. Deploy Project

```bash
curl -X POST "http://localhost:8000/api/deployments/projects/{project_id}/deploy" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "railway",
    "env_variables": {
      "BOT_TOKEN": "123456:ABC..."
    }
  }'
```

Response:
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "platform": "railway",
  "status": "pending",
  "url": null,
  "created_at": "2026-02-05T12:00:00Z"
}
```

### 2. Check Deployment Status

```bash
curl "http://localhost:8000/api/deployments/{deployment_id}" \
  -H "Authorization: Bearer {access_token}"
```

Response (when active):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "platform": "railway",
  "status": "active",
  "url": "https://bot.up.railway.app",
  "deployed_at": "2026-02-05T12:05:00Z"
}
```

### 3. Get Deployment Logs

```bash
curl "http://localhost:8000/api/deployments/{deployment_id}/logs" \
  -H "Authorization: Bearer {access_token}"
```

Response:
```json
{
  "deployment_id": "uuid",
  "logs": "[2026-02-05T12:00:00Z] Starting build...\n[2026-02-05T12:02:00Z] Build completed",
  "status": "active"
}
```

### 4. Stop Deployment

```bash
curl -X DELETE "http://localhost:8000/api/deployments/{deployment_id}" \
  -H "Authorization: Bearer {access_token}"
```

Response: `204 No Content`

## Status Flow

```
User clicks Deploy
       ↓
POST /deploy → status: pending
       ↓
Railway creates project → status: building
       ↓
Railway deploys code → status: deploying
       ↓
Deployment complete → status: active, url: "https://..."
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 400: Project must be in 'ready' status | Project not generated | Complete AI generation first |
| 400: No generated code | Missing code | Generate project code |
| 500: Railway API error | Platform issue | Check Railway status, retry |
| Timeout after 5 minutes | Slow deployment | Check logs, contact support |

## Testing

```bash
# Run deploy module tests
cd backend
pytest tests/test_deploy.py -v
```

## File Structure

```
backend/app/deploy/
├── __init__.py
├── models.py       # Deployment model
├── schemas.py      # Pydantic schemas
├── service.py      # Business logic
├── railway.py      # Railway API client
└── routes.py       # FastAPI endpoints
```
