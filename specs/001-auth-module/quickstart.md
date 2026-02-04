# Quickstart: Authentication Module

**Feature**: 001-auth-module
**Date**: 2026-02-04

## Prerequisites

- Python 3.11+
- PostgreSQL running
- Virtual environment activated

## Installation

```bash
# Install dependencies
pip install python-jose[cryptography] passlib[bcrypt] python-multipart

# Or add to requirements.txt
echo "python-jose[cryptography]>=3.3.0" >> requirements.txt
echo "passlib[bcrypt]>=1.7.4" >> requirements.txt
echo "python-multipart>=0.0.6" >> requirements.txt
pip install -r requirements.txt
```

## Environment Setup

Add to `.env`:

```bash
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
```

## Database Migration

Run Alembic migration (after creating models):

```bash
cd backend
alembic revision --autogenerate -m "Add users table"
alembic upgrade head
```

## Quick Test

### Register User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "full_name": "Test User"
  }'
```

Expected response (201):
```json
{
  "data": {
    "user": {
      "id": "uuid...",
      "email": "test@example.com",
      "credits": 5,
      "referral_code": "ABC12345"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 86400
  }
}
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### Access Protected Endpoint

```bash
curl http://localhost:8000/api/users/me \
  -H "Authorization: Bearer <access_token>"
```

### Refresh Token

```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'
```

## Integration in main.py

```python
from fastapi import FastAPI
from app.auth.routes import router as auth_router

app = FastAPI()

# Include auth routes
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
```

## Using get_current_user Dependency

```python
from fastapi import Depends
from app.auth.deps import get_current_user
from app.auth.models import User

@app.get("/api/users/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"data": current_user}
```

## File Structure After Implementation

```
backend/app/auth/
├── __init__.py      # Module exports
├── models.py        # User SQLAlchemy model
├── schemas.py       # Pydantic schemas
├── routes.py        # FastAPI router
├── service.py       # Business logic
├── security.py      # Password hashing
└── deps.py          # Dependencies
```

## Running Tests

```bash
cd backend
pytest tests/test_auth.py -v
```
