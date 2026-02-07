# REST API Contracts: Generation & Deploy Control

**Feature**: 017-websocket-generation
**Date**: 2026-02-07
**Base URL**: `http://localhost:8000/api` (development)

## Overview

Данный документ описывает REST endpoints для контроля генерации и деплоя. Actual generation/deploy progress передаётся через WebSocket (см. `websocket-messages.md`).

## Authentication

**Method**: JWT Bearer Token

**Header**:
```
Authorization: Bearer <access_token>
```

**Token Source**: Получен через existing auth flow (модуль 015-api-client-auth).

---

## 1. Start Generation

**Endpoint**: `POST /api/projects/{project_id}/generate`

**Description**: Запускает процесс генерации кода для проекта. Backend возвращает 202 Accepted и начинает отправлять progress updates через WebSocket.

**Path Parameters**:
- `project_id` (string, UUID, required) - ID проекта

**Request Body**:
```json
{
  "config": {
    "template_id": "string (UUID)",
    "name": "string",
    "description": "string",
    "features": ["string"],
    "custom_prompt": "string | null"
  }
}
```

**Request Body Fields**:
- `config.template_id` (required) - ID шаблона для генерации
- `config.name` (required) - Название проекта
- `config.description` (optional) - Описание проекта
- `config.features` (optional) - Массив выбранных фич из шаблона
- `config.custom_prompt` (optional) - Свободный текст для кастомизации (free-text input mode)

**Response: 202 Accepted**
```json
{
  "data": {
    "project_id": "uuid",
    "status": "generating",
    "message": "Generation started. Connect to WebSocket for progress updates."
  }
}
```

**Response: 400 Bad Request** (validation error)
```json
{
  "detail": [
    {
      "loc": ["body", "config", "template_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Response: 402 Payment Required** (insufficient credits)
```json
{
  "detail": "Insufficient credits. Required: 5, available: 2"
}
```

**Response: 409 Conflict** (generation already in progress)
```json
{
  "detail": "Generation already in progress for this project"
}
```

**WebSocket Behavior**:
- После успешного 202 response, client должен подключиться к WebSocket
- Backend начнёт отправлять `generation_progress` messages
- Completion: `generation_complete` или `generation_error` message

**Frontend Implementation**:
```typescript
// File: frontend/lib/api/generation.ts
import { api } from './client'
import type { ProjectConfig } from '@/types'

