# Backend Module: Users

**Module:** `app/users`  
**Status:** Not Started  
**Priority:** P0 (Must have for MVP)  
**Estimated Time:** 3 days  
**Dependencies:** Auth Module

---

## 📋 Overview

The Users module handles user profile management, credit balance viewing, and account settings.

**Responsibilities:**
- Get current user profile
- Update user profile (name, avatar)
- View credit balance and transactions
- User account management

---

## 🔧 Dependencies

```python
# requirements.txt additions
# (Most already covered by Auth module)
sqlalchemy>=2.0
pydantic>=2.5.0
```

---

## 🗄️ Database Models

### Uses existing User model from Auth

No new models needed - uses `app/auth/models.py::User`

---

## 📝 Pydantic Schemas

File: `app/users/schemas.py`

```python
from pydantic import BaseModel, EmailStr, Field, HttpUrl
from datetime import datetime
from uuid import UUID

class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: str | None = Field(None, max_length=255)
    avatar_url: HttpUrl | None = None

class UserResponse(BaseModel):
    """Public user data response"""
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

class CreditBalanceResponse(BaseModel):
    """User credit balance info"""
    credits: int
    plan: str
    daily_bonus: dict | None = None  # {"amount": 3, "next_bonus_at": "..."}
    rollover_limit: int

class CreditTransactionResponse(BaseModel):
    """Single credit transaction"""
    id: UUID
    amount: int
    balance_after: int
    transaction_type: str
    description: str | None
    project: dict | None = None  # {"id": "...", "name": "..."}
    created_at: datetime
    
    class Config:
        from_attributes = True

class CreditTransactionsListResponse(BaseModel):
    """Paginated list of transactions"""
    transactions: list[CreditTransactionResponse]
    pagination: dict  # {"page": 1, "per_page": 20, "total": 45, "total_pages": 3}
```

---

## 🛣️ API Endpoints

File: `app/users/routes.py`

### GET /api/users/me

Get current authenticated user profile.

**Headers:** `Authorization: Bearer {access_token}`

**Response:** 200 OK
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "plan": "starter",
    "credits": 150,
    "referral_code": "ABC12345",
    "is_verified": true,
    "created_at": "2026-02-04T12:00:00Z",
    "last_login_at": "2026-02-04T14:00:00Z"
  }
}
```

**Errors:**
- 401: Unauthorized (invalid token)
- 403: User inactive

---

### PATCH /api/users/me

Update current user profile.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "full_name": "John Smith",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response:** 200 OK
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Smith",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "plan": "starter",
    "credits": 150
  }
}
```

**Errors:**
- 400: Validation error
- 401: Unauthorized

---

### GET /api/users/me/credits

Get current user credit balance.

**Headers:** `Authorization: Bearer {access_token}`

**Response:** 200 OK
```json
{
  "data": {
    "credits": 150,
    "plan": "starter",
    "daily_bonus": {
      "amount": 3,
      "next_bonus_at": "2026-02-05T00:00:00Z"
    },
    "rollover_limit": 200
  }
}
```

---

### GET /api/users/me/transactions

Get user credit transaction history (paginated).

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `page` (optional, default: 1)
- `per_page` (optional, default: 20, max: 100)
- `type` (optional, filter by transaction type)

**Response:** 200 OK
```json
{
  "data": {
    "transactions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "amount": -5,
        "balance_after": 145,
        "transaction_type": "generation",
        "description": "Generated Shop Bot",
        "project": {
          "id": "...",
          "name": "My Shop Bot"
        },
        "created_at": "2026-02-04T12:00:00Z"
      },
      {
        "id": "...",
        "amount": 3,
        "balance_after": 150,
        "transaction_type": "daily_bonus",
        "description": "Daily bonus",
        "project": null,
        "created_at": "2026-02-04T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

---

## 💼 Business Logic

File: `app/users/service.py`

### Core Functions:

```python
async def get_user_by_id(
    user_id: UUID,
    db: AsyncSession
) -> User:
    """
    Get user by ID.
    
    Raises:
        HTTPException 404: If user not found
    """

async def update_user_profile(
    user_id: UUID,
    full_name: str | None,
    avatar_url: str | None,
    db: AsyncSession
) -> User:
    """
    Update user profile fields.
    
    Returns:
        Updated user object
    """

async def get_credit_balance(
    user_id: UUID,
    db: AsyncSession
) -> dict:
    """
    Get user credit balance with rollover info.
    
    Returns:
        {
            "credits": 150,
            "plan": "starter",
            "daily_bonus": {...},
            "rollover_limit": 200
        }
    """

async def get_credit_transactions(
    user_id: UUID,
    page: int = 1,
    per_page: int = 20,
    transaction_type: str | None = None,
    db: AsyncSession
) -> dict:
    """
    Get paginated credit transactions for user.
    
    Args:
        user_id: User UUID
        page: Page number (1-indexed)
        per_page: Items per page (max 100)
        transaction_type: Optional filter by type
    
    Returns:
        {
            "transactions": [...],
            "pagination": {...}
        }
    """

