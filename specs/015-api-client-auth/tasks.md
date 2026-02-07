# Tasks: API Client & Auth Flow

**Input**: Design documents from `/specs/015-api-client-auth/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/auth-api.md

**Tests**: Not requested — manual e2e verification per quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements, creating necessary agents, and assigning executors.

- [x] P001 Analyze all tasks and identify required agent types and capabilities
- [x] P002 Create missing agents using meta-agent-v3 (launch N calls in single message, 1 per agent), then ask user restart
- [x] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names
- [x] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/)

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports, single npm install)
- **Existing agents**: ONLY if 100% capability match after thorough examination
- **Agent creation**: Launch all meta-agent-v3 calls in single message for parallel execution
- **After P002**: Must restart claude-code before proceeding to P003

**Artifacts**:
- Updated tasks.md with [EXECUTOR: name], [SEQUENTIAL]/[PARALLEL-GROUP-X] annotations
- .claude/agents/{domain}/{type}/{name}.md (if new agents created)
- research/*.md (if complex research identified)

---

## Phase 1: Setup

**Purpose**: Install dependencies, configure environment, ensure project builds

- [x] T001 Install `ky` HTTP client library in `frontend/package.json` — run `cd frontend && npm install ky`
  → Artifacts: [package.json](frontend/package.json), [package-lock.json](frontend/package-lock.json)
- [x] T002 Ensure `frontend/.env.local` exists with `NEXT_PUBLIC_API_URL=http://localhost:8000`
  → Artifacts: [.env.local](frontend/.env.local)

**Checkpoint**: `npm run build` passes, ky is importable

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, token management, and API client — MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Add auth-related TypeScript types in `frontend/types/index.ts` — AuthUser (matching backend UserResponse with camelCase fields: id, email, fullName, avatarUrl, plan, credits, referralCode, isVerified, createdAt, lastLoginAt), AuthResponse (user + accessToken + refreshToken + tokenType + expiresIn), TokenResponse (accessToken + refreshToken), ApiError (message, status, fieldErrors?), LoginRequest, RegisterRequest. Update existing UserProfile to extend AuthUser with computed dashboard fields (projectsCount, projectsLimit, deployedCount). Keep backward compatibility with existing UserProfile consumers. See data-model.md for full field specs
- [x] T004 [P] Create token management module in `frontend/lib/api/tokens.ts` — functions: setTokens(accessToken, refreshToken) saves to localStorage keys `viably_access_token` / `viably_refresh_token` AND sets document.cookie `viably_session=1` (path=/, sameSite=lax); getAccessToken() reads from localStorage; getRefreshToken() reads from localStorage; clearTokens() removes both localStorage keys AND deletes `viably_session` cookie; isTokenExpired(token) decodes JWT payload (base64), checks exp < Date.now()/1000. Export all functions. No external dependencies beyond browser APIs
- [x] T005 Create ky API client instance in `frontend/lib/api/client.ts` — configure: baseURL from `process.env.NEXT_PUBLIC_API_URL + '/api'`, timeout 30000ms. Add `beforeRequest` hook: reads access token via getAccessToken(), sets Authorization Bearer header if token exists. Add `afterResponse` hook for 401 handling: if 401 AND request not already retried → call refreshTokens() (POST /auth/refresh with current refresh token via raw ky, NOT the intercepted instance), if success → setTokens with new pair → retry original request with new token; if refresh fails → clearTokens() + window.location.href = '/login'. CRITICAL: implement concurrent refresh prevention — use module-level `let refreshPromise: Promise<string|null> | null = null` so multiple 401s share one refresh call. Add afterResponse hook for 403: clearTokens + redirect /login. Export `api` instance and typed helper functions: `api.get<T>(url)`, `api.post<T>(url, body)`, `api.put<T>(url, body)`, `api.patch<T>(url, body)`, `api.delete<T>(url)`. Add `mapUserResponse(raw)` utility that converts backend snake_case UserResponse to frontend camelCase AuthUser (full_name→fullName, avatar_url→avatarUrl, referral_code→referralCode, is_verified→isVerified, created_at→createdAt, last_login_at→lastLoginAt). Add `unwrapResponse<T>(response)` that extracts `.data` from backend wrapper. Add `parseApiError(error)` that transforms ky HTTPError into ApiError (reads `detail` field — string or validation array). See contracts/auth-api.md for exact response shapes and research.md R-001 for ky decision

