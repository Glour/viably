# Viably API Contracts

**Version:** 1.0  
**Base URL:** `https://api.viably.dev/api`  
**Authentication:** JWT Bearer Token

---

## 📋 Table of Contents

1. [Response Format](#response-format)
2. [Authentication](#authentication)
3. [Users](#users)
4. [Projects](#projects)
5. [Templates](#templates)
6. [Credits](#credits)
7. [Deployments](#deployments)
8. [WebSocket](#websocket)

---

## Response Format

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-04T12:00:00Z",
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  },
  "meta": {
    "timestamp": "2026-02-04T12:00:00Z",
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### HTTP Status Codes
```
200 OK              - Success
201 Created         - Resource created
204 No Content      - Success with no body
400 Bad Request     - Validation error
401 Unauthorized    - Not authenticated
403 Forbidden       - Not authorized
404 Not Found       - Resource not found
409 Conflict        - Resource conflict
422 Unprocessable   - Business logic error
429 Too Many Requests - Rate limit exceeded
500 Internal Error  - Server error
```

---

## Authentication

### Register
**POST** `/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "plan": "free",
      "credits": 5,
      "referral_code": "ABC12345",
      "created_at": "2026-02-04T12:00:00Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 86400
  }
}
```

**Errors:**
- `400` - Validation error (email format, password strength)
- `409` - Email already registered

---

### Login
**POST** `/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "plan": "starter",
      "credits": 150,
      "avatar_url": null
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 86400
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account inactive

---

### Refresh Token
**POST** `/auth/refresh`

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 86400
  }
}
```

---

### Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `204 No Content`

---

## Users

### Get Current User
**GET** `/users/me`

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "plan": "starter",
    "credits": 150,
    "referral_code": "ABC12345",
    "is_verified": true,
    "created_at": "2026-02-04T12:00:00Z",
    "last_login_at": "2026-02-04T14:00:00Z"
  }
}
```

---

### Update Current User
**PATCH** `/users/me`

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "full_name": "John Smith",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Smith",
    "avatar_url": "https://example.com/avatar.jpg",
    "plan": "starter",
    "credits": 150
  }
}
```

---

### Get Credit Balance
**GET** `/users/me/credits`

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`
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

### Get Credit Transactions
**GET** `/users/me/transactions`

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `page` (optional, default: 1)
- `per_page` (optional, default: 20, max: 100)
- `type` (optional, filter by transaction type)

**Response:** `200 OK`
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

## Projects

### List Projects
**GET** `/projects`

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `page` (optional, default: 1)
- `per_page` (optional, default: 20)
- `status` (optional, filter by status)
- `template_id` (optional, filter by template)

**Response:** `200 OK`
```json
{
  "data": {
    "projects": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "My Shop Bot",
        "description": "E-commerce bot for my store",
        "template": {
          "id": "...",
          "name": "Shop Bot",
          "category": "telegram_bot"
        },
        "status": "deployed",
        "deployed_url": "https://t.me/myshopbot",
        "is_public": false,
        "created_at": "2026-02-03T10:00:00Z",
        "updated_at": "2026-02-03T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

---

### Create Project
**POST** `/projects`

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "name": "My Shop Bot",
  "description": "E-commerce bot for my online store",
  "template_id": "550e8400-e29b-41d4-a716-446655440000",
  "config": {
    "shop_name": "My Store",
    "products": [
      {"name": "Product 1", "price": 1000},
      {"name": "Product 2", "price": 2000}
    ],
    "payment_provider": "yookassa"
  }
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Shop Bot",
    "description": "E-commerce bot for my online store",
    "template_id": "...",
    "config": { ... },
    "status": "draft",
    "created_at": "2026-02-04T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid configuration
- `404` - Template not found

---

### Get Project
**GET** `/projects/{id}`

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Shop Bot",
    "description": "E-commerce bot",
    "template": {
      "id": "...",
      "name": "Shop Bot",
      "category": "telegram_bot",
      "credit_cost": 5
    },
    "config": { ... },
    "status": "ready",
    "generated_code": {
      "files": {
        "main.py": "import asyncio\n...",
        "config.py": "...",
        "requirements.txt": "..."
      }
    },
    "deployed_url": null,
    "is_public": false,
    "created_at": "2026-02-03T10:00:00Z",
    "updated_at": "2026-02-03T12:00:00Z",
    "generated_at": "2026-02-03T11:30:00Z"
  }
}
```

**Errors:**
- `404` - Project not found
- `403` - Not authorized (not your project)

---

### Update Project
**PATCH** `/projects/{id}`

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "is_public": true
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "...",
    "name": "Updated Name",
    "description": "Updated description",
    "is_public": true,
    "updated_at": "2026-02-04T12:00:00Z"
  }
}
```

---

### Delete Project
**DELETE** `/projects/{id}`

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `204 No Content`

**Errors:**
- `404` - Project not found
- `403` - Not authorized

---

### Generate Code
**POST** `/projects/{id}/generate`

**Headers:** `Authorization: Bearer {access_token}`

**Request:** (empty body)

**Response:** `202 Accepted`
```json
{
  "data": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "generating",
    "estimated_time_seconds": 60,
    "credits_deducted": 5
  }
}
```

**Errors:**
- `422` - Insufficient credits
- `409` - Project already generating/deployed
- `404` - Project not found

**Notes:**
- This is an async operation
- Client should connect to WebSocket for real-time updates
- Or poll GET `/projects/{id}` for status changes

---

## Templates

### List Templates
**GET** `/templates`

**Query Parameters:**
- `category` (optional, filter by category)
- `search` (optional, search by name/description)

**Response:** `200 OK`
```json
{
  "data": {
    "templates": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Shop Bot",
        "slug": "shop-bot",
        "description": "E-commerce bot with catalog and cart",
        "category": "telegram_bot",
        "credit_cost": 5,
        "preview_image_url": "https://...",
        "features": [
          "Product catalog",
          "Shopping cart",
          "Payment integration"
        ],
        "tags": ["telegram", "ecommerce", "shop"],
        "usage_count": 150,
        "created_at": "2026-01-01T00:00:00Z"
      },
      {
        "id": "...",
        "name": "FAQ Bot",
        "slug": "faq-bot",
        "description": "Simple Q&A bot",
        "category": "telegram_bot",
        "credit_cost": 3,
        "features": ["Inline keyboard", "Quick answers"],
        "tags": ["telegram", "simple"],
        "usage_count": 320
      }
    ]
  }
}
```

---

### Get Template
**GET** `/templates/{id}`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Shop Bot",
    "slug": "shop-bot",
    "description": "Full-featured e-commerce bot",
    "category": "telegram_bot",
    "credit_cost": 5,
    "config_schema": {
      "type": "object",
      "properties": {
        "shop_name": {
          "type": "string",
          "title": "Shop Name"
        },
        "products": {
          "type": "array",
          "title": "Products",
          "items": {
            "type": "object",
            "properties": {
              "name": {"type": "string"},
              "price": {"type": "number"}
            }
          }
        }
      },
      "required": ["shop_name", "products"]
    },
    "preview_image_url": "https://...",
    "features": ["Catalog", "Cart", "Payments"],
    "tags": ["telegram", "ecommerce"],
    "usage_count": 150,
    "example_config": {
      "shop_name": "Demo Store",
      "products": [
        {"name": "Item 1", "price": 1000}
      ]
    }
  }
}
```

---

## Credits

### Purchase Credits
**POST** `/credits/purchase`

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "amount": 100,
  "payment_method": "card",
  "return_url": "https://viably.dev/dashboard"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "payment_url": "https://payment-provider.com/checkout/...",
    "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100,
    "price_usd": 10.00
  }
}
```

---

## Deployments

### Deploy Project
**POST** `/projects/{id}/deploy`

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "platform": "railway",
  "env_variables": {
    "BOT_TOKEN": "123456:ABC-DEF...",
    "DATABASE_URL": "postgresql://..."
  }
}
```

**Response:** `202 Accepted`
```json
{
  "data": {
    "deployment_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "platform": "railway",
    "estimated_time_seconds": 120
  }
}
```

---

### Get Deployment Status
**GET** `/deployments/{id}`

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "...",
    "platform": "railway",
    "status": "active",
    "url": "https://mybot-production.up.railway.app",
    "build_url": "https://railway.app/project/...",
    "logs": "...",
    "deployed_at": "2026-02-04T12:05:00Z"
  }
}
```

---

## WebSocket

### Connect
**WS** `/ws/{user_id}`

**Headers:** `Authorization: Bearer {access_token}`

**Connection URL:**
```
wss://api.viably.dev/ws/550e8400-e29b-41d4-a716-446655440000?token=eyJhbGciOiJIUzI1NiIs...
```

### Message Types

**Project Generation Progress:**
```json
{
  "type": "generation_progress",
  "data": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "generating",
    "progress": 45,
    "message": "Generating handlers..."
  }
}
```

**Generation Complete:**
```json
{
  "type": "generation_complete",
  "data": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "ready",
    "generated_at": "2026-02-04T12:01:30Z"
  }
}
```

**Generation Error:**
```json
{
  "type": "generation_error",
  "data": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "error",
    "error": "AI generation failed",
    "credits_refunded": 5
  }
}
```

**Deployment Status:**
```json
{
  "type": "deployment_status",
  "data": {
    "deployment_id": "...",
    "project_id": "...",
    "status": "deploying",
    "message": "Building Docker image..."
  }
}
```

---

## Rate Limits

```
Authentication endpoints: 10 requests per minute
API endpoints:           100 requests per minute
WebSocket connections:    10 per user
```

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1612454400
```

---

## Error Codes

```
VALIDATION_ERROR        - Input validation failed
AUTHENTICATION_REQUIRED - No valid token provided
INSUFFICIENT_CREDITS    - Not enough credits
RESOURCE_NOT_FOUND      - Resource doesn't exist
UNAUTHORIZED_ACCESS     - No permission to access
RATE_LIMIT_EXCEEDED     - Too many requests
INTERNAL_SERVER_ERROR   - Server error
```

---

**API Version:** 1.0  
**Last Updated:** February 4, 2026