def calculate_rollover_limit(plan: str) -> int:
    """
    Calculate rollover limit based on plan.
    
    Returns:
        0 (free), 200 (starter), 600 (pro), 2000 (business)
    """

async def get_next_daily_bonus_time(
    user_id: UUID,
    db: AsyncSession
) -> datetime | None:
    """
    Calculate when next daily bonus is available.
    
    Returns:
        Next bonus timestamp or None if already claimed today
    """
```

---

## 📁 File Structure

```
app/users/
├── __init__.py          # Module exports
├── schemas.py           # Pydantic schemas
├── routes.py            # FastAPI routes
├── service.py           # Business logic
└── deps.py              # Dependencies (if needed)
```

---

## ✅ Tests

File: `tests/test_users.py`

### Required Tests:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, auth_token: str):
    """Test GET /api/users/me"""
    response = await client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert "id" in data
    assert "email" in data
    assert "credits" in data

@pytest.mark.asyncio
async def test_get_user_unauthorized(client: AsyncClient):
    """Test GET /api/users/me without token"""
    response = await client.get("/api/users/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_update_user_profile(client: AsyncClient, auth_token: str):
    """Test PATCH /api/users/me"""
    response = await client.patch(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "full_name": "Updated Name",
            "avatar_url": "https://example.com/avatar.jpg"
        }
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["full_name"] == "Updated Name"
    assert data["avatar_url"] == "https://example.com/avatar.jpg"

@pytest.mark.asyncio
async def test_update_invalid_avatar_url(client: AsyncClient, auth_token: str):
    """Test PATCH with invalid URL"""
    response = await client.patch(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"avatar_url": "not-a-url"}
    )
    
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_get_credit_balance(client: AsyncClient, auth_token: str):
    """Test GET /api/users/me/credits"""
    response = await client.get(
        "/api/users/me/credits",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert "credits" in data
    assert "plan" in data
    assert "rollover_limit" in data

@pytest.mark.asyncio
async def test_get_credit_transactions(client: AsyncClient, auth_token: str):
    """Test GET /api/users/me/transactions"""
    response = await client.get(
        "/api/users/me/transactions",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert "transactions" in data
    assert "pagination" in data
    assert isinstance(data["transactions"], list)

@pytest.mark.asyncio
async def test_get_transactions_pagination(client: AsyncClient, auth_token: str):
    """Test pagination parameters"""
    response = await client.get(
        "/api/users/me/transactions?page=1&per_page=10",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    pagination = data["pagination"]
    assert pagination["page"] == 1
    assert pagination["per_page"] == 10

@pytest.mark.asyncio
async def test_get_transactions_by_type(client: AsyncClient, auth_token: str):
    """Test filtering by transaction type"""
    response = await client.get(
        "/api/users/me/transactions?type=daily_bonus",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    for tx in data["transactions"]:
        assert tx["transaction_type"] == "daily_bonus"
```

---

## 📊 Success Criteria

- [ ] User can view their profile
- [ ] User can update name and avatar
- [ ] User can view credit balance
- [ ] Daily bonus info is shown
- [ ] Rollover limit displayed correctly
- [ ] Transaction history is paginated
- [ ] Can filter transactions by type
- [ ] Protected endpoints require auth
- [ ] Invalid avatar URL rejected (400)
- [ ] All tests pass with >90% coverage

---

## 🚀 Implementation Order

1. **Schemas** (1 hour)
   - Create all Pydantic models
   - Add validation rules

2. **Service** (2 hours)
   - get_user_by_id()
   - update_user_profile()
   - get_credit_balance()
   - get_credit_transactions()
   - Helper functions

3. **Routes** (2 hours)
   - GET /users/me
   - PATCH /users/me
   - GET /users/me/credits
   - GET /users/me/transactions

4. **Tests** (3 hours)
   - Write all test cases
   - Achieve >90% coverage

5. **Integration** (1 hour)
   - Add to main.py
   - Test end-to-end

**Total:** ~9 hours (1-2 days)

---

## 🔍 Example Usage

```python
# In main.py
from app.users.routes import router as users_router

app.include_router(users_router, prefix="/api/users", tags=["users"])

# Usage in other modules
from app.users.service import get_user_by_id

user = await get_user_by_id(user_id, db)
```

---

## 📚 Additional Notes

### Rollover Limits by Plan

```python
ROLLOVER_LIMITS = {
    "free": 0,
    "starter": 200,
    "pro": 600,
    "business": 2000
}
```

### Daily Bonus Logic

Daily bonus is handled by Credits module, but Users module displays:
- Bonus amount based on plan
- Next available time (00:00 UTC next day)

---

**Module Status:** Ready for implementation  
**Last Updated:** February 4, 2026
