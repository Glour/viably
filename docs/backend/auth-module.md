# Backend Module: Authentication

**Module:** `app/auth`  
**Status:** Not Started  
**Priority:** P0 (Must have for MVP)  
**Estimated Time:** 1 week

---

## 📋 Overview

The Authentication module handles user registration, login, JWT token management, and session handling.

**Responsibilities:**
- User registration with email/password
- Login with JWT token generation
- Token refresh mechanism
- Password hashing and validation
- Referral code generation

---

## 🔧 Dependencies

```python
# requirements.txt additions
fastapi>=0.109.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
pydantic[email]>=2.5.0
```

---

## 🗄️ Database Models

### User Model

File: `app/auth/models.py`

```python
from sqlalchemy import Boolean, Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Plan & Credits
    plan = Column(String(20), default="free", nullable=False)
    credits = Column(Integer, default=5, nullable=False)
    
    # Referrals
    referral_code = Column(String(8), unique=True, nullable=False, index=True)
    referred_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)
```

---

## 📝 Pydantic Schemas

File: `app/auth/schemas.py`

```python
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from uuid import UUID
import re

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str | None = Field(None, max_length=255)
    
    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours

class TokenRefresh(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    avatar_url: str | None
    plan: str
    credits: int
    referral_code: str
    is_verified: bool
    created_at: datetime
    last_login_at: datetime | None
    
    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 86400
```

---

## 🛣️ API Endpoints

File: `app/auth/routes.py`

### POST /api/auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response:** 201 Created
```json
{
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "full_name": "John Doe",
      "plan": "free",
      "credits": 5,
      "referral_code": "ABC12345"
    },
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "token_type": "bearer",
    "expires_in": 86400
  }
}
```

**Errors:**
- 400: Validation error (weak password, invalid email)
- 409: Email already registered

---

### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** 200 OK
```json
{
  "data": {
    "user": { ... },
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "token_type": "bearer",
    "expires_in": 86400
  }
}
```

**Errors:**
- 401: Invalid credentials
- 403: Account inactive

---

### POST /api/auth/refresh

**Request:**
```json
{
  "refresh_token": "eyJhbG..."
}
```

**Response:** 200 OK
```json
{
  "data": {
    "access_token": "eyJhbG...",
    "token_type": "bearer",
    "expires_in": 86400
  }
}
```

**Errors:**
- 401: Invalid or expired refresh token

---

### POST /api/auth/logout

**Headers:** `Authorization: Bearer {access_token}`

**Response:** 204 No Content

---

## 💼 Business Logic

File: `app/auth/service.py`

### Core Functions:

```python
async def register_user(
    email: str, 
    password: str, 
    full_name: str | None = None,
    db: AsyncSession = None
) -> User:
    """
    Register a new user.
    
    1. Check if email exists
    2. Hash password
    3. Generate referral code
    4. Create user with 5 signup credits
    5. Return user object
    
    Raises:
        HTTPException 409: If email already registered
    """

async def authenticate_user(
    email: str, 
    password: str,
    db: AsyncSession = None
) -> User:
    """
    Authenticate user by email and password.
    
    1. Find user by email
    2. Verify password
    3. Update last_login_at
    4. Return user object
    
    Raises:
        HTTPException 401: If credentials invalid
        HTTPException 403: If account inactive
    """

async def create_access_token(
    user_id: UUID, 
    expires_delta: timedelta = None
) -> str:
    """
    Create JWT access token.
    
    Payload:
        - sub: user_id
        - type: access
        - exp: expiration timestamp
    """

async def create_refresh_token(
    user_id: UUID,
    expires_delta: timedelta = None
) -> str:
    """
    Create JWT refresh token.
    
    Payload:
        - sub: user_id
        - type: refresh
        - exp: expiration (30 days)
    """

async def verify_token(token: str, token_type: str = "access") -> UUID:
    """
    Verify JWT token and return user_id.
    
    Raises:
        HTTPException 401: If token invalid or expired
    """

def generate_referral_code() -> str:
    """
    Generate unique 8-character referral code.
    
    Format: ABC12345 (3 letters + 5 digits)
    Must be unique in database.
    """
```

---

## 🔐 Security Utilities

