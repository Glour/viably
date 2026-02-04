# Quickstart: Users Module

**Feature**: 002-users-module
**Date**: 2026-02-04

## Prerequisites

- Auth module implemented and working
- PostgreSQL database running
- Python 3.11+ with dependencies installed

## Quick Start

### 1. Apply Migration

```bash
cd backend
alembic upgrade head
```

### 2. Run Development Server

```bash
uvicorn app.main:app --reload
```

### 3. Test Endpoints

#### Get Profile
```bash
curl -X GET http://localhost:8000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Update Profile
```bash
curl -X PATCH http://localhost:8000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "John Smith", "avatar_url": "https://example.com/avatar.jpg"}'
```

#### Get Credit Balance
```bash
curl -X GET http://localhost:8000/api/users/me/credits \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get Transaction History
```bash
curl -X GET "http://localhost:8000/api/users/me/transactions?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Filter Transactions by Type
```bash
curl -X GET "http://localhost:8000/api/users/me/transactions?type=daily_bonus" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## File Structure

```
backend/app/users/
├── __init__.py          # Module exports
├── models.py            # CreditTransaction model
├── schemas.py           # Pydantic request/response schemas
├── service.py           # Business logic
└── routes.py            # FastAPI endpoints
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/me` | GET | Get current user profile |
| `/api/users/me` | PATCH | Update profile (name, avatar) |
| `/api/users/me/credits` | GET | Get credit balance + daily bonus info |
| `/api/users/me/transactions` | GET | Get paginated transaction history |

## Response Format

All endpoints return responses in the format:
```json
{
  "data": { ... }
}
```

## Authentication

All endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

Obtain token via `/api/auth/login` or `/api/auth/register` endpoints.

## Error Codes

| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid URL, field too long) |
| 401 | Missing or invalid token |
| 403 | User account inactive |

## Running Tests

```bash
cd backend
pytest tests/test_users.py -v
```

## Plan-Specific Values

| Plan | Rollover Limit | Daily Bonus |
|------|---------------|-------------|
| free | 0 | 1 credit |
| starter | 200 | 3 credits |
| pro | 600 | 5 credits |
| business | 2000 | 10 credits |
