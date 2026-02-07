# API Contracts: Auth Endpoints

**Feature**: 015-api-client-auth
**Backend Base**: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)
**API Prefix**: `/api`

## POST /api/auth/login

**Description**: Аутентификация пользователя по email/password
**Rate Limit**: 5 req/min

### Request
```json
{
  "email": "user@example.com",
  "password": "SecurePass1!"
}
```

### Response 200
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar_url": null,
      "plan": "free",
      "credits": 100,
      "referral_code": "ABC12345",
      "is_verified": true,
      "created_at": "2026-01-15T10:30:00Z",
      "last_login_at": "2026-02-07T08:00:00Z"
    },
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 900
  }
}
```

### Response 401 — Invalid credentials
```json
{
  "detail": "Invalid email or password"
}
```

### Response 403 — Account inactive
```json
{
  "detail": "Account is inactive"
}
```

### Response 429 — Account locked (5+ failed attempts)
```json
{
  "detail": "Account temporarily locked. Try again later."
}
```

---

## POST /api/auth/register

**Description**: Регистрация нового пользователя
**Rate Limit**: 5 req/min

### Request
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass1!",
  "full_name": "Jane Doe",
  "referrer_code": "ABC12345"
}
```

### Response 200
```json
{
  "data": {
    "user": { "..." },
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 900
  }
}
```

### Response 409 — Email already exists
```json
{
  "detail": "User with this email already exists"
}
```

### Response 400 — Validation error
```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "Password must contain at least one uppercase letter",
      "type": "value_error"
    }
  ]
}
```

---

## POST /api/auth/refresh

**Description**: Обновление access token с ротацией refresh token
**Rate Limit**: 10 req/min

### Request
```json
{
  "refresh_token": "eyJhbGciOi..."
}
```

### Response 200
```json
{
  "data": {
    "access_token": "eyJhbGciOi...(new)",
    "refresh_token": "eyJhbGciOi...(new)",
    "token_type": "bearer",
    "expires_in": 900
  }
}
```

### Response 401 — Invalid/expired refresh token
```json
{
  "detail": "Invalid or expired refresh token"
}
```

**Note**: Старый refresh token инвалидируется (blacklist в Redis). При повторном использовании старого refresh token — ответ 401.

---

## POST /api/auth/logout

**Description**: Выход (blacklist обоих токенов)
**Auth**: Bearer token required

### Request Headers
```
Authorization: Bearer eyJhbGciOi...
```

### Request Body (optional)
```json
{
  "refresh_token": "eyJhbGciOi..."
}
```

### Response 204 — No Content

---

## GET /api/users/me

**Description**: Получение профиля текущего пользователя
**Auth**: Bearer token required
**Rate Limit**: 30 req/min

### Request Headers
```
Authorization: Bearer eyJhbGciOi...
```

### Response 200
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": null,
    "plan": "free",
    "credits": 100,
    "referral_code": "ABC12345",
    "is_verified": true,
    "created_at": "2026-01-15T10:30:00Z",
    "last_login_at": "2026-02-07T08:00:00Z"
  }
}
```

### Response 401 — Token expired/invalid
```json
{
  "detail": "Could not validate credentials"
}
```
