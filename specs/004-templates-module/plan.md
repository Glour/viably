# Implementation Plan: Templates Module

**Branch**: `004-templates-module` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-templates-module/spec.md`

## Summary

Implement a Templates module that manages bot and API service templates for users to browse, filter, search, and view details. The module provides read-only access to pre-seeded templates with configuration schemas (JSON Schema format) that define customizable options for each template. Technical approach follows existing FastAPI/SQLAlchemy async patterns established in auth and users modules.

## Technical Context

**Language/Version**: Python 3.12
**Primary Dependencies**: FastAPI 0.109+, SQLAlchemy 2.0+ (async), Pydantic 2.5+
**Storage**: PostgreSQL (async via asyncpg), SQLite (tests via aiosqlite)
**Testing**: pytest 8.0+, pytest-asyncio, httpx
**Target Platform**: Linux server
**Project Type**: Web application (backend API)
**Performance Goals**: Template list load < 2 seconds, template detail < 1 second
**Constraints**: No authentication required for template browsing (public endpoints)
**Scale/Scope**: 6 initial templates, designed to scale to 100+ templates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First Development | PASS | Reviewed existing modules (auth, users) for patterns |
| II. Single Source of Truth | PASS | Template model centralized in `app/templates/models.py` |
| III. Library-First Development | PASS | Using established FastAPI/SQLAlchemy/Pydantic stack |
| IV. Code Reuse & DRY | PASS | Reusing `Base`, `get_db`, existing pagination patterns |
| V. Strict Type Safety | PASS | All functions will have explicit return types |
| VI. Atomic Task Execution | PASS | Tasks designed for independent completion |
| VII. Quality Gates | PASS | Type-check, build, tests required before commit |
| VIII. Progressive Specification | PASS | Following spec → plan → tasks flow |

**Post-Phase 1 Re-check**: All principles maintained in design artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/004-templates-module/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml     # API contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── templates/               # NEW MODULE
│   │   ├── __init__.py          # Module exports
│   │   ├── models.py            # SQLAlchemy Template model
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── service.py           # Business logic
│   │   ├── routes.py            # FastAPI routes
│   │   └── seed.py              # Initial template data
│   ├── main.py                  # Add templates router
│   ├── auth/                    # Existing
│   ├── users/                   # Existing
│   └── core/                    # Existing (database, config)
├── alembic/
│   └── versions/                # NEW migration for templates table
└── tests/
    └── test_templates.py        # NEW tests

```

**Structure Decision**: Following established backend module pattern from auth/users modules. Single `app/templates/` directory with models, schemas, service, routes, and seed data.

## Complexity Tracking

No constitution violations - no complexity justifications needed.

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Research | [research.md](./research.md) | Library decisions, technical choices |
| Data Model | [data-model.md](./data-model.md) | Entity definitions, relationships |
| API Contract | [contracts/openapi.yaml](./contracts/openapi.yaml) | OpenAPI 3.1 specification |
| Quickstart | [quickstart.md](./quickstart.md) | Setup and usage guide |

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
