# Mock API Contracts for E2E Tests

**Branch**: `018-testing-polish`
**Date**: 2026-02-08

## Overview

These contracts define the mock API responses used by Playwright tests. They mirror the real API contracts from previous modules (001-auth, 003-credits, 004-templates, 005-projects, 006-ai-generation, 007-deploy).

## Auth Endpoints

### POST /api/auth/register
```json
Request:
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "TestPass123!"
}

Response 201:
{
  "user": { "id": "user-1", "name": "Test User", "email": "test@example.com" },
  "accessToken": "mock-access-token",
  "refreshToken": "mock-refresh-token"
}
```

### POST /api/auth/login
```json
Request:
{
  "email": "test@example.com",
  "password": "TestPass123!"
}

Response 200:
{
  "user": { "id": "user-1", "name": "Test User", "email": "test@example.com" },
  "accessToken": "mock-access-token",
  "refreshToken": "mock-refresh-token"
}
```

### POST /api/auth/logout
```json
Response 200:
{ "success": true }
```

### GET /api/auth/me
```json
Response 200:
{
  "id": "user-1",
  "name": "Test User",
  "email": "test@example.com"
}
```

## Credits Endpoints

### GET /api/credits/balance
```json
Response 200:
{
  "credits": 100,
  "dailyBonusAvailable": true,
  "lastBonusClaim": null
}
```

### POST /api/credits/daily-bonus
```json
Response 200:
{
  "credits": 110,
  "bonusAmount": 10,
  "dailyBonusAvailable": false,
  "lastBonusClaim": "2026-02-08T10:00:00Z"
}
```

## Templates Endpoints

### GET /api/templates
```json
Response 200:
{
  "templates": [
    {
      "id": "tpl-1",
      "slug": "faq-bot",
      "name": "FAQ Bot",
      "description": "Бот для ответов на часто задаваемые вопросы",
      "category": "support",
      "complexity": "beginner",
      "estimatedCredits": 10
    }
  ]
}
```

### GET /api/templates/:slug
```json
Response 200:
{
  "id": "tpl-1",
  "slug": "faq-bot",
  "name": "FAQ Bot",
  "description": "Бот для ответов на часто задаваемые вопросы",
  "category": "support",
  "complexity": "beginner",
  "estimatedCredits": 10,
  "configSchema": {
    "type": "object",
    "properties": {
      "botName": { "type": "string", "title": "Название бота" },
      "language": { "type": "string", "enum": ["ru", "en"], "title": "Язык" }
    },
    "required": ["botName"]
  }
}
```

## Projects Endpoints

### POST /api/projects
```json
Request:
{
  "name": "My FAQ Bot",
  "templateId": "tpl-1"
}

Response 201:
{
  "id": "proj-1",
  "name": "My FAQ Bot",
  "templateId": "tpl-1",
  "status": "draft",
  "createdAt": "2026-02-08T10:00:00Z"
}
```

### GET /api/projects/:id
```json
Response 200:
{
  "id": "proj-1",
  "name": "My FAQ Bot",
  "templateId": "tpl-1",
  "status": "generated",
  "createdAt": "2026-02-08T10:00:00Z",
  "generatedCode": {
    "files": [
      { "path": "bot.py", "content": "# Generated bot code...", "language": "python" },
      { "path": "requirements.txt", "content": "python-telegram-bot==20.0", "language": "text" }
    ]
  }
}
```

## WebSocket Messages (Generation Flow)

### Connection: ws://localhost:3000/api/ws/generation/:projectId

**Client → Server:**
```json
{ "type": "start_generation", "projectId": "proj-1", "config": { "botName": "My Bot" } }
```

**Server → Client (progress sequence):**
```json
{ "type": "generation_progress", "step": "analyzing", "progress": 0.1, "message": "Анализ шаблона..." }
{ "type": "generation_progress", "step": "generating", "progress": 0.4, "message": "Генерация кода..." }
{ "type": "generation_progress", "step": "reviewing", "progress": 0.7, "message": "Проверка кода..." }
{ "type": "generation_progress", "step": "finalizing", "progress": 0.9, "message": "Финализация..." }
{ "type": "generation_complete", "projectId": "proj-1", "filesCount": 2 }
```

**Server → Client (error):**
```json
{ "type": "generation_error", "error": "Insufficient credits", "code": "CREDITS_INSUFFICIENT" }
```

## Deploy Endpoints

### POST /api/projects/:id/deploy
```json
Request:
{
  "botToken": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
}

Response 200:
{
  "deploymentId": "deploy-1",
  "status": "deploying",
  "projectId": "proj-1"
}
```

### GET /api/projects/:id/deployment
```json
Response 200:
{
  "deploymentId": "deploy-1",
  "status": "running",
  "url": "https://t.me/my_faq_bot",
  "botUsername": "@my_faq_bot",
  "deployedAt": "2026-02-08T10:05:00Z"
}
```
