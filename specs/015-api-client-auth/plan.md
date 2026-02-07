# Implementation Plan: API Client & Auth Flow

**Branch**: `015-api-client-auth` | **Date**: 2026-02-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-api-client-auth/spec.md`

## Summary

Интеграция фронтенда с реальным бэкендом: HTTP-клиент на базе `ky`, JWT token management (localStorage + flag cookie), Zustand auth store, route protection через proxy.ts, замена mock API вызовов в auth screens на реальные endpoints. Фича frontend-only — бэкенд полностью готов.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Node.js 18+
**Primary Dependencies**: Next.js 16.1.6, ky (new), Zustand 5.0.11, Zod 4.3.6, react-hook-form 7.71.1, sonner 2.0.7
**Storage**: localStorage (tokens), cookie (session flag)
**Testing**: Manual testing (e2e) — unit tests вне scope этой фичи
**Target Platform**: Web (browser), Next.js App Router
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Login → dashboard < 3s, token refresh transparent
**Constraints**: Access token TTL 15min, refresh token TTL 7 days, rotation
**Scale/Scope**: Single-user session, ~5 protected route groups

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First | PASS | Full codebase exploration completed — patterns, types, stores, backend schemas |
| II. Single Source of Truth | PASS | AuthUser type defined once in types/index.ts, used everywhere |
| III. Library-First | PASS | ky chosen via research (R-001), covers >70% requirements |
| IV. Code Reuse & DRY | PASS | Reusing existing Zustand pattern, existing form validation, existing proxy.ts |
| V. Strict Type Safety | PASS | All types defined, no `any`, camelCase mapping from backend snake_case |
| VI. Atomic Task Execution | PASS | 6 independent tasks, each committable |
| VII. Quality Gates | PASS | Type-check + build verification after each task |
| VIII. Progressive Spec | PASS | Spec → Plan → Tasks flow followed |
| IX. Error Handling | PASS | Typed ApiError, user-facing toasts, no swallowed errors |
| X. Observability | N/A | Client-side only, no structured logging needed for MVP |
| XI. Accessibility | PASS | Auth screens already WCAG AA compliant (from 009-auth-screens) |

**Post-design re-check**: All gates PASS. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/015-api-client-auth/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Research decisions (ky, localStorage, Zustand, proxy.ts)
├── data-model.md        # AuthUser, AuthTokens, AuthState entities
├── quickstart.md        # Setup & verification guide
├── contracts/
│   └── auth-api.md      # Auth API contracts (login, register, refresh, logout, /me)
├── checklists/
│   └── requirements.md  # Spec quality validation
└── tasks.md             # (will be created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── lib/
│   └── api/
│       ├── client.ts          # NEW — ky instance + interceptors + response unwrap
│       ├── tokens.ts          # NEW — token storage (localStorage + flag cookie)
│       └── auth.ts            # MODIFY — replace mock functions with real API calls
├── stores/
│   └── auth.ts                # NEW — Zustand auth store (user, isLoading, login, logout, etc.)
├── types/
│   └── index.ts               # MODIFY — add AuthUser, AuthResponse, TokenResponse, ApiError types
├── proxy.ts                   # MODIFY — update cookie check from 'session' to 'viably_session'
├── components/
│   └── auth/
│       └── protected-route.tsx # NEW — client-side auth guard component
├── app/
│   ├── layout.tsx             # MODIFY — wrap with auth initialization
│   └── (auth)/
│       ├── login/page.tsx     # MODIFY — use authStore.login() instead of mockLogin
│       ├── register/page.tsx  # MODIFY — use authStore.register() instead of mockRegister
│       └── forgot-password/page.tsx # MODIFY — use real API call
└── package.json               # MODIFY — add ky dependency
```

**Structure Decision**: Frontend-only changes. Backend is production-ready. Web application structure with `frontend/` as the primary workspace.

## Design Decisions

### D-001: ky over axios

ky выбран как HTTP-клиент (research R-001):
- Fetch-based → нативная совместимость с Next.js
- 3.3 KB vs 11.7 KB (axios)
- Встроенные hooks для JWT refresh flow
- TypeScript-first

### D-002: Zustand over React Context

Zustand store для auth state (research R-003):
- Консистентность с проектом (все stores на Zustand)
- `getState()` доступен из interceptors (вне React дерева)
- Selector subscriptions → минимальные re-renders
- Не нужен Provider wrapper

### D-003: localStorage + Flag Cookie

Двойная стратегия хранения (research R-002):
- **localStorage**: `viably_access_token`, `viably_refresh_token` — для Authorization header
- **Cookie**: `viably_session=1` (не httpOnly) — для proxy.ts route protection
- Бэкенд возвращает токены в JSON body → httpOnly cookies невозможны без прокси

### D-004: Concurrent Refresh Prevention

При множественных 401 ответах:
- Первый 401 инициирует refresh
- Последующие 401 ждут результат первого refresh (Promise queue)
- После получения нового токена — все ожидающие запросы повторяются
- Реализация через ky hooks + shared Promise variable

### D-005: Response Format Bridge

Мост между форматами backend → frontend:
- Backend: `{ data: {...} }` wrapper
- Frontend: `{ success: true, data } | { success: false, error }`
- Трансформация в ky `afterResponse` hook
- ApiError для типизированных ошибок

### D-006: Type Mapping (snake_case → camelCase)

Backend использует snake_case, frontend — camelCase:
- Маппинг в API layer при десериализации ответа
- `full_name` → `fullName`, `avatar_url` → `avatarUrl`, etc.
- Один utility `mapUserResponse()` для преобразования

## Complexity Tracking

> No Constitution violations — table not needed.
