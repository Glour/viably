# Implementation Plan: AI Code Generation Module

**Branch**: `006-ai-generation` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-ai-generation/spec.md`

## Summary

Модуль AI Generation обеспечивает генерацию кода Telegram-ботов через Claude Sonnet 4 API. Использует Celery для асинхронной обработки, интегрируется с существующими модулями Projects и Credits для управления статусами и списания кредитов.

## Technical Context

**Language/Version**: Python 3.12
**Primary Dependencies**: FastAPI 0.109+, SQLAlchemy 2.0+ (async), anthropic>=0.20.0, celery>=5.3.0, redis>=5.0.0
**Storage**: PostgreSQL (existing), Redis (new - Celery broker)
**Testing**: pytest, pytest-asyncio, httpx
**Target Platform**: Linux server
**Project Type**: Web application (backend module)
**Performance Goals**: Generation < 3 minutes, 100 concurrent requests
**Constraints**: Anthropic API rate limits, 8192 max tokens per response
**Scale/Scope**: Part of existing backend, ~10 new files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First | ✅ PASS | Исследован существующий код: projects/, credits/, templates/, auth/ |
| II. Single Source of Truth | ✅ PASS | Использует существующие модели и сервисы |
| III. Library-First | ✅ PASS | Выбраны anthropic, celery, redis (см. research.md) |
| IV. Code Reuse | ✅ PASS | Реюзает credits/service.py, projects/service.py |
| V. Type Safety | ✅ PLANNED | Pydantic schemas, typed functions |
| VI. Atomic Tasks | ✅ PLANNED | Каждая задача независима |
| VII. Quality Gates | ✅ PLANNED | pytest, type-check перед коммитом |
| VIII. Progressive Spec | ✅ PASS | spec.md → plan.md → tasks.md → implement |

### Post-Design Gate

| Principle | Status | Notes |
|-----------|--------|-------|
| IX. Error Handling | ✅ PASS | Typed errors, refund on failure |
| X. Observability | ✅ PASS | Structured logging в service.py |
| XI. Accessibility | N/A | Backend-only module |

### Security Check

| Requirement | Status | Notes |
|-------------|--------|-------|
| No hardcoded credentials | ✅ PLANNED | ANTHROPIC_API_KEY из env |
| Auth provider | ✅ PASS | JWT (existing) |
| RLS | N/A | Не требуется для AI module |
| Input validation | ✅ PASS | Pydantic + JSON Schema (existing) |

## Project Structure

### Documentation (this feature)

```text
specs/006-ai-generation/
├── plan.md              # This file
├── research.md          # Library decisions, technical decisions
├── data-model.md        # Entity relationships, state transitions
├── quickstart.md        # Development setup guide
├── contracts/
│   └── openapi.yaml     # API contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # (will be created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── ai/                      # NEW MODULE
│   │   ├── __init__.py
│   │   ├── client.py           # AnthropicClient wrapper
│   │   ├── prompts.py          # SYSTEM_PROMPT, build_generation_prompt, extract_code_files
│   │   ├── service.py          # AIGenerationService
│   │   ├── worker.py           # Celery tasks
│   │   ├── routes.py           # Admin status endpoint
│   │   └── schemas.py          # AiStatusResponse
│   ├── core/
│   │   └── config.py           # UPDATED: add ANTHROPIC_API_KEY, CELERY_* settings
│   ├── auth/
│   │   └── deps.py             # UPDATED: add get_current_admin_user (if missing)
│   └── main.py                 # UPDATED: include ai_router
├── tests/
│   └── test_ai.py              # NEW: AI module tests
└── requirements.txt            # UPDATED: add anthropic, celery, redis
```

**Structure Decision**: Добавляем новый модуль `app/ai/` следуя существующему паттерну (models, schemas, routes, service). Celery worker в отдельном файле для запуска независимым процессом.

## Complexity Tracking

> No violations. Design follows existing patterns.

## Phase 0 Artifacts

- [x] research.md - Library decisions (anthropic, celery, redis), technical decisions
- [x] No complex research needed - all questions resolved through code analysis

## Phase 1 Artifacts

- [x] data-model.md - Entity relationships, state transitions, no migration needed
- [x] contracts/openapi.yaml - API contract for generate and status endpoints
- [x] quickstart.md - Development setup and usage guide

## Implementation Priorities

Based on User Stories from spec.md:

| Priority | User Story | Components |
|----------|------------|------------|
| P1 | US1: Generate Code | client.py, prompts.py, service.py, worker.py |
| P1 | US2: View Result | (covered by existing GET /projects/{id}) |
| P1 | US3: Error + Refund | service.py error handling, credits integration |
| P2 | US4: Async Processing | worker.py, Celery setup |
| P2 | US5: Retry Logic | worker.py @task decorators |
| P3 | US6: Admin Monitoring | routes.py, schemas.py |

## Dependencies Graph

```
requirements.txt (add deps)
    ↓
core/config.py (add settings)
    ↓
ai/client.py (Anthropic wrapper)
    ↓
ai/prompts.py (prompt building)
    ↓
ai/service.py (generation logic)
    ↓
ai/worker.py (Celery tasks) ─────→ ai/routes.py (admin endpoint)
    ↓                                      ↓
projects/service.py (update)          main.py (include router)
    ↓
tests/test_ai.py
```

## Next Steps

1. Run `/speckit.tasks` to generate atomic task list
2. Each task will be independently committable
3. Tasks follow dependency order above