File: `app/auth/security.py`

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)
```

---

## 🔑 Dependencies

File: `app/auth/deps.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.service import verify_token
from app.auth.models import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user.
    
    1. Extract token from Authorization header
    2. Verify token and get user_id
    3. Fetch user from database
    4. Check if user is active
    5. Return user object
    
    Raises:
        HTTPException 401: If token invalid
        HTTPException 403: If user inactive
    """
    token = credentials.credentials
    user_id = await verify_token(token, token_type="access")
    
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user
```

---

## 📁 File Structure

```
app/auth/
├── __init__.py          # Module exports
├── models.py            # SQLAlchemy User model
├── schemas.py           # Pydantic schemas
├── routes.py            # FastAPI routes
├── service.py           # Business logic
├── security.py          # Password hashing
└── deps.py              # Dependencies (get_current_user)
```

---

## ⚙️ Configuration

File: `app/core/config.py` (add these)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # JWT Settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Password Settings
    MIN_PASSWORD_LENGTH: int = 8
    
    class Config:
        env_file = ".env"

settings = Settings()
```

Example `.env`:
```bash
JWT_SECRET_KEY=your-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
```

---

## ✅ Tests

File: `tests/test_auth.py`

### Required Tests:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test successful user registration."""
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!",
        "full_name": "Test User"
    })
    
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["credits"] == 5
    assert "access_token" in data
    assert "refresh_token" in data

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test registration with existing email."""
    # Register first user
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    
    # Try to register again
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "AnotherPass123!"
    })
    
    assert response.status_code == 409

@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    """Test registration with weak password."""
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "weak"
    })
    
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login."""
    # Register user
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    
    # Login
    response = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert "access_token" in data

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Test login with wrong password."""
    # Register user
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    
    # Login with wrong password
    response = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPassword123!"
    })
    
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    """Test token refresh."""
    # Register and get tokens
    register_response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    
    refresh_token = register_response.json()["data"]["refresh_token"]
    
    # Refresh access token
    response = await client.post("/api/auth/refresh", json={
        "refresh_token": refresh_token
    })
    
    assert response.status_code == 200
    assert "access_token" in response.json()["data"]

@pytest.mark.asyncio
async def test_protected_endpoint(client: AsyncClient):
    """Test accessing protected endpoint."""
    # Register
    register_response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    
    access_token = register_response.json()["data"]["access_token"]
    
    # Access protected endpoint
    response = await client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "test@example.com"
```

---

## 📊 Success Criteria

- [ ] User can register with email/password
- [ ] Password is hashed (bcrypt)
- [ ] User receives 5 signup credits
- [ ] Referral code is generated
- [ ] User can login with credentials
- [ ] JWT tokens are generated correctly
- [ ] Tokens can be refreshed
- [ ] Protected endpoints require valid token
- [ ] Duplicate email is rejected (409)
- [ ] Weak passwords are rejected (400)
- [ ] Invalid credentials return 401
- [ ] All tests pass with >90% coverage

---

## 🚀 Implementation Order

1. **Setup** (30 min)
   - Create folder structure
   - Add dependencies to requirements.txt

2. **Models** (1 hour)
   - Create User model
   - Test database connection

3. **Security** (1 hour)
   - Password hashing functions
   - JWT token creation/verification

4. **Schemas** (1 hour)
   - Pydantic models
   - Validation logic

5. **Service** (3 hours)
   - register_user()
   - authenticate_user()
   - Token functions
   - Referral code generator

6. **Routes** (2 hours)
   - /register endpoint
   - /login endpoint
   - /refresh endpoint
   - /logout endpoint

7. **Dependencies** (1 hour)
   - get_current_user dependency

8. **Tests** (4 hours)
   - Write all test cases
   - Achieve >90% coverage

9. **Integration** (1 hour)
   - Add to main.py
   - Test end-to-end

**Total:** ~15 hours (2 days)

---

## 🔍 Example Usage

```python
# In your main.py
from fastapi import FastAPI
from app.auth.routes import router as auth_router

app = FastAPI()
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

# Using get_current_user dependency
from app.auth.deps import get_current_user
from app.auth.models import User

@app.get("/api/users/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"data": current_user}
```

---

## 📚 Additional Resources

- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT.io](https://jwt.io/)
- [Passlib Docs](https://passlib.readthedocs.io/)

---

**Module Status:** Ready for implementation  
**Last Updated:** February 4, 2026
