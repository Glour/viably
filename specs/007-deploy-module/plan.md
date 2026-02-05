# Implementation Plan: Deploy Module

**Branch**: `007-deploy-module` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-deploy-module/spec.md`

## Summary

Реализация модуля деплоя проектов на Railway через GraphQL API. Пользователь сможет развернуть сгенерированного бота одним кликом, получив публичный URL. Модуль включает создание деплоймента, мониторинг статуса, получение логов, остановку и health checks.

**Technical Approach**: Прямая интеграция с Railway GraphQL API через httpx (уже установлен), синхронный polling статуса с таймаутом 5 минут.

## Technical Context

**Language/Version**: Python 3.12+
**Primary Dependencies**: FastAPI 0.109+, SQLAlchemy 2.0+ (async), Pydantic 2.5+, httpx 0.26+
**Storage**: PostgreSQL (async via asyncpg)
**Testing**: pytest, pytest-asyncio
**Target Platform**: Linux server (Docker)
**Project Type**: Web application (backend only for this module)
**Performance Goals**: Деплой <5 минут, статус-запросы <1с
**Constraints**: Railway API rate limits (~10s между polling), таймаут деплоя 5 минут
**Scale/Scope**: MVP, один активный деплой на проект

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First Development | ✅ PASS | Изучены существующие модули (projects, auth), patterns |
| II. Single Source of Truth | ✅ PASS | Enums/schemas в одном месте (deploy/schemas.py) |
| III. Library-First Development | ✅ PASS | httpx уже в проекте, нет Railway SDK |
| IV. Code Reuse & DRY | ✅ PASS | Использование существующих patterns (auth deps, db session) |
| V. Strict Type Safety | ✅ PASS | Pydantic schemas, type hints |
| VI. Atomic Task Execution | ✅ PLAN | Будет соблюдено при создании tasks |
| VII. Quality Gates | ✅ PLAN | Type-check + tests перед коммитом |
| VIII. Progressive Specification | ✅ PASS | Spec → Plan → Tasks |
| IX. Error Handling | ✅ PLAN | Typed exceptions, user-friendly messages |
| X. Observability | ✅ PLAN | Logging в service layer |
| XI. Accessibility | N/A | Backend module |

**Post-Design Re-check**: ✅ All gates passed

## Project Structure

### Documentation (this feature)

```text
specs/007-deploy-module/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 research findings
├── data-model.md        # Entity definitions
├── quickstart.md        # Developer guide
├── contracts/
│   └── openapi.yaml     # API contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── deploy/              # NEW module
│   │   ├── __init__.py
│   │   ├── models.py        # Deployment SQLAlchemy model
│   │   ├── schemas.py       # Pydantic schemas & enums
│   │   ├── service.py       # Business logic (DeploymentService)
│   │   ├── railway.py       # Railway GraphQL client
│   │   └── routes.py        # FastAPI router
│   ├── core/
│   │   └── config.py        # + RAILWAY_API_TOKEN setting
│   ├── projects/
│   │   └── models.py        # + deployments relationship
│   └── main.py              # + deploy router registration
├── alembic/
│   └── versions/
│       └── xxx_add_deployments_table.py  # NEW migration
└── tests/
    └── test_deploy.py       # NEW tests
```

**Structure Decision**: Web application structure (backend only). Deploy module follows existing patterns from projects, auth, ai modules.

## Complexity Tracking

*No violations — all principles pass*

## Design Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | [research.md](./research.md) | ✅ Complete |
| Data Model | [data-model.md](./data-model.md) | ✅ Complete |
| API Contract | [contracts/openapi.yaml](./contracts/openapi.yaml) | ✅ Complete |
| Quickstart | [quickstart.md](./quickstart.md) | ✅ Complete |

## Implementation Components

### 1. Database Layer
- Deployment model (SQLAlchemy)
- DeploymentStatus, DeploymentPlatform enums
- Migration for deployments table
- Project.deployments relationship

### 2. Railway Integration
- RailwayClient class (GraphQL over httpx)
- Methods: create_project, create_service, set_env_variables, deploy_from_source, get_deployment_status, get_service_domain, delete_project, get_deployment_logs

### 3. Business Logic
- DeploymentService class
- deploy_project() — полный workflow деплоя
- get_deployment() — получение с проверкой прав
- get_deployment_logs() — логи из Railway
- stop_deployment() — остановка и удаление
- check_health() — HTTP health check

### 4. API Layer
- POST /api/deployments/projects/{project_id}/deploy
- GET /api/deployments/{deployment_id}
- GET /api/deployments/{deployment_id}/logs
- DELETE /api/deployments/{deployment_id}

### 5. Configuration
- RAILWAY_API_TOKEN в Settings

### 6. Tests
- Unit tests для DeploymentService (mocked Railway)
- Integration tests для routes
- Edge case tests (errors, timeouts)

## Next Steps

Run `/speckit.tasks` to generate atomic tasks from this plan.
