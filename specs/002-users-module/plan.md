# Implementation Plan: Users Module

**Branch**: `002-users-module` | **Date**: 2026-02-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-users-module/spec.md`

## Summary

Implement user profile management module providing REST API endpoints for:
- Viewing and updating user profile (GET/PATCH /api/users/me)
- Viewing credit balance with plan-specific rollover limits (GET /api/users/me/credits)
- Paginated transaction history with type filtering (GET /api/users/me/transactions)

Module reuses existing User model from Auth module and adds CreditTransaction model for transaction history.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI 0.109+, SQLAlchemy 2.0+ (async), Pydantic 2.5+
**Storage**: PostgreSQL (via asyncpg)
**Testing**: pytest 8.0+, pytest-asyncio, httpx
**Target Platform**: Linux server (Docker deployment)
**Project Type**: Web application (backend API)
**Performance Goals**: <1s response for profile, <2s for transaction history (1000 records)
**Constraints**: Must integrate with existing Auth module, JWT authentication required
**Scale/Scope**: MVP - single tenant, expected <10k users initially

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First Development | ✅ PASS | Read Auth module code, migrations, schemas |
| II. Single Source of Truth | ✅ PASS | Reuse User model from auth, define shared types |
| III. Library-First Development | ✅ PASS | Using FastAPI, SQLAlchemy, Pydantic (existing stack) |
| IV. Code Reuse & DRY | ✅ PASS | Reuse auth deps, database config, response patterns |
| V. Strict Type Safety | ✅ PASS | Pydantic schemas + mypy strict mode |
| VI. Atomic Task Execution | ✅ PASS | Tasks will be atomic and independently testable |
| VII. Quality Gates | ✅ PASS | Type-check + tests required before commit |
| VIII. Progressive Specification | ✅ PASS | Following spec → plan → tasks flow |

## Project Structure

### Documentation (this feature)

```text
specs/002-users-module/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI)
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── auth/            # Existing - reuse deps, models
│   │   ├── models.py    # User model (reuse)
│   │   └── deps.py      # get_current_user (reuse)
│   ├── users/           # NEW - This feature
│   │   ├── __init__.py
│   │   ├── schemas.py   # Pydantic schemas
│   │   ├── routes.py    # FastAPI endpoints
│   │   ├── service.py   # Business logic
│   │   └── models.py    # CreditTransaction model
│   └── main.py          # Add users router
├── alembic/
│   └── versions/        # New migration for credit_transactions
└── tests/
    └── test_users.py    # Unit + integration tests
```

**Structure Decision**: Web application structure following existing Auth module patterns. Users module created as sibling to auth/ with identical file organization.

## Complexity Tracking

No constitution violations identified. Implementation follows established patterns.

---

## Phase Completion Status

### Phase 0: Research ✅ COMPLETE

**Output**: [research.md](research.md)

- All technical decisions documented
- No additional libraries needed
- All NEEDS CLARIFICATION items resolved

### Phase 1: Design & Contracts ✅ COMPLETE

**Outputs**:
- [data-model.md](data-model.md) - Entity definitions and migration plan
- [contracts/openapi.yaml](contracts/openapi.yaml) - Full OpenAPI 3.1 specification
- [quickstart.md](quickstart.md) - Developer onboarding guide

**Agent Context**: Updated CLAUDE.md with Python/FastAPI stack

### Constitution Re-check (Post-Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Single Source of Truth | ✅ PASS | User model reused, schemas centralized |
| V. Strict Type Safety | ✅ PASS | All endpoints have Pydantic schemas |
| VII. Quality Gates | ✅ PASS | OpenAPI contract enables contract testing |

---

## Next Step

Run `/speckit.tasks` to generate implementation tasks.
