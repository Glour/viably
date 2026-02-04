# Research: Templates Module

**Feature**: 004-templates-module
**Date**: 2026-02-04

## Library Decisions

### 1. Database ORM

**Decision**: SQLAlchemy 2.0+ (async)

**Rationale**:
- Already used in project (auth, users modules)
- Excellent async support via asyncpg
- Mature JSONB support for PostgreSQL
- Consistent with existing patterns

**Alternatives Considered**:
- Tortoise ORM: Less mature, would break consistency
- SQLModel: Built on SQLAlchemy, but adds complexity without benefit here

### 2. JSON Schema Storage

**Decision**: PostgreSQL JSONB column with `sqlalchemy.dialects.postgresql.JSONB`

**Rationale**:
- Native PostgreSQL type with indexing support
- SQLAlchemy 2.0 has excellent JSONB support
- No additional library needed
- Allows querying within JSON structure if needed

**Alternatives Considered**:
- Store as TEXT and parse: Loses database-level validation and query capabilities
- Separate schema tables: Over-engineering for this use case

### 3. Array Fields (features, tags)

**Decision**: PostgreSQL ARRAY type with `sqlalchemy.ARRAY(Text)`

**Rationale**:
- Native PostgreSQL type
- SQLAlchemy supports it directly
- Simpler than separate junction tables for simple string arrays

**Alternatives Considered**:
- JSON array: Less type-safe, no array operators
- Junction tables: Over-engineering for simple tag lists

### 4. Search Implementation

**Decision**: SQL ILIKE for case-insensitive search on name and description

**Rationale**:
- Simple, built into PostgreSQL
- Sufficient for template catalog size (100s, not millions)
- No additional dependencies

**Alternatives Considered**:
- PostgreSQL Full-Text Search (tsvector): Over-engineering for current scale
- Elasticsearch: Major infrastructure addition, not justified

## Technical Decisions

### 1. Public vs Authenticated Endpoints

**Decision**: Public endpoints (no authentication required)

**Rationale**:
- Spec states templates are browsable without login
- Encourages discovery and conversion
- Consistent with typical SaaS patterns

**Implementation**: Routes without `Depends(get_current_user)`

### 2. Template Slugs

**Decision**: Use slugs as alternative lookup key (alongside UUID)

**Rationale**:
- SEO-friendly URLs
- Human-readable identifiers
- Unique constraint ensures no conflicts

**Implementation**: `GET /api/templates/{id}` accepts both UUID and slug

### 3. Sorting Strategy

**Decision**: Primary sort by `sort_order`, secondary by `usage_count` (descending)

**Rationale**:
- Allows manual curation of template order
- Falls back to popularity
- Matches spec requirement FR-007

### 4. Inactive Template Handling

**Decision**: Filter out at query level, not application level

**Rationale**:
- More efficient (fewer rows transferred)
- Consistent behavior across all queries
- `WHERE is_active = true` in base query

### 5. Usage Count Increment

**Decision**: Atomic increment via SQL `UPDATE ... SET usage_count = usage_count + 1`

**Rationale**:
- Race-condition safe
- No SELECT-then-UPDATE pattern
- Single database round-trip

### 6. Migration Strategy

**Decision**: Alembic migration + seed script

**Rationale**:
- Alembic already configured in project
- Seed data runs separately (not in migration)
- Allows re-seeding in development

## Existing Code Patterns to Follow

### From `app/auth/models.py`:
- UUID primary key with `default=uuid.uuid4`
- Timestamps with `server_default=func.now()` and `onupdate=func.now()`
- String columns with explicit `nullable` parameter

### From `app/users/routes.py`:
- Response wrapped in `{"data": ...}`
- Query parameters for filtering
- HTTPException for errors (404, etc.)

### From `app/users/service.py`:
- Async functions with `AsyncSession` parameter
- `select()` queries with explicit columns
- Type hints on all parameters and returns

### From `tests/conftest.py`:
- SQLite in-memory for tests
- Fixture pattern for test data
- `AsyncClient` with `ASGITransport`

## Dependencies Verified

All required dependencies already in `requirements.txt`:
- `sqlalchemy[asyncio]>=2.0.0` - JSONB, ARRAY support
- `pydantic>=2.5.0` - Schema validation
- `fastapi>=0.109.0` - API framework

No new dependencies needed.

## Open Questions (Resolved)

1. **Q: Should template lookup by ID also accept slug?**
   - A: Yes, implement flexible lookup supporting both UUID and slug

2. **Q: How to handle JSONB in SQLite tests?**
   - A: SQLite supports JSON type since 3.38, SQLAlchemy maps JSONB → JSON for SQLite

3. **Q: Should config_schema validation be strict?**
   - A: No validation on read (stored JSON is trusted), validation only on write (admin API, future scope)
