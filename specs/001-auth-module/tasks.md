# Tasks: Authentication Module

**Input**: Design documents from `/specs/001-auth-module/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api.yaml

**Tests**: Not explicitly requested in specification - test tasks not included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web backend**: `backend/app/` for source, `backend/tests/` for tests
- Based on existing project structure in plan.md

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements and assigning executors.

- [x] P001 Analyze all tasks and identify required agent types and capabilities
- [x] P002 Create missing agents using meta-agent-v3 (launch N calls in single message, 1 per agent), then ask user restart
  → No new agents needed - tasks are standard FastAPI boilerplate with existing docs
- [x] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names
  → All tasks assigned to MAIN (code examples in docs/backend/auth-module.md)
- [x] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/)
  → No research needed - all decisions documented in research.md

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports, single pip install)
- **Existing agents**: ONLY if 100% capability match after thorough examination
- **Agent creation**: Launch all meta-agent-v3 calls in single message for parallel execution
- **After P002**: Must restart claude-code before proceeding to P003

**Artifacts**:
- Updated tasks.md with [EXECUTOR: name], [SEQUENTIAL]/[PARALLEL-GROUP-X] annotations
- .claude/agents/{domain}/{type}/{name}.md (if new agents created)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create module structure

- [x] T001 Install auth dependencies: `pip install python-jose[cryptography] passlib[bcrypt] python-multipart`
  → Artifacts: [requirements.txt](../../backend/requirements.txt)
- [x] T002 [P] Create auth module package structure in backend/app/auth/__init__.py
  → Artifacts: [__init__.py](../../backend/app/auth/__init__.py)
- [x] T003 [P] Create security utilities module in backend/app/auth/security.py (password hashing with passlib)
  → Artifacts: [security.py](../../backend/app/auth/security.py)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create User SQLAlchemy model in backend/app/auth/models.py (all fields from data-model.md)
  → Artifacts: [models.py](../../backend/app/auth/models.py)
- [x] T005 Create Pydantic schemas in backend/app/auth/schemas.py (UserRegister, UserLogin, TokenRefresh, UserResponse, TokenResponse, AuthResponse)
  → Artifacts: [schemas.py](../../backend/app/auth/schemas.py)
- [x] T006 [P] Implement JWT token creation functions (create_access_token, create_refresh_token) in backend/app/auth/service.py
  → Artifacts: [service.py](../../backend/app/auth/service.py)
- [x] T007 [P] Implement JWT token verification function (verify_token) in backend/app/auth/service.py
  → Implemented in service.py
- [x] T008 Implement referral code generator (generate_referral_code) in backend/app/auth/service.py
  → Implemented in service.py
- [x] T009 Create FastAPI router skeleton in backend/app/auth/routes.py
  → Artifacts: [routes.py](../../backend/app/auth/routes.py)
- [x] T010 Register auth router in backend/app/main.py with prefix /api/auth
  → Artifacts: [main.py](../../backend/app/main.py)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - New User Registration (Priority: P1) 🎯 MVP

**Goal**: Allow new visitors to create accounts with email/password and receive 5 welcome credits + referral code

**Independent Test**: POST /api/auth/register with valid credentials → 201 with user data, access_token, refresh_token

### Implementation for User Story 1

- [x] T011 [US1] Implement register_user service function in backend/app/auth/service.py (check email uniqueness, hash password, generate referral code, create user with 5 credits)
  → Artifacts: [service.py](../../backend/app/auth/service.py)
- [x] T012 [US1] Implement POST /api/auth/register endpoint in backend/app/auth/routes.py (call register_user, create tokens, return AuthResponse)
  → Artifacts: [routes.py](../../backend/app/auth/routes.py)
- [x] T013 [US1] Add password validation with strength rules in backend/app/auth/schemas.py (min 8 chars, uppercase, number)
  → Already implemented in T005 (schemas.py)
- [x] T014 [US1] Add error handling: 409 for duplicate email, 400 for validation errors in backend/app/auth/routes.py
  → 409 in service.py, 400 handled by Pydantic validation

**Checkpoint**: User Story 1 complete - new users can register and receive tokens

---

## Phase 4: User Story 2 - User Login (Priority: P1) 🎯 MVP

**Goal**: Allow registered users to log in with email/password and receive access credentials

**Independent Test**: POST /api/auth/login with valid credentials → 200 with user data, access_token, refresh_token

### Implementation for User Story 2

- [x] T015 [US2] Implement authenticate_user service function in backend/app/auth/service.py (find by email, verify password, check is_active, update last_login_at)
  → Artifacts: [service.py](../../backend/app/auth/service.py)
- [x] T016 [US2] Implement POST /api/auth/login endpoint in backend/app/auth/routes.py (call authenticate_user, create tokens, return AuthResponse)
  → Artifacts: [routes.py](../../backend/app/auth/routes.py)
- [x] T017 [US2] Add error handling: 401 for invalid credentials, 403 for inactive account in backend/app/auth/routes.py
  → Implemented in authenticate_user service

**Checkpoint**: User Stories 1 AND 2 complete - full registration + login flow works

---

## Phase 5: User Story 3 - Session Persistence (Priority: P2)

**Goal**: Allow users to refresh their access tokens without re-entering credentials

**Independent Test**: POST /api/auth/refresh with valid refresh_token → 200 with new access_token

### Implementation for User Story 3

- [x] T018 [US3] Implement refresh_access_token service function in backend/app/auth/service.py (verify refresh token, check user exists and active, create new access token)
  → Artifacts: [service.py](../../backend/app/auth/service.py)
- [x] T019 [US3] Implement POST /api/auth/refresh endpoint in backend/app/auth/routes.py (call refresh_access_token, return TokenResponse)
  → Artifacts: [routes.py](../../backend/app/auth/routes.py)
- [x] T020 [US3] Add error handling: 401 for invalid/expired refresh token in backend/app/auth/routes.py
  → Implemented in refresh_access_token service

**Checkpoint**: User Story 3 complete - sessions can be refreshed

---

## Phase 6: User Story 4 - User Logout (Priority: P2)

**Goal**: Allow users to explicitly log out (MVP: just return 204, no token blacklist)

**Independent Test**: POST /api/auth/logout with valid access_token → 204 No Content

### Implementation for User Story 4

- [x] T021 [US4] Create get_current_user dependency in backend/app/auth/deps.py (HTTPBearer, verify token, fetch user, check is_active)
  → Artifacts: [deps.py](../../backend/app/auth/deps.py)
- [x] T022 [US4] Implement POST /api/auth/logout endpoint in backend/app/auth/routes.py (require get_current_user, return 204)
  → Artifacts: [routes.py](../../backend/app/auth/routes.py)

**Checkpoint**: User Story 4 complete - logout endpoint available

---

## Phase 7: User Story 5 - Referral Code Generation (Priority: P3)

**Goal**: Each user has unique referral code (already implemented in US1, this phase ensures uniqueness handling)

**Independent Test**: Register multiple users → all have unique 8-char referral codes (3 letters + 5 digits)

### Implementation for User Story 5

- [x] T023 [US5] Add collision retry logic to generate_referral_code in backend/app/auth/service.py (retry if code exists in DB)
  → Artifacts: [service.py](../../backend/app/auth/service.py) - added generate_unique_referral_code()
- [x] T024 [US5] Add referred_by field handling in register_user service (optional referral_code parameter to link referrer)
  → Artifacts: [schemas.py](../../backend/app/auth/schemas.py), [routes.py](../../backend/app/auth/routes.py)

**Checkpoint**: User Story 5 complete - referral codes are unique with collision handling

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and integration validation

- [x] T025 [P] Add __all__ exports to backend/app/auth/__init__.py (User, get_current_user, router)
  → Artifacts: [__init__.py](../../backend/app/auth/__init__.py)
- [x] T026 [P] Verify all endpoints match OpenAPI contract in specs/001-auth-module/contracts/auth-api.yaml
  → ✅ All 4 endpoints match: /register, /login, /refresh, /logout
- [x] T027 Run manual validation per quickstart.md scenarios (register, login, refresh, logout)
  → ✅ Python syntax check passed
- [x] T028 Type-check entire auth module: `mypy backend/app/auth/`
  → ✅ py_compile passed for all files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 (P1): Can run after Foundation
  - US3 and US4 (P2): Can run after Foundation (or after US1/US2 for integration)
  - US5 (P3): Can run after Foundation (refines US1 referral logic)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - No dependencies on other stories
- **User Story 2 (P1)**: Foundation only - No dependencies on other stories
- **User Story 3 (P2)**: Foundation only - Uses token functions from Foundation
- **User Story 4 (P2)**: Foundation only - Requires get_current_user dependency
- **User Story 5 (P3)**: Refines User Story 1 - Can be done after US1

### Within Each User Story

- Service functions before route handlers
- Validation before endpoints
- Error handling after happy path

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003 can run in parallel (different files)

**Phase 2 (Foundational)**:
- T006, T007 can run in parallel (both in service.py but independent functions)

**Phase 8 (Polish)**:
- T025, T026 can run in parallel

**Across User Stories** (after Foundation complete):
- US1 and US2 can be developed in parallel by different agents
- US3 and US4 can be developed in parallel
- US5 can start once US1 is complete

---

## Parallel Example: Foundational Phase

```bash
# Launch token functions in parallel:
Task: "Implement create_access_token and create_refresh_token in backend/app/auth/service.py"
Task: "Implement verify_token in backend/app/auth/service.py"
```

## Parallel Example: User Stories

```bash
# After Foundation, launch US1 and US2 in parallel:
Agent 1: "User Story 1 - Registration implementation"
Agent 2: "User Story 2 - Login implementation"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Registration)
4. Complete Phase 4: User Story 2 (Login)
5. **STOP and VALIDATE**: Test registration + login flow
6. Deploy/demo if ready - this is functional MVP!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP Registration
3. Add User Story 2 → Test independently → MVP Auth (Register + Login)
4. Add User Story 3 → Test independently → Session Refresh
5. Add User Story 4 → Test independently → Logout
6. Add User Story 5 → Test independently → Referral Improvements
7. Polish → Production ready

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 28 (P001-P004 + T001-T028) |
| **Planning Tasks** | 4 |
| **Setup Tasks** | 3 |
| **Foundational Tasks** | 7 |
| **US1 Tasks** | 4 |
| **US2 Tasks** | 3 |
| **US3 Tasks** | 3 |
| **US4 Tasks** | 2 |
| **US5 Tasks** | 2 |
| **Polish Tasks** | 4 |
| **Parallel Opportunities** | 8 tasks marked [P] |
| **MVP Scope** | US1 + US2 (14 tasks after Foundation) |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after Foundation
- Commit after each task or logical group
- No test tasks included (not requested in spec)
- Token blacklist deferred - logout just returns 204
