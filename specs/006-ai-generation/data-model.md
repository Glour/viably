# Data Model: AI Code Generation Module

**Feature Branch**: `006-ai-generation`
**Date**: 2026-02-05

## 1. Overview

Модуль AI Generation не требует новых таблиц БД. Все необходимые поля уже существуют в модели Project:

```python
# Existing in app/projects/models.py
class Project(Base):
    generated_code = Column(JSON, nullable=True)    # {"files": {"path": "content"}}
    generation_logs = Column(Text, nullable=True)   # Logs from AI
    ai_model_used = Column(String(50), nullable=True)  # e.g. "claude-sonnet-4-20250514"
    status = Column(String(20))                      # DRAFT → GENERATING → READY/ERROR
    error_message = Column(Text, nullable=True)      # Error description
    generated_at = Column(DateTime)                  # When generation completed
```

## 2. Entity Relationships

```
┌──────────────────┐       ┌──────────────────┐
│      User        │       │     Template     │
│                  │       │                  │
│ id: UUID (PK)    │       │ id: UUID (PK)    │
│ credits: int     │       │ prompt_template  │
│ plan: str        │       │ config_schema    │
│                  │       │ credit_cost: int │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         │ has many                 │ used by
         ▼                          ▼
┌──────────────────────────────────────────────┐
│                    Project                    │
│                                              │
│ id: UUID (PK)                                │
│ user_id: UUID (FK → users.id)                │
│ template_id: UUID (FK → templates.id)        │
│ config: JSON                                 │
│ status: str (DRAFT|GENERATING|READY|ERROR)   │
│ generated_code: JSON {"files": {...}}        │
│ generation_logs: TEXT                        │
│ ai_model_used: str                           │
│ error_message: TEXT                          │
│ generated_at: TIMESTAMP                      │
└──────────────────────────────────────────────┘
         │
         │ tracked by
         ▼
┌──────────────────────────────────────────────┐
│              CreditTransaction               │
│                                              │
│ id: UUID (PK)                                │
│ user_id: UUID (FK → users.id)                │
│ amount: int (-10 for deduct, +10 for refund) │
│ balance_after: int                           │
│ transaction_type: str (generation|refund)    │
│ project_id: UUID (nullable, FK → projects)   │
│ description: TEXT                            │
│ created_at: TIMESTAMP                        │
└──────────────────────────────────────────────┘
```

## 3. State Transitions

```
                    ┌─────────────────────┐
                    │       DRAFT         │
                    │  (initial state)    │
                    └──────────┬──────────┘
                               │
                    POST /projects/{id}/generate
                    (deduct credits)
                               │
                               ▼
                    ┌─────────────────────┐
                    │     GENERATING      │
                    │  (async processing) │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
         Success                            Error
     (save code)                     (refund credits)
              │                                 │
              ▼                                 ▼
   ┌─────────────────────┐          ┌─────────────────────┐
   │        READY        │          │        ERROR        │
   │  (code available)   │          │  (error_message)    │
   └─────────────────────┘          └──────────┬──────────┘
                                               │
                                    PATCH status=draft
                                    (manual reset)
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │       DRAFT         │
                                    └─────────────────────┘
```

## 4. Generated Code Structure

```json
{
  "files": {
    "main.py": "import asyncio\n...",
    "handlers/start.py": "from aiogram import Router\n...",
    "handlers/catalog.py": "...",
    "config.py": "import os\n...",
    "requirements.txt": "aiogram>=3.0.0\n...",
    "Dockerfile": "FROM python:3.11-slim\n...",
    ".env.example": "BOT_TOKEN=\n..."
  },
  "entry_point": "main.py",
  "runtime": "python3.11"
}
```

## 5. Credit Transaction Types

| transaction_type | amount | Description |
|------------------|--------|-------------|
| `generation` | -10 | Списание при запуске генерации |
| `generation_refund` | +10 | Возврат при ошибке генерации |

## 6. Validation Rules

### 6.1 Generation Trigger

- Project.status MUST BE "draft"
- User.credits MUST BE >= template.credit_cost (default: 10)
- Project.template_id MUST reference existing active template

### 6.2 Status Updates

- status = "generating": Only from "draft"
- status = "ready": Only from "generating" + generated_code NOT NULL
- status = "error": Only from "generating" + error_message NOT NULL

### 6.3 Concurrent Access

- Only ONE generation per project at a time (enforced by status check)
- Multiple projects can generate simultaneously for same user

## 7. No Database Migration Required

Все необходимые колонки уже существуют в текущей схеме `projects` таблицы (миграция c3d4e5f6g7h8_add_projects_table.py).
