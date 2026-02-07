# Data Model: API Client & Auth Flow

**Feature**: 015-api-client-auth
**Date**: 2026-02-07

## Entities

### AuthUser

Представление авторизованного пользователя. Маппится на backend `UserResponse`.

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| id | string (UUID) | Уникальный идентификатор | backend |
| email | string | Email пользователя | backend |
| fullName | string \| null | Полное имя | backend (full_name) |
| avatarUrl | string \| null | URL аватара | backend (avatar_url) |
| plan | "free" \| "starter" \| "pro" \| "business" | План подписки | backend |
| credits | number | Баланс кредитов | backend |
| referralCode | string | Реферальный код | backend (referral_code) |
| isVerified | boolean | Верифицирован ли email | backend (is_verified) |
| createdAt | string (ISO 8601) | Дата регистрации | backend (created_at) |
| lastLoginAt | string \| null | Дата последнего входа | backend (last_login_at) |

**Validation rules**:
- `email`: valid email format
- `plan`: one of enum values
- `credits`: non-negative integer

**Mapping**: backend snake_case → frontend camelCase (e.g., `full_name` → `fullName`)

### AuthTokens

Пара токенов для текущей сессии.

| Field | Type | Description |
|-------|------|-------------|
| accessToken | string | JWT access token (15 min TTL) |
| refreshToken | string | JWT refresh token (7 day TTL, single-use via rotation) |

**Storage**: localStorage (`viably_access_token`, `viably_refresh_token`)
**Flag cookie**: `viably_session=1` (для proxy.ts route protection)

### AuthState (Zustand Store)

Глобальное состояние авторизации.

| Field | Type | Description |
|-------|------|-------------|
| user | AuthUser \| null | Текущий пользователь |
| isLoading | boolean | Проверка сессии при загрузке |
| isAuthenticated | boolean | Computed: user !== null |

**Actions**:
| Action | Signature | Description |
|--------|-----------|-------------|
| login | (email: string, password: string) => Promise\<void\> | POST /auth/login → save tokens → fetch user |
| register | (data: RegisterData) => Promise\<void\> | POST /auth/register → save tokens → set user |
| logout | () => Promise\<void\> | POST /auth/logout → clear tokens → clear user |
| checkAuth | () => Promise\<void\> | GET /users/me → set user or clear |
| setUser | (user: AuthUser \| null) => void | Прямая установка user |

## State Transitions

```
[Initial Load]
  │
  ├─ has tokens? ──yes──→ GET /users/me ──success──→ [Authenticated]
  │                                      ──fail─────→ [Unauthenticated]
  └─ no tokens ────────→ [Unauthenticated]

[Unauthenticated]
  │
  ├─ login() ──success──→ [Authenticated]
  ├─ register() ──success──→ [Authenticated]
  └─ navigate to protected ──→ redirect /login?returnUrl=...

[Authenticated]
  │
  ├─ logout() ──→ [Unauthenticated]
  ├─ 401 response ──→ refresh token ──success──→ [Authenticated] (retry request)
  │                                  ──fail─────→ [Unauthenticated]
  └─ 403 response ──→ [Unauthenticated] (account deactivated)
```

## API Response Types

### Backend → Frontend Mapping

```
Backend: { data: AuthResponse }
  ↓ unwrap
Frontend: { user: AuthUser, accessToken: string, refreshToken: string }

Backend: { data: TokenResponse }
  ↓ unwrap
Frontend: { accessToken: string, refreshToken: string }

Backend: { data: UserResponse }
  ↓ unwrap
Frontend: AuthUser

Backend: { detail: "Error message" } (4xx/5xx)
  ↓ transform
Frontend: ApiError { message: string, status: number }
```

### Error Response Format

Backend возвращает ошибки в формате:
- `{ detail: "message" }` — стандартные HTTP ошибки
- `{ detail: [{ msg: "...", loc: [...] }] }` — ошибки валидации

Frontend трансформирует в:
- `ApiError { message: string, status: number, fieldErrors?: Record<string, string> }`