**Checkpoint**: Types compile, tokens can be stored/read, API client is importable. Run `cd frontend && npx tsc --noEmit` — must pass

---

## Phase 3: User Story 1 — Вход в систему (Priority: P1) 🎯 MVP

**Goal**: Пользователь может войти с реальными credentials, получить токены, попасть на dashboard

**Independent Test**: Открыть /login, ввести валидные email/password → redirect на /dashboard с данными пользователя

### Implementation

- [ ] T006 Create Zustand auth store in `frontend/stores/auth.ts` — state: user (AuthUser|null), isLoading (boolean, starts true). Computed getter: isAuthenticated = user !== null. Actions: login(email, password) → POST /api/auth/login via api client → unwrap response → mapUserResponse → setTokens → set user; checkAuth() → getAccessToken() → if token exists → GET /api/users/me → unwrap → mapUserResponse → set user, else set user=null → finally set isLoading=false; setUser(user). Follow existing Zustand pattern from `frontend/stores/dashboard.ts`. Error handling: login throws ApiError (caller handles toast). See data-model.md AuthState for full action signatures
- [ ] T007 Replace mock login with real API in `frontend/app/(auth)/login/page.tsx` — import useAuthStore. In onSubmit: replace `mockLogin({email, password})` with `const { login } = useAuthStore.getState()` then `await login(data.email, data.password)`. On success: toast.success + router.push('/dashboard'). On error: catch ApiError → toast.error(error.message) for 401 "Invalid credentials", 429 "Account locked", 403 "Account inactive". Keep existing form validation (react-hook-form + zod), loading state (isSubmitting), shake animation on error. Remove `mockLogin` import. Add handling for `returnUrl` query param: `const returnUrl = searchParams.get('returnUrl') || '/dashboard'` → redirect to returnUrl on success. See contracts/auth-api.md for error response shapes
- [ ] T008 Add auth initialization in `frontend/app/layout.tsx` — create a client component `AuthInitializer` (can be inline or separate small component) that calls `useAuthStore.getState().checkAuth()` on mount (useEffect, runs once). Place `<AuthInitializer />` inside ThemeProvider, before {children}. This ensures auth check runs on every page load. No visual output — just triggers checkAuth. Keep existing ThemeProvider + Toaster structure unchanged

**Checkpoint**: Login with real backend credentials works. Tokens saved in localStorage. User visible in auth store. `npx tsc --noEmit` passes

---

## Phase 4: User Story 2 — Регистрация нового аккаунта (Priority: P1)

**Goal**: Новый пользователь может создать аккаунт и попасть на dashboard

**Independent Test**: Открыть /register, заполнить форму → аккаунт создан, redirect на /dashboard

### Implementation

- [ ] T009 Add register action to auth store in `frontend/stores/auth.ts` — register(data: {email, password, fullName?, referrerCode?}) → POST /api/auth/register via api client with body {email, password, full_name: data.fullName, referrer_code: data.referrerCode} → unwrap response → mapUserResponse → setTokens → set user. Error handling: throws ApiError (caller handles). Note: backend expects snake_case in request body
- [ ] T010 Replace mock register with real API in `frontend/app/(auth)/register/page.tsx` — import useAuthStore. In onSubmit: replace `mockRegister({name, email, password})` with `await useAuthStore.getState().register({email: data.email, password: data.password, fullName: data.name})`. On success: toast.success + router.push('/dashboard'). On error: catch ApiError → handle 409 "Email already registered" toast.error, 400 validation errors. Keep existing form validation (registerSchema with password strength), confirmPassword check, agreeToTerms. Remove `mockRegister` import

**Checkpoint**: Registration with new email works. Duplicate email shows error toast. `npx tsc --noEmit` passes

---

## Phase 5: User Story 3 — Автоматическое продление сессии (Priority: P1)

**Goal**: Token refresh происходит прозрачно при 401, пользователь не разлогинивается

**Independent Test**: Войти, симулировать expired token (удалить access_token из localStorage), сделать действие → запрос должен пройти после auto-refresh

### Implementation

