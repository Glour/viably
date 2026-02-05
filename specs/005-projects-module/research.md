# Research: Projects Module

**Feature**: 005-projects-module
**Created**: 2026-02-05

## Research Summary

No external research required — all decisions derived from existing codebase patterns.

---

## R1: Project Module Architecture

**Decision**: Follow existing module pattern (models.py, schemas.py, service.py, routes.py)

**Rationale**:
- Consistent with auth, users, credits, templates modules
- Already proven patterns in codebase
- No learning curve for maintainers

**Alternatives considered**:
- Repository pattern: Rejected — adds unnecessary abstraction layer, existing service pattern is sufficient
- Class-based service: Rejected — existing modules use function-based services (templates) and class-based (not used), will use functions for simplicity

---

## R2: Database Model Design

**Decision**: Use SQLAlchemy async model with JSONB for flexible storage

**Rationale**:
- JSONB for `config` and `generated_code` allows flexible schema without migrations
- JSON type used in templates module (compatible with SQLite for tests)
- UUID primary keys consistent with all other models

**Library**: SQLAlchemy 2.0+ (already in requirements.txt)

---

## R3: Status State Machine

**Decision**: Simple string enum with validation in service layer

**Rationale**:
- Transitions: draft → generating → ready → deploying → deployed, error from any state
- No external state machine library needed (<20 lines of transition logic)
- Consistent with how status is handled in other modules

**Alternatives considered**:
- python-statemachine library: Rejected — overkill for 6 states, 5 transitions
- Database-level constraints: Rejected — transition logic too complex for CHECK constraints

---

## R4: Pagination Implementation

**Decision**: Use offset-based pagination with SQLAlchemy

**Rationale**:
- Consistent with industry standard for CRUD APIs
- Simple implementation with OFFSET/LIMIT
- Sufficient for expected scale (<10k projects per user)

**Alternatives considered**:
- Cursor-based pagination: Rejected — unnecessary complexity for this use case
- fastapi-pagination library: Rejected — adds dependency for simple pagination logic

---

## R5: Access Control Strategy

**Decision**: Service-level filtering by user_id + separate endpoint for public projects

**Rationale**:
- All queries filter by user_id (owner-only access)
- Public projects accessed via separate read-only endpoint
- No complex permission system needed for MVP

**Alternatives considered**:
- Row-Level Security (RLS): Rejected — would require Supabase setup, current stack is PostgreSQL direct
- Decorator-based permissions: Rejected — service-level check is simpler and explicit

---

## R6: Config Validation

**Decision**: Validate config against template.config_schema using jsonschema library

**Rationale**:
- Templates already store JSON Schema format
- Standard validation approach
- Library already commonly used for JSON Schema validation

**Library**: jsonschema (need to add to requirements.txt)

---

## R7: Testing Strategy

**Decision**: Follow existing test patterns with pytest-asyncio and in-memory SQLite

**Rationale**:
- Consistent with test_templates.py, test_credits.py patterns
- Fixtures already exist for users, templates
- Fast test execution with SQLite

---

## R8: Integration with Other Modules

**Decision**: Direct module imports with foreign key relationships

**Rationale**:
- Direct FK to users.id and templates.id
- Service calls for cross-module operations (credits deduction, template usage increment)
- No event bus or message queue needed for MVP

---

## Dependencies to Add

```
# requirements.txt
jsonschema>=4.20.0  # For config validation against template schema
```

---

## No Research Prompts Required

All decisions resolved from codebase patterns and standard practices.
