# Data Model: Auth Screens (009)

**Date**: 2026-02-06
**Feature**: 009-auth-screens

---

## Overview

Auth screens are primarily frontend-only for MVP. Data models represent client-side form state and validation schemas. No database entities are created in this feature — backend integration is deferred.

---

## Entities

### LoginFormData

Represents the login form submission payload.

| Field    | Type   | Validation                         | Required |
|----------|--------|------------------------------------|----------|
| email    | string | Valid email format                 | Yes      |
| password | string | Minimum 8 characters               | Yes      |

**States**: idle → loading → success (redirect) | error (toast + field errors)

---

### RegisterFormData

Represents the registration form submission payload.

| Field           | Type    | Validation                                          | Required |
|-----------------|---------|-----------------------------------------------------|----------|
| name            | string  | 2-50 characters                                     | Yes      |
| email           | string  | Valid email format                                   | Yes      |
| password        | string  | Min 8 chars, 1 uppercase, 1 number, 1 special char  | Yes      |
| confirmPassword | string  | Must match password                                  | Yes      |
| agreeToTerms    | boolean | Must be true                                         | Yes      |

**States**: idle → loading → success (redirect) | error (toast + field errors)

---

### ForgotPasswordFormData

Represents the forgot password form submission payload.

| Field | Type   | Validation         | Required |
|-------|--------|--------------------|----------|
| email | string | Valid email format | Yes      |

**States**: idle → loading → success (show confirmation) | error (show error message)

---

### PasswordStrength

Computed value derived from password content.

| Level  | Score | Visual     | Criteria                                    |
|--------|-------|------------|---------------------------------------------|
| Weak   | 1/4   | Red bar    | Only length >= 8                            |
| Fair   | 2/4   | Orange bar | Length + 1 of (uppercase, number, special)  |
| Good   | 3/4   | Yellow bar | Length + 2 of (uppercase, number, special)  |
| Strong | 4/4   | Green bar  | Length + uppercase + number + special        |

**Rules checked**:
1. Length >= 8 characters
2. Contains uppercase letter (`/[A-Z]/`)
3. Contains number (`/[0-9]/`)
4. Contains special character (`/[^A-Za-z0-9]/`)

---

### AuthFormState (generic)

Common state pattern for all auth forms.

| Field        | Type                                    | Description                     |
|--------------|-----------------------------------------|---------------------------------|
| status       | 'idle' \| 'loading' \| 'error' \| 'success' | Current form submission state  |
| fieldErrors  | Record<string, string>                  | Per-field validation errors      |
| serverError  | string \| null                          | Server-side error message        |

---

## Relationships

```
LoginFormData ─────→ AuthFormState (form lifecycle)
RegisterFormData ──→ AuthFormState (form lifecycle)
                  └→ PasswordStrength (computed from password field)
ForgotPasswordFormData → AuthFormState (form lifecycle)
```

---

## Mock API Contract (for frontend development)

Until backend integration, forms will use mock async functions that simulate:
- **Login**: 1s delay → success (any valid input) or error (specific test email)
- **Register**: 1s delay → success or error (duplicate email)
- **Forgot Password**: 1s delay → success or error (unknown email)

Mock functions will be placed in `lib/api/auth.ts` with the same interface as future real API calls.