export async function startGeneration(
  projectId: string,
  config: ProjectConfig
): Promise<void> {
  await api.post(`projects/${projectId}/generate`, {
    json: { config }
  })
  // No return value - status will come via WebSocket
}
```

---

## 2. Cancel Generation

**Endpoint**: `POST /api/projects/{project_id}/cancel-generation`

**Description**: Отменяет текущий процесс генерации. Backend останавливает генерацию и возвращает кредиты пользователю (если списание уже произошло).

**Path Parameters**:
- `project_id` (string, UUID, required) - ID проекта

**Request Body**: None (empty body)

**Response: 200 OK**
```json
{
  "data": {
    "project_id": "uuid",
    "status": "idle",
    "message": "Generation cancelled",
    "credits_refunded": 5
  }
}
```

**Response: 404 Not Found**
```json
{
  "detail": "No active generation for this project"
}
```

**WebSocket Behavior**:
- После cancellation, WebSocket connection остаётся открытым
- Но новые `generation_progress` messages не будут отправляться
- Client должен закрыть WS connection самостоятельно (graceful disconnect)

**Frontend Implementation**:
```typescript
// File: frontend/lib/api/generation.ts
export async function cancelGeneration(
  projectId: string
): Promise<{ creditsRefunded: number }> {
  const response = await api.post(`projects/${projectId}/cancel-generation`).json<{
    data: { credits_refunded: number }
  }>()
  return { creditsRefunded: response.data.credits_refunded }
}
```

---

## 3. Start Deploy

**Endpoint**: `POST /api/projects/{project_id}/deploy`

**Description**: Запускает процесс деплоя сгенерированного проекта на Railway. Backend возвращает 202 Accepted и начинает отправлять deploy progress через WebSocket.

**Path Parameters**:
- `project_id` (string, UUID, required) - ID проекта

**Request Body**:
```json
{
  "platform": "railway",
  "env_variables": {
    "TELEGRAM_BOT_TOKEN": "string",
    "DATABASE_URL": "string (optional)",
    "CUSTOM_ENV_VAR": "string (optional)"
  }
}
```

**Request Body Fields**:
- `platform` (required) - Платформа для деплоя (currently only "railway")
- `env_variables` (required) - Environment variables для deployed app
  - `TELEGRAM_BOT_TOKEN` (required) - Telegram bot token
  - Other variables зависят от template requirements

**Response: 202 Accepted**
```json
{
  "data": {
    "project_id": "uuid",
    "deploy_id": "uuid",
    "status": "deploying",
    "message": "Deploy started. Connect to WebSocket for progress updates."
  }
}
```

**Response: 400 Bad Request** (validation error)
```json
{
  "detail": [
    {
      "loc": ["body", "env_variables", "TELEGRAM_BOT_TOKEN"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Response: 409 Conflict** (no generated code to deploy)
```json
{
  "detail": "Project has no generated code. Run generation first."
}
```

**Response: 409 Conflict** (deploy already in progress)
```json
{
  "detail": "Deploy already in progress for this project"
}
```

**WebSocket Behavior**:
- После успешного 202 response, WebSocket уже подключён (same connection как для generation)
- Backend начнёт отправлять `deploy_progress` messages
- Completion: `deploy_complete` или `deploy_error` message

**Frontend Implementation**:
```typescript
// File: frontend/lib/api/generation.ts
export async function startDeploy(
  projectId: string,
  envVariables: Record<string, string>
): Promise<void> {
  await api.post(`projects/${projectId}/deploy`, {
    json: {
      platform: 'railway',
      env_variables: envVariables
    }
  })
  // No return value - status will come via WebSocket
}
```

---

## 4. Get Project Code (Generated Files)

**Endpoint**: `GET /api/projects/{project_id}/code`

**Description**: Получить список сгенерированных файлов для проекта. Используется для отображения в Monaco editor после successful generation.

**Path Parameters**:
- `project_id` (string, UUID, required) - ID проекта

**Query Parameters**: None

**Response: 200 OK**
```json
{
  "data": {
    "project_id": "uuid",
    "generated_at": "2026-02-07T12:34:56Z",
    "files": [
      {
        "path": "handlers/shop.py",
        "content": "async def handle_catalog(message):\n    ...",
        "language": "python"
      },
      {
        "path": "config.yaml",
        "content": "bot:\n  token: ${TELEGRAM_BOT_TOKEN}",
        "language": "yaml"
      }
    ]
  }
}
```

**Response: 404 Not Found**
```json
{
  "detail": "No generated code for this project"
}
```

**Frontend Implementation**:
```typescript
// File: frontend/lib/api/generation.ts
import type { GeneratedFile } from '@/types/websocket'

export async function getProjectCode(
  projectId: string
): Promise<GeneratedFile[]> {
  const response = await api.get(`projects/${projectId}/code`).json<{
    data: { files: GeneratedFile[] }
  }>()
  return response.data.files
}
```

**Note**: Эти файлы также приходят через `generation_complete` WebSocket message. Этот endpoint нужен для случаев, когда пользователь перезагрузил страницу после generation complete.

---

## 5. Download Project as ZIP

**Endpoint**: `GET /api/projects/{project_id}/download`

**Description**: Скачать весь сгенерированный код как ZIP архив. Alternative к deploy - пользователь может скачать код локально.

**Path Parameters**:
- `project_id` (string, UUID, required) - ID проекта

**Query Parameters**: None

**Response: 200 OK**
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="project-{name}.zip"`
- Body: Binary ZIP file

**Response: 404 Not Found**
```json
{
  "detail": "No generated code for this project"
}
```

**Frontend Implementation**:
```typescript
// File: frontend/lib/api/generation.ts
export async function downloadProjectZip(
  projectId: string,
  projectName: string
): Promise<void> {
  const response = await api.get(`projects/${projectId}/download`, {
    headers: { Accept: 'application/zip' }
  })

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.zip`
  a.click()
  window.URL.revokeObjectURL(url)
}
```

---

## Error Handling

**Common Error Responses**:

### 401 Unauthorized
```json
{
  "detail": "Invalid or expired token"
}
```
**Client Action**: Attempt token refresh via existing auth flow (module 015).

### 403 Forbidden
```json
{
  "detail": "Account suspended"
}
```
**Client Action**: Redirect to login page.

### 429 Too Many Requests
```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds."
}
```
**Client Action**: Show toast notification, disable action buttons temporarily.

### 500 Internal Server Error
```json
{
  "detail": "Internal server error. Please try again later."
}
```
**Client Action**: Show generic error message, log to error tracking service.

### 503 Service Unavailable
```json
{
  "detail": "Service temporarily unavailable. Maintenance in progress."
}
```
**Client Action**: Show maintenance message.

---

## Integration with Existing API Client

**File**: `frontend/lib/api/client.ts` (already exists)

**Changes Required**: None

Existing `api` client from module 015 already handles:
- ✅ JWT authentication (Bearer token in header)
- ✅ Token refresh on 401
- ✅ Error parsing and mapping
- ✅ Type-safe response unwrapping

New functions будут использовать existing `api` instance:
```typescript
import { api } from './client'

export async function startGeneration(...) {
  await api.post(...)  // Uses existing auth, error handling
}
```

---

## Summary

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/projects/{id}/generate` | POST | Start generation | 202 Accepted |
| `/api/projects/{id}/cancel-generation` | POST | Cancel generation | 200 OK |
| `/api/projects/{id}/deploy` | POST | Start deploy | 202 Accepted |
| `/api/projects/{id}/code` | GET | Get generated files | 200 OK (JSON) |
| `/api/projects/{id}/download` | GET | Download ZIP | 200 OK (binary) |

**Key Points**:
- Все async operations возвращают 202 Accepted
- Actual progress передаётся через WebSocket
- Existing auth infrastructure переиспользуется
- Error handling унифицирован с existing API patterns
