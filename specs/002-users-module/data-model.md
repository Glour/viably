# Data Model: Users Module

**Feature**: 002-users-module
**Date**: 2026-02-04

## Entities

### User (Existing - from Auth Module)

Located: `backend/app/auth/models.py`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| email | String(255) | Unique, Not Null, Indexed | User email address |
| password_hash | String(255) | Not Null | Bcrypt password hash |
| full_name | String(255) | Nullable | Display name |
| avatar_url | String | Nullable | Profile picture URL |
| plan | String(20) | Not Null, Default: "free" | Subscription plan |
| credits | Integer | Not Null, Default: 5 | Current credit balance |
| referral_code | String(8) | Unique, Not Null, Indexed | User's referral code |
| referred_by | UUID | FK → users.id, Nullable | Referrer's user ID |
| is_active | Boolean | Not Null, Default: true | Account status |
| is_verified | Boolean | Not Null, Default: false | Email verified |
| created_at | DateTime(tz) | Server default: now() | Registration timestamp |
| updated_at | DateTime(tz) | On update: now() | Last update timestamp |
| last_login_at | DateTime(tz) | Nullable | Last login timestamp |

**Usage in Users Module**: Read for profile view, update full_name and avatar_url.

---

### CreditTransaction (New)

Location: `backend/app/users/models.py`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| user_id | UUID | FK → users.id, Not Null, Indexed | Owner of transaction |
| amount | Integer | Not Null | Credit change (+/-) |
| balance_after | Integer | Not Null | Balance after this transaction |
| transaction_type | String(20) | Not Null | Type enum value |
| description | String(255) | Nullable | Human-readable description |
| project_id | UUID | FK → projects.id, Nullable | Related project (if applicable) |
| created_at | DateTime(tz) | Server default: now(), Indexed | Transaction timestamp |

**Transaction Types** (enum values):
- `generation` - Credits spent on AI generation
- `daily_bonus` - Daily login bonus
- `purchase` - Credits purchased
- `referral` - Referral bonus
- `adjustment` - Manual admin adjustment

**Indexes**:
- `ix_credit_transactions_user_id` - For user's transaction lookup
- `ix_credit_transactions_created_at` - For pagination ordering
- Composite: `(user_id, created_at DESC)` - For efficient paginated queries

---

## Relationships

```
┌─────────────────┐         ┌─────────────────────────┐
│     users       │ 1     N │   credit_transactions   │
│─────────────────│─────────│─────────────────────────│
│ id (PK)         │◄────────│ user_id (FK)            │
│ email           │         │ id (PK)                 │
│ full_name       │         │ amount                  │
│ avatar_url      │         │ balance_after           │
│ plan            │         │ transaction_type        │
│ credits         │         │ description             │
│ referral_code   │         │ project_id (FK) ────────┼──► projects (future)
│ ...             │         │ created_at              │
└─────────────────┘         └─────────────────────────┘
```

---

## Validation Rules

### UserUpdate Schema

| Field | Validation |
|-------|------------|
| full_name | Optional, max 255 chars, strip whitespace |
| avatar_url | Optional, must be valid HTTP/HTTPS URL |

### Pagination Parameters

| Parameter | Validation |
|-----------|------------|
| page | Integer, min: 1, default: 1 |
| per_page | Integer, min: 1, max: 100, default: 20 |
| type | Optional, must be valid transaction_type |

---

## State Transitions

### User Profile

No complex state machine. Direct field updates allowed for:
- `full_name`: Any valid string or null
- `avatar_url`: Any valid URL or null

### Credit Balance

Credits managed by Credits module (future). Users module is read-only for credits.

```
credits field: READ-ONLY in Users module
  │
  └── Updated by: Credits module (generation, bonus, purchase)
```

---

## Migration Plan

### New Migration: `add_credit_transactions_table`

```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    project_id UUID,  -- FK added when projects table exists
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX ix_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX ix_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
```

**Note**: `project_id` FK constraint deferred until Projects module implemented.
