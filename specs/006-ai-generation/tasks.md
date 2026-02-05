# Tasks: AI Code Generation Module

**Input**: Design documents from `/specs/006-ai-generation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Tests included per spec.md requirement for comprehensive testing.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`, `backend/tests/`
- Module structure follows existing pattern: models.py, schemas.py, routes.py, service.py

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements, creating necessary agents, and assigning executors.

- [x] P001 Analyze all tasks and identify required agent types and capabilities
- [x] P002 Create missing agents using meta-agent-v3 (launch N calls in single message, 1 per agent), then ask user restart
  → No new agents needed - api-builder, test-writer, infrastructure-specialist exist
- [x] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names
- [x] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/)
  → No complex research needed - all resolved in research.md

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports, single pip install)
- **Existing agents**: ONLY if 100% capability match after thorough examination
- **Agent creation**: Launch all meta-agent-v3 calls in single message for parallel execution
- **After P002**: Must restart claude-code before proceeding to P003

**Artifacts**:
- Updated tasks.md with [EXECUTOR: name], [SEQUENTIAL]/[PARALLEL-GROUP-X] annotations
- .claude/agents/{domain}/{type}/{name}.md (if new agents created)
- research/*.md (if complex research identified)

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Add required dependencies and configuration for AI module

- [x] T001 Add anthropic>=0.20.0, celery>=5.3.0, redis>=5.0.0 to backend/requirements.txt [EXECUTOR: MAIN] [SEQUENTIAL]
  → Artifacts: [requirements.txt](../../backend/requirements.txt)
- [x] T002 Add AI generation settings to backend/app/core/config.py (ANTHROPIC_API_KEY, CELERY_BROKER_URL, CELERY_RESULT_BACKEND, GENERATION_COST, GENERATION_MAX_TOKENS, GENERATION_MODEL) [EXECUTOR: MAIN] [SEQUENTIAL]
  → Artifacts: [config.py](../../backend/app/core/config.py)
- [x] T003 [P] Create backend/app/ai/__init__.py module initialization [EXECUTOR: MAIN] [PARALLEL-GROUP-1]
  → Artifacts: [__init__.py](../../backend/app/ai/__init__.py)
- [x] T004 [P] Add get_current_admin_user dependency to backend/app/auth/deps.py (check if User has is_admin field first) [EXECUTOR: MAIN] [PARALLEL-GROUP-1]
  → Artifacts: [deps.py](../../backend/app/auth/deps.py), [models.py](../../backend/app/auth/models.py), [migration](../../backend/alembic/versions/d4e5f6g7h8i9_add_is_admin_to_users.py)

---

## Phase 2: Foundational (Core AI Components)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create AnthropicClient wrapper class in backend/app/ai/client.py with generate_code() async method [EXECUTOR: api-builder] [SEQUENTIAL]
  → Artifacts: [client.py](../../backend/app/ai/client.py)
- [x] T006 Create SYSTEM_PROMPT constant and build_generation_prompt() function in backend/app/ai/prompts.py [EXECUTOR: api-builder] [SEQUENTIAL]
  → Artifacts: [prompts.py](../../backend/app/ai/prompts.py)
- [x] T007 Create extract_code_files() function in backend/app/ai/prompts.py with regex pattern for markdown code blocks [EXECUTOR: api-builder] [SEQUENTIAL]
  → Artifacts: [prompts.py](../../backend/app/ai/prompts.py)
- [x] T008 Create AiStatusResponse schema in backend/app/ai/schemas.py [EXECUTOR: api-builder] [SEQUENTIAL]
  → Artifacts: [schemas.py](../../backend/app/ai/schemas.py)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Generate Code for Project (Priority: P1) 🎯 MVP

**Goal**: User can trigger code generation for a draft project, credits are deducted, and code is generated via Claude API

**Independent Test**: Create project with template, trigger generation, verify code saved to project.generated_code

### Tests for User Story 1

- [ ] T009 [P] [US1] Test build_generation_prompt() with variable replacement in backend/tests/test_ai.py [EXECUTOR: test-writer] [PARALLEL-GROUP-2]
- [ ] T010 [P] [US1] Test extract_code_files() with valid and empty responses in backend/tests/test_ai.py [EXECUTOR: test-writer] [PARALLEL-GROUP-2]
- [ ] T011 [P] [US1] Test generation service success with mocked API in backend/tests/test_ai.py [EXECUTOR: test-writer] [PARALLEL-GROUP-2]

### Implementation for User Story 1

- [ ] T012 [US1] Implement AIGenerationService.generate_project_code() in backend/app/ai/service.py (core generation logic: get project, get template, build prompt, call API, extract files, save to project) [EXECUTOR: api-builder] [SEQUENTIAL]
- [ ] T013 [US1] Update trigger_generation() in backend/app/projects/service.py to check credits and call deduct_credits() before setting status=generating [EXECUTOR: api-builder] [SEQUENTIAL]
- [ ] T014 [US1] Add logging throughout AIGenerationService with structured logging format in backend/app/ai/service.py [EXECUTOR: api-builder] [SEQUENTIAL]

**Checkpoint**: User Story 1 complete - synchronous generation works with credit deduction

---

## Phase 4: User Story 2 - View Generation Result (Priority: P1)

**Goal**: User can view generated code files after successful generation

**Independent Test**: Get project with status=ready and verify generated_code.files accessible

**Note**: This is already implemented via existing GET /projects/{id} endpoint. No new code required.

### Verification for User Story 2

- [ ] T015 [US2] Verify ProjectDetailResponse schema includes generated_code field in backend/app/projects/schemas.py [EXECUTOR: MAIN] [SEQUENTIAL]
- [ ] T016 [US2] Add test for viewing generated code via GET /projects/{id} in backend/tests/test_ai.py [EXECUTOR: test-writer] [SEQUENTIAL]

**Checkpoint**: User Story 2 complete - users can view generated code

---

## Phase 5: User Story 3 - Error Handling with Credit Refund (Priority: P1)

**Goal**: When generation fails, credits are refunded and user sees clear error message

**Independent Test**: Simulate API error, verify credits refunded and project.status=error with error_message

### Tests for User Story 3

- [ ] T017 [P] [US3] Test credit refund on API error in backend/tests/test_ai.py [EXECUTOR: test-writer] [PARALLEL-GROUP-3]
- [ ] T018 [P] [US3] Test error status and message saved to project in backend/tests/test_ai.py [EXECUTOR: test-writer] [PARALLEL-GROUP-3]

### Implementation for User Story 3

- [ ] T019 [US3] Add error handling with credit refund in AIGenerationService.generate_project_code() in backend/app/ai/service.py [EXECUTOR: api-builder] [SEQUENTIAL]
- [ ] T020 [US3] Add test for regeneration from error status (reset to draft first) in backend/tests/test_ai.py [EXECUTOR: test-writer] [SEQUENTIAL]

**Checkpoint**: User Story 3 complete - errors handled gracefully with refunds

---

## Phase 6: User Story 4 - Asynchronous Generation Processing (Priority: P2)

**Goal**: Generation runs in background via Celery, user gets immediate response

**Independent Test**: Trigger generation, verify immediate response, poll for completion

### Tests for User Story 4

- [ ] T021 [P] [US4] Test Celery task queuing with mocked worker in backend/tests/test_ai.py [EXECUTOR: test-writer] [SEQUENTIAL]

### Implementation for User Story 4

- [ ] T022 [US4] Create Celery app configuration in backend/app/ai/worker.py [EXECUTOR: infrastructure-specialist] [SEQUENTIAL]
- [ ] T023 [US4] Create process_generation Celery task in backend/app/ai/worker.py that calls AIGenerationService [EXECUTOR: infrastructure-specialist] [SEQUENTIAL]
- [ ] T024 [US4] Update trigger_generation() in backend/app/projects/service.py to queue Celery task instead of inline execution [EXECUTOR: api-builder] [SEQUENTIAL]
- [ ] T025 [US4] Add generation task queuing to POST /projects/{id}/generate response in backend/app/projects/routes.py [EXECUTOR: api-builder] [SEQUENTIAL]

**Checkpoint**: User Story 4 complete - async generation works via Celery

---

## Phase 7: User Story 5 - Retry Failed Generation (Priority: P2)

**Goal**: Temporary errors (timeout, rate limit) trigger automatic retry with exponential backoff

**Independent Test**: Simulate timeout, verify retry attempt, verify final success or refund after max retries

### Tests for User Story 5

- [ ] T026 [P] [US5] Test retry on temporary error (APITimeoutError) in backend/tests/test_ai.py [EXECUTOR: test-writer] [PARALLEL-GROUP-4]
- [ ] T027 [P] [US5] Test max retries exhausted triggers refund in backend/tests/test_ai.py [EXECUTOR: test-writer] [PARALLEL-GROUP-4]

### Implementation for User Story 5

- [ ] T028 [US5] Add @task decorators with autoretry_for, retry_backoff, max_retries to Celery task in backend/app/ai/worker.py [EXECUTOR: infrastructure-specialist] [SEQUENTIAL]
- [ ] T029 [US5] Add retry exception classification (retryable vs permanent) in backend/app/ai/worker.py [EXECUTOR: infrastructure-specialist] [SEQUENTIAL]

**Checkpoint**: User Story 5 complete - automatic retries with exponential backoff

---

## Phase 8: User Story 6 - Admin Monitoring (Priority: P3)

**Goal**: Admin users can check AI service status via dedicated endpoint

**Independent Test**: Call GET /api/ai/status as admin, verify response contains status and model

### Tests for User Story 6

- [ ] T030 [P] [US6] Test admin access to /ai/status endpoint in backend/tests/test_ai.py [EXECUTOR: test-writer] [PARALLEL-GROUP-5]
- [ ] T031 [P] [US6] Test non-admin rejected from /ai/status endpoint in backend/tests/test_ai.py [EXECUTOR: test-writer] [PARALLEL-GROUP-5]

### Implementation for User Story 6

- [ ] T032 [US6] Create admin status endpoint in backend/app/ai/routes.py with get_current_admin_user dependency [EXECUTOR: api-builder] [SEQUENTIAL]
- [ ] T033 [US6] Include ai_router in backend/app/main.py with prefix /api/ai [EXECUTOR: MAIN] [SEQUENTIAL]

**Checkpoint**: User Story 6 complete - admin monitoring available

---

## Phase 9: Polish & Integration

**Purpose**: Final integration, validation, and documentation

- [ ] T034 Run full test suite and verify all tests pass: pytest backend/tests/test_ai.py -v [EXECUTOR: MAIN] [SEQUENTIAL]
- [ ] T035 Verify type-check passes: mypy backend/app/ai/ [EXECUTOR: MAIN] [SEQUENTIAL]
- [ ] T036 Run quickstart.md validation (manual test of full flow) [EXECUTOR: MAIN] [SEQUENTIAL]
- [ ] T037 Update backend/README.md with AI module documentation if needed [EXECUTOR: MAIN] [SEQUENTIAL]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001, T002 completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1-US3 (P1): Core MVP, sequential dependency
  - US4-US5 (P2): Async enhancements, depend on US1-US3
  - US6 (P3): Admin feature, independent of US4-US5
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL
    ↓
Phase 3 (US1: Generate) ← MVP Core
    ↓
Phase 4 (US2: View) ← Verification only
    ↓
Phase 5 (US3: Errors) ← Critical for trust
    ↓
Phase 6 (US4: Async) ← Better UX
    ↓
Phase 7 (US5: Retry) ← Reliability

Phase 8 (US6: Admin) ← Independent, can parallel with US4-US5
    ↓
Phase 9 (Polish)
```

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel:
- **Phase 1**: T003, T004 parallel
- **Phase 3 Tests**: T009, T010, T011 parallel
- **Phase 5 Tests**: T017, T018 parallel
- **Phase 6 Tests**: T021 parallel with Phase 5
- **Phase 7 Tests**: T026, T027 parallel
- **Phase 8 Tests**: T030, T031 parallel

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch all tests for User Story 1 together:
Task: "Test build_generation_prompt() in backend/tests/test_ai.py"
Task: "Test extract_code_files() in backend/tests/test_ai.py"
Task: "Test generation service success in backend/tests/test_ai.py"

# Then sequential implementation:
Task: "Implement AIGenerationService.generate_project_code()"
Task: "Update trigger_generation() with credit deduction"
Task: "Add logging to AIGenerationService"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008)
3. Complete Phase 3: User Story 1 - Generate (T009-T014)
4. Complete Phase 4: User Story 2 - View (T015-T016)
5. Complete Phase 5: User Story 3 - Errors (T017-T020)
6. **STOP and VALIDATE**: Test full flow manually
7. Deploy if ready (synchronous generation MVP)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Generate) → Test → Basic generation works
3. Add US2 (View) → Test → Results visible
4. Add US3 (Errors) → Test → Error handling works → **MVP Complete!**
5. Add US4 (Async) → Test → Better UX
6. Add US5 (Retry) → Test → More reliable
7. Add US6 (Admin) → Test → Monitoring available
8. Polish → Production ready

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 0 | P001-P004 | Planning & Executor Assignment |
| 1 | T001-T004 | Setup (4 tasks) |
| 2 | T005-T008 | Foundational (4 tasks) |
| 3 | T009-T014 | US1: Generate Code (6 tasks) 🎯 MVP |
| 4 | T015-T016 | US2: View Result (2 tasks) |
| 5 | T017-T020 | US3: Error Handling (4 tasks) |
| 6 | T021-T025 | US4: Async Processing (5 tasks) |
| 7 | T026-T029 | US5: Retry Logic (4 tasks) |
| 8 | T030-T033 | US6: Admin Monitoring (4 tasks) |
| 9 | T034-T037 | Polish (4 tasks) |

**Total**: 37 tasks (4 planning + 33 implementation)

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach for US1-US3)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP scope: US1 + US2 + US3 (Phases 1-5, ~20 tasks)
