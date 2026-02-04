# Research: Authentication Module

**Feature**: 001-auth-module
**Date**: 2026-02-04
**Status**: Complete

## Library Decisions

### 1. JWT Token Management

**Decision**: python-jose with HS256 algorithm

**Rationale**:
- Industry standard for Python JWT handling
- High reputation (Context7 score: 80.95)
- Simple API for encode/decode operations
- Built-in expiration validation
- Already specified in project docs

**Alternatives Considered**:
- `authlib/joserfc` (score: 88.2) - More comprehensive but overkill for simple JWT
- `PyJWT` - Similar functionality, python-jose has better cryptography backend

**Usage Pattern**:
```python
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError

# Encode
token = jwt.encode(claims, secret, algorithm='HS256')

# Decode with validation
payload = jwt.decode(token, secret, algorithms=['HS256'])
```

### 2. Password Hashing

**Decision**: passlib with bcrypt scheme

**Rationale**:
- Industry standard for password hashing
- High reputation (Context7 score: 77.7)
- CryptContext provides clean API
- Automatic deprecated hash migration support
- bcrypt is recommended for password storage

**Alternatives Considered**:
- `bcrypt` directly - passlib provides better abstraction
- `argon2-cffi` - Newer but bcrypt is well-established

**Usage Pattern**:
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash
hash = pwd_context.hash(password)

# Verify
is_valid = pwd_context.verify(password, hash)
```

### 3. Authentication Flow

**Decision**: FastAPI HTTPBearer (not OAuth2PasswordBearer)

**Rationale**:
- Simpler for pure JWT-based auth
- No form-based login needed (JSON API)
- Better for mobile/SPA clients
- OAuth2PasswordBearer requires form data

**Usage Pattern**:
```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    token = credentials.credentials
    # validate token...
```

### 4. Token Strategy

**Decision**: Dual-token system (access + refresh)

| Token Type | Expiration | Storage | Purpose |
|------------|------------|---------|---------|
| Access | 24 hours | Memory/Header | API authentication |
| Refresh | 30 days | Secure storage | Get new access token |

**Rationale**:
- Short-lived access tokens reduce risk window
- Long-lived refresh tokens improve UX
- Standard industry practice

### 5. Referral Code Generation

**Decision**: Custom implementation (simple, <20 lines)

**Rationale**:
- Very specific format requirement (3 letters + 5 digits)
- No library needed for this simple logic
- Database uniqueness constraint handles collisions

**Implementation**:
```python
import random
import string

def generate_referral_code() -> str:
    letters = ''.join(random.choices(string.ascii_uppercase, k=3))
    digits = ''.join(random.choices(string.digits, k=5))
    return f"{letters}{digits}"
```

## Technical Decisions

### Token Payload Structure

**Access Token**:
```json
{
  "sub": "user-uuid",
  "type": "access",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**Refresh Token**:
```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Error Response Format

Consistent with FastAPI HTTPException:
```json
{
  "detail": "Human-readable error message"
}
```

HTTP Status Codes:
- 400: Validation error (weak password, invalid email format)
- 401: Invalid credentials / Invalid token
- 403: Account inactive
- 409: Email already registered

### Security Considerations

1. **Password Storage**: bcrypt with automatic cost factor
2. **Token Signing**: HS256 with secret from environment
3. **Error Messages**: Generic "invalid credentials" to prevent user enumeration
4. **Rate Limiting**: Deferred to API gateway/reverse proxy level

## Dependencies Summary

```text
# Already in project or requirements
fastapi>=0.109.0
sqlalchemy[asyncio]>=2.0
pydantic>=2.5.0
pydantic-settings>=2.0.0

# To add for auth module
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
```

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Token blacklist for logout? | Not implemented in MVP - tokens expire naturally |
| Account lockout? | Deferred - edge case documented in spec |
| Email verification? | Out of scope for MVP |
