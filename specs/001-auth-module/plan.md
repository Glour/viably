# Implementation Plan: Authentication Module

**Branch**: `001-auth-module` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-module/spec.md`

## Summary

Implement a complete authentication module for the Viably backend including user registration with email/password, JWT-based login, token refresh mechanism, logout, and automatic referral code generation. New users receive 5 welcome credits upon registration.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI, SQLAlchemy (async), Pydantic v2, python-jose, passlib[bcrypt]
**Storage**: PostgreSQL (async via asyncpg)
**Testing**: pytest + pytest-asyncio + httpx
**Target Platform**: Linux server (containerized)
**Project Type**: Web backend (REST API)
**Performance Goals**: 1000 concurrent authenticated users, <200ms response times
**Constraints**: JWT tokens (24h access, 30d refresh), bcrypt password hashing
**Scale/Scope**: MVP for single application, no SSO/OAuth

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First Development | ✅ PASS | Existing code reviewed (config.py, database.py) |
| II. Single Source of Truth | ✅ PASS | User model in auth/models.py, schemas in auth/schemas.py |
| III. Library-First Development | ✅ PASS | Using python-jose, passlib, pydantic-settings |
| IV. Code Reuse & DRY | ✅ PASS | Reusing existing Base, get_db, Settings |
| V. Strict Type Safety | ✅ PASS | Pydantic v2 + type hints throughout |
| VI. Atomic Task Execution | ✅ PASS | Tasks will be atomic and committable |
| VII. Quality Gates | ✅ PASS | Type-check + tests before commit |
| VIII. Progressive Specification | ✅ PASS | Spec → Plan → Tasks → Implement |
| IX. Error Handling | ✅ PASS | HTTPExceptions with proper codes |
| X. Observability | ⚠️ DEFER | Structured logging deferred to future |
| XI. Accessibility | N/A | Backend API only |

**Gate Result**: ✅ PASSED - No violations requiring justification

### Post-Design Re-check (Phase 1 Complete)

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Single Source of Truth | ✅ PASS | Types in schemas.py, model in models.py |
| III. Library-First | ✅ PASS | python-jose, passlib selected (see research.md) |
| IV. Code Reuse | ✅ PASS | Reuses existing Base, get_db, Settings |

**Post-Design Gate**: ✅ PASSED

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-module/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI)
│   └── auth-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── auth/
│   │   ├── __init__.py      # Module exports
│   │   ├── models.py        # User SQLAlchemy model
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── routes.py        # FastAPI router (/api/auth/*)
│   │   ├── service.py       # Business logic
│   │   ├── security.py      # Password hashing utilities
│   │   └── deps.py          # FastAPI dependencies (get_current_user)
│   ├── core/
│   │   ├── config.py        # Settings (EXISTS - extend)
│   │   └── database.py      # DB session (EXISTS - reuse)
│   └── main.py              # FastAPI app (EXISTS - extend)
└── tests/
    └── test_auth.py         # Auth module tests
```

**Structure Decision**: Single backend project following existing `backend/app/` structure. Auth module added as `app/auth/` package.

## Complexity Tracking

> No violations requiring justification - constitution gates passed.
