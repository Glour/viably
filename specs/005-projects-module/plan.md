# Implementation Plan: Projects Module

**Branch**: `005-projects-module` | **Date**: 2026-02-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-projects-module/spec.md`

---

## Summary

Модуль Projects реализует CRUD операции для пользовательских проектов (боты/API), включая:
- Создание проекта со связью с шаблоном и валидацией конфигурации
- Пагинированный список проектов с фильтрацией по статусу
- Жизненный цикл статусов: draft → generating → ready → deploying → deployed
- Контроль доступа: owner-only для приватных, read-only для публичных

**Технический подход**: Следуем существующим паттернам модулей (auth, templates, credits) — функциональные сервисы, SQLAlchemy async, Pydantic v2 schemas.

---

## Technical Context

**Language/Version**: Python 3.12+
**Primary Dependencies**: FastAPI 0.109+, SQLAlchemy 2.0+ (async), Pydantic 2.5+, jsonschema 4.20+
**Storage**: PostgreSQL (async via asyncpg), SQLite (tests via aiosqlite)
**Testing**: pytest 8.0+, pytest-asyncio 0.23+, httpx 0.26+
**Target Platform**: Linux server (Docker)
**Project Type**: Web application (backend only for this module)
**Performance Goals**: <5s project creation, <1s list 100 projects
**Constraints**: <200ms p95 for CRUD operations
**Scale/Scope**: ~10k projects per user, ~100 concurrent users

---

## Constitution Check

*GATE: All checks passed ✓*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First Development | ✓ PASS | Исследованы существующие модули (auth, templates, credits) |
| II. Single Source of Truth | ✓ PASS | Используем существующие Base, User, Template модели |
| III. Library-First Development | ✓ PASS | jsonschema для валидации, нет custom >20 lines без библиотек |
| IV. Code Reuse & DRY | ✓ PASS | Переиспользуем паттерны из templates, auth модулей |
| V. Strict Type Safety | ✓ PASS | Pydantic schemas, SQLAlchemy typed models |
| VI. Atomic Task Execution | ✓ PASS | Задачи будут атомарными в tasks.md |
| VII. Quality Gates | ✓ PASS | Type-check + tests before commit |
| VIII. Progressive Specification | ✓ PASS | spec.md → plan.md → tasks.md flow |

---

## Project Structure

### Documentation (this feature)

```text
specs/005-projects-module/
├── spec.md              # Feature specification ✓
├── plan.md              # This file ✓
├── research.md          # Research decisions ✓
├── data-model.md        # Entity definitions ✓
├── quickstart.md        # Quick reference ✓
├── contracts/
│   └── openapi.yaml     # API contract ✓
├── checklists/
│   └── requirements.md  # Spec quality checklist ✓
└── tasks.md             # Implementation tasks (next: /speckit.tasks)
```

### Source Code

```text
backend/
├── app/
│   └── projects/
│       ├── __init__.py      # Package exports
│       ├── models.py        # SQLAlchemy Project model
│       ├── schemas.py       # Pydantic schemas
│       ├── service.py       # Business logic functions
│       └── routes.py        # FastAPI endpoints
├── alembic/
│   └── versions/
│       └── xxx_add_projects_table.py  # Migration
└── tests/
    └── test_projects.py     # Integration tests
```

**Structure Decision**: Backend-only web application. Структура модуля идентична существующим (auth, templates, credits).

---

## Dependencies

### New Dependencies

```
# backend/requirements.txt
jsonschema>=4.20.0  # Config validation against template schema
```

### Existing Dependencies (already installed)

- fastapi>=0.109.0
- sqlalchemy[asyncio]>=2.0.0
- pydantic>=2.5.0
- asyncpg>=0.29.0
- pytest>=8.0.0
- pytest-asyncio>=0.23.0

---

## Integration Points

### Templates Module
- **FK**: `projects.template_id → templates.id`
- **Service**: `get_template_by_id()` — получение шаблона для валидации
- **Service**: `increment_usage_count()` — инкремент при создании проекта

### Auth Module
- **Dependency**: `get_current_user` — авторизация endpoints
- **FK**: `projects.user_id → users.id`

### Credits Module (future integration)
- **Service**: `deduct_credits()` — списание при генерации
- Интеграция будет добавлена в AI модуле

### AI Module (stub)
- Генерация кода — заглушка, реализация в отдельном модуле
- Обновление статуса и generated_code через `save_generated_code()`

---

## Key Design Decisions

### D1: Status Management
- Простой string enum вместо state machine library
- Валидация переходов в service layer
- Нет библиотеки python-statemachine (<20 lines логики)

### D2: Config Validation
- Используем jsonschema library
- Валидация при create и update
- Схема берётся из template.config_schema

### D3: Pagination
- Offset-based с LIMIT/OFFSET
- Нет cursor pagination (не нужен для масштаба)
- Нет fastapi-pagination (простая логика)

### D4: Access Control
- Service-level filter по user_id
- Отдельный endpoint `/projects/public/{id}` для публичных
- Нет RLS (не используем Supabase)

---

## Complexity Tracking

> No violations — no entries needed.

---

## Phase Outputs

| Artifact | Status | Path |
|----------|--------|------|
| research.md | ✓ Complete | [research.md](research.md) |
| data-model.md | ✓ Complete | [data-model.md](data-model.md) |
| contracts/openapi.yaml | ✓ Complete | [contracts/openapi.yaml](contracts/openapi.yaml) |
| quickstart.md | ✓ Complete | [quickstart.md](quickstart.md) |

---

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