- [ ] T011 Verify and enhance 401 refresh flow in `frontend/lib/api/client.ts` — ensure the afterResponse hook correctly: 1) detects 401 status, 2) checks refreshPromise is null (not already refreshing), 3) calls POST /api/auth/refresh with current refreshToken, 4) on success: setTokens with new pair, retries original request, 5) on refresh failure: clearTokens + redirect /login, 6) concurrent requests: if refreshPromise exists, await it then retry with new token. Test edge case: multiple simultaneous 401s should result in only ONE refresh call. Also handle: 500 error on refresh → don't clear tokens (keep for next retry), only clear on 401 from refresh endpoint. See spec.md edge cases for full behavior

**Checkpoint**: Token refresh works transparently. Multiple 401s don't cause race conditions. `npx tsc --noEmit` passes

---

## Phase 6: User Story 4 — Защита маршрутов (Priority: P2)

**Goal**: Неавторизованные пользователи перенаправляются на /login, авторизованные — не видят auth pages

**Independent Test**: Без авторизации открыть /dashboard → redirect на /login?returnUrl=/dashboard. С авторизацией открыть /login → redirect на /dashboard

### Implementation

- [ ] T012 [P] Update proxy.ts middleware in `frontend/proxy.ts` — change cookie check from `request.cookies.has("session")` to `request.cookies.has("viably_session")`. Add returnUrl support: when redirecting to /login, append `?returnUrl=${encodeURIComponent(pathname)}` to redirect URL. Keep existing route lists (authRoutes, protectedRoutes) and matcher config. This is a minimal change — 2 lines modified
- [ ] T013 [P] Create ProtectedRoute client component in `frontend/components/auth/protected-route.tsx` — "use client" component. Uses `useAuthStore` selectors: user, isLoading. While isLoading → render loading skeleton (div with animate-pulse, matching existing app skeleton pattern). If !isLoading && !user → redirect to /login via router.push. If !isLoading && user → render children. Export as default. Usage: wrap protected page content. Props: `{ children: React.ReactNode }`
- [ ] T014 Integrate ProtectedRoute into dashboard layout in `frontend/app/(dashboard)/layout.tsx` (or wherever the dashboard group layout lives) — wrap {children} with `<ProtectedRoute>{children}</ProtectedRoute>`. Also add redirect logic for auth pages: in `frontend/app/(auth)/layout.tsx` — if user is authenticated (check useAuthStore), redirect to /dashboard. This prevents logged-in users from seeing login/register pages

**Checkpoint**: Route protection works both ways. No flash of protected content. `npx tsc --noEmit` passes

---

## Phase 7: User Story 5 — Выход из системы (Priority: P2)

**Goal**: Пользователь может выйти, токены отзываются на сервере

**Independent Test**: Нажать "Выйти" → redirect на /login, localStorage очищен, /dashboard недоступен

### Implementation

- [ ] T015 Add logout action to auth store in `frontend/stores/auth.ts` — logout() → try: POST /api/auth/logout via api client with body {refresh_token: getRefreshToken()} and Authorization header → clearTokens() → set user = null → window.location.href = '/login'. Catch: even if server call fails, still clearTokens + set user null + redirect (graceful degradation — tokens cleared locally even if server-side blacklist fails)
- [ ] T016 Replace mock auth API module in `frontend/lib/api/auth.ts` — replace entire file contents. Export real API functions: loginApi(data: LoginRequest) → api.post('/auth/login', data), registerApi(data: RegisterRequest) → api.post('/auth/register', data), logoutApi(refreshToken?: string) → api.post('/auth/logout', {refresh_token: refreshToken}), refreshTokenApi(refreshToken: string) → api.post('/auth/refresh', {refresh_token: refreshToken}), forgotPasswordApi(email: string) → api.post('/auth/forgot-password', {email}), getCurrentUser() → api.get('/users/me'). Each function unwraps response and maps types appropriately. Remove all mock functions (mockLogin, mockRegister, mockForgotPassword) and mock delay logic. Update auth store to use these functions instead of direct api calls if needed for cleaner separation

**Checkpoint**: Logout clears everything, server tokens blacklisted. Back button → /login redirect. `npx tsc --noEmit` passes

---

## Phase 8: User Story 6 — Восстановление пароля (Priority: P3)

**Goal**: Пользователь может запросить восстановление пароля через email

**Independent Test**: Ввести email на /forgot-password → сообщение "Проверьте почту" (одинаковый ответ для любого email)

### Implementation

