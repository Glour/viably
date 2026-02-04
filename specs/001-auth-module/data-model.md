# Data Model: Authentication Module

**Feature**: 001-auth-module
**Date**: 2026-02-04

## Entities

### User

Primary entity representing a registered user account.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| email | String(255) | Unique, Not Null, Indexed | User's email address |
| password_hash | String(255) | Not Null | bcrypt hashed password |
| full_name | String(255) | Nullable | User's display name |
| avatar_url | String | Nullable | Profile image URL |
| plan | String(20) | Not Null, Default: "free" | Subscription plan |
| credits | Integer | Not Null, Default: 5 | Available credits |
| referral_code | String(8) | Unique, Not Null, Indexed | User's referral code |
| referred_by | UUID | FK → users.id, Nullable | Who referred this user |
| is_active | Boolean | Not Null, Default: true | Account active status |
| is_verified | Boolean | Not Null, Default: false | Email verified status |
| created_at | DateTime(tz) | Auto, server_default | Registration timestamp |
| updated_at | DateTime(tz) | Auto, on_update | Last modification |
| last_login_at | DateTime(tz) | Nullable | Last successful login |

**Indexes**:
- `ix_users_email` (unique)
- `ix_users_referral_code` (unique)

**Relationships**:
- Self-referential: `referred_by` → `users.id`

### Session (Virtual - JWT-based)

Sessions are represented by JWT tokens, not stored in database.

| Field | Location | Description |
|-------|----------|-------------|
| sub | JWT payload | User UUID |
| type | JWT payload | "access" or "refresh" |
| exp | JWT payload | Expiration timestamp |
| iat | JWT payload | Issued at timestamp |

## Validation Rules

### Email
- Valid email format (EmailStr)
- Maximum 255 characters
- Case-insensitive uniqueness check

### Password
- Minimum 8 characters
- Maximum 100 characters
- At least one uppercase letter
- At least one digit
- Stored as bcrypt hash (never plain text)

### Referral Code
- Exactly 8 characters
- Format: 3 uppercase letters + 5 digits
- Example: `ABC12345`
- Auto-generated on registration
- Unique constraint with retry on collision

## State Transitions

### User Account States

```
[New] → [Active, Unverified] → [Active, Verified]
                ↓
          [Inactive]
```

| State | is_active | is_verified | Can Login |
|-------|-----------|-------------|-----------|
| Active, Unverified | true | false | Yes |
| Active, Verified | true | true | Yes |
| Inactive | false | * | No |

### Token Lifecycle

```
[Login/Register] → [Access Token] → [Expired]
       ↓                               ↓
  [Refresh Token] ←────────────── [Refresh]
       ↓
  [30 days] → [Expired] → [Re-login required]
```

## Database Migration

### Initial Migration (users table)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    credits INTEGER NOT NULL DEFAULT 5,
    referral_code VARCHAR(8) NOT NULL,
    referred_by UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_referral_code UNIQUE (referral_code)
);

CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_referral_code ON users(referral_code);
```
