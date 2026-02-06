# API Contracts: Auth Screens (009)

**Date**: 2026-02-06
**Status**: Mock (frontend-only for MVP)

---

## Overview

These contracts define the interface between auth forms and the backend. For MVP, all endpoints are mocked client-side. The contract ensures a clean migration path when real backend is integrated.

---

## POST /api/auth/login

**Description**: Authenticate user with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "MyPassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com"
  },
  "redirectTo": "/dashboard"
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Response (422 Validation Error)**:
```json
{
  "success": false,
  "error": "Validation failed",
  "fieldErrors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

---

## POST /api/auth/register

**Description**: Create new user account.

**Request**:
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "MyPassword123!",
  "confirmPassword": "MyPassword123!",
  "agreeToTerms": true
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com"
  },
  "redirectTo": "/dashboard"
}
```

**Response (409 Conflict)**:
```json
{
  "success": false,
  "error": "An account with this email already exists"
}
```

**Response (422 Validation Error)**:
```json
{
  "success": false,
  "error": "Validation failed",
  "fieldErrors": {
    "name": "Name must be 2-50 characters",
    "password": "Password must contain uppercase, number, and special character"
  }
}
```

---

## POST /api/auth/forgot-password

**Description**: Request password reset link.

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Reset link sent to user@example.com"
}
```

**Response (404 Not Found)**:
```json
{
  "success": false,
  "error": "No account found with this email"
}
```

---

## Common Response Types

### AuthResponse
```typescript
type AuthResponse = {
  success: true
  user: { id: string; name: string; email: string }
  redirectTo: string
} | {
  success: false
  error: string
  fieldErrors?: Record<string, string>
}
```

### ForgotPasswordResponse
```typescript
type ForgotPasswordResponse = {
  success: true
  message: string
} | {
  success: false
  error: string
}
```
