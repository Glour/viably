# Research: Users Module

**Feature**: 002-users-module
**Date**: 2026-02-04

## Research Tasks

### 1. Credit Transaction Model Design

**Question**: How to design credit_transactions table for efficient querying and filtering?

**Decision**: Create `credit_transactions` table with:
- UUID primary key
- Foreign key to users(id)
- amount (integer, positive/negative for credits)
- balance_after (integer, denormalized for history display)
- transaction_type (enum: generation, daily_bonus, purchase, referral, adjustment)
- description (optional text)
- project_id (optional FK, for generation transactions)
- created_at timestamp

**Rationale**:
- Denormalized `balance_after` enables fast history display without recalculating
- Enum type ensures data integrity for transaction types
- Indexed user_id + created_at for efficient pagination queries

**Alternatives considered**:
- Event sourcing: Too complex for MVP, adds latency
- Single credits field only: Loses history, user transparency requirements

### 2. Pagination Strategy

**Question**: Best approach for paginated transaction history?

**Decision**: Offset-based pagination with:
- `page` parameter (1-indexed, default: 1)
- `per_page` parameter (default: 20, max: 100)
- Response includes total count and total_pages

**Rationale**:
- Consistent with typical REST APIs
- Simple implementation with SQLAlchemy
- User-friendly page navigation

**Alternatives considered**:
- Cursor-based pagination: Better for infinite scroll, but transaction history typically uses page numbers
- Keyset pagination: More performant at scale but adds complexity

### 3. Daily Bonus Time Calculation

**Question**: How to calculate next daily bonus availability?

**Decision**:
- Query most recent `daily_bonus` transaction for user
- If no bonus today (UTC), bonus is available now (return null for next_bonus_at)
- If bonus claimed today, return next day 00:00 UTC

**Rationale**:
- Simple date comparison in UTC
- Consistent globally regardless of user timezone
- Aligns with typical daily reset patterns in gaming/SaaS

**Implementation note**: Daily bonus claiming is handled by Credits module. Users module only displays when next bonus is available.

### 4. Rollover Limit Configuration

**Question**: Where to store plan-specific rollover limits?

**Decision**: Hardcoded dictionary in service.py:
```python
ROLLOVER_LIMITS = {
    "free": 0,
    "starter": 200,
    "pro": 600,
    "business": 2000
}
```

**Rationale**:
- Simple for MVP
- Plans are fixed set (free, starter, pro, business)
- No admin UI for changing limits

**Alternatives considered**:
- Database table: Overkill for 4 fixed values
- Environment variables: Less readable, still hardcoded

### 5. URL Validation for Avatar

**Question**: How strict should avatar URL validation be?

**Decision**: Use Pydantic's `HttpUrl` type for format validation only:
- Must be valid HTTP/HTTPS URL format
- No content validation (HEAD request, image type check)
- No domain whitelist

**Rationale**:
- Simple and fast validation
- Content validation adds latency and complexity
- Frontend/CDN can handle actual image rendering

**Alternatives considered**:
- Content-type validation via HEAD request: Adds external dependency, latency
- Domain whitelist: Restricts user freedom unnecessarily

## Library Assessment

### Existing Dependencies (No changes needed)

| Library | Purpose | Status |
|---------|---------|--------|
| FastAPI | Web framework | ✅ Already installed |
| SQLAlchemy | ORM | ✅ Already installed |
| Pydantic | Validation | ✅ Already installed |
| asyncpg | PostgreSQL driver | ✅ Already installed |

### Considered Libraries

| Library | Purpose | Decision |
|---------|---------|----------|
| fastapi-pagination | Pagination helper | ❌ Skip - simple manual implementation sufficient for MVP |
| python-dateutil | Date math | ❌ Skip - stdlib datetime sufficient for UTC calculations |

**Conclusion**: No additional libraries needed. Existing stack covers all requirements.

## Integration Points

### Auth Module (Dependency)

- **Reuse**: `get_current_user` dependency for authentication
- **Reuse**: `User` model from `app.auth.models`
- **Pattern**: Follow response structure `{"data": {...}}`

### Credits Module (Future)

- **Coordination**: CreditTransaction model shared between modules
- **Note**: Users module reads transactions, Credits module writes them
- **Decision**: Define model in users/ for now, can refactor later if needed

## Open Questions Resolved

All questions from Technical Context resolved. No NEEDS CLARIFICATION remaining.