- [ ] T017 Replace mock forgot-password with real API in `frontend/app/(auth)/forgot-password/page.tsx` — import forgotPasswordApi from lib/api/auth. In onSubmit: replace `mockForgotPassword({email})` with `await forgotPasswordApi(data.email)`. On success: show success state "Проверьте вашу почту" (keep existing success UI). On error: still show success message (security: don't reveal if email exists). Remove `mockForgotPassword` import. Keep existing form validation and UI structure

**Checkpoint**: Forgot password sends real request. Same success message regardless of email existence. `npx tsc --noEmit` passes

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error handling edge cases, cleanup, final validation

- [ ] T018 Add network error handling in `frontend/lib/api/client.ts` — in ky error hook or wrapper: catch TypeError (network error / no connection) → throw ApiError with message "Нет соединения с сервером" and status 0. This covers the edge case from spec: "потеря интернет-соединения"
- [ ] T019 Clean up unused mock data and imports across auth-related files — verify no remaining imports of `mockLogin`, `mockRegister`, `mockForgotPassword`. Check `frontend/lib/api/auth.ts` has no mock code. Check `frontend/lib/data/` for any auth-specific mock data that can be removed. Ensure no dead code remains
- [ ] T020 Run full type-check and build validation — `cd frontend && npx tsc --noEmit && npm run build`. Fix any type errors. Verify all pages render without hydration errors
- [ ] T021 Run quickstart.md manual verification — follow all 4 verification scenarios from `specs/015-api-client-auth/quickstart.md`: login flow, token refresh, route protection, logout. Document any issues found and fix them

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (ky installed). T005 depends on T003 (types) and T004 (tokens)
- **US1 Login (Phase 3)**: Depends on Phase 2 (api client + types + tokens)
- **US2 Register (Phase 4)**: Depends on Phase 3 (auth store exists from T006)
- **US3 Token Refresh (Phase 5)**: Depends on Phase 2 (already built into client.ts in T005, T011 enhances/verifies)
- **US4 Route Protection (Phase 6)**: Depends on Phase 3 (auth store with checkAuth)
- **US5 Logout (Phase 7)**: Depends on Phase 3 (auth store)
- **US6 Forgot Password (Phase 8)**: Depends on Phase 7 (T016 creates real auth API module)
- **Polish (Phase 9)**: Depends on all previous phases

### User Story Dependencies

- **US1 (Login)**: Foundation only — no other story dependencies
- **US2 (Register)**: Depends on US1 (auth store created there, adds register action)
- **US3 (Token Refresh)**: Foundation only — built into API client, verified after US1
- **US4 (Route Protection)**: Depends on US1 (needs auth store with checkAuth)
- **US5 (Logout)**: Depends on US1 (adds logout to auth store + creates real auth API module)
- **US6 (Forgot Password)**: Depends on US5 (uses auth API module created in T016)

### Within Phases — Parallel Opportunities

- **Phase 2**: T003 and T004 are parallel (different files). T005 depends on both
- **Phase 6**: T012 and T013 are parallel (proxy.ts vs component). T014 depends on T013

### Parallel Execution Examples

```bash
# Phase 2 — parallel group:
Task: "Add auth types in frontend/types/index.ts"         # T003
Task: "Create token management in frontend/lib/api/tokens.ts"  # T004
# Then sequential:
Task: "Create ky API client in frontend/lib/api/client.ts"     # T005

# Phase 6 — parallel group:
Task: "Update proxy.ts cookie check"                       # T012
Task: "Create ProtectedRoute component"                    # T013
# Then sequential:
Task: "Integrate ProtectedRoute into layouts"              # T014
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005)
3. Complete Phase 3: User Story 1 — Login (T006-T008)
4. **STOP and VALIDATE**: Login works end-to-end with real backend
5. Can demo/deploy at this point

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Login) → **MVP deployed** — users can log in
3. Add US2 (Register) → New users can create accounts
4. Add US3 (Token Refresh) → Sessions don't expire every 15 min
5. Add US4 (Route Protection) → Security enforced
6. Add US5 (Logout) → Full auth lifecycle + real API module
7. Add US6 (Forgot Password) → Password recovery
8. Polish → Edge cases, cleanup, validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks generated (manual testing per quickstart.md)
- Backend is production-ready — all changes are frontend-only
- Each phase checkpoint includes `npx tsc --noEmit` type-check
- Total: 21 implementation tasks + 4 planning tasks = 25 tasks
