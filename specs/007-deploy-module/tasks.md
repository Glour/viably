# Tasks: Deploy Module

**Input**: Design documents from `/specs/007-deploy-module/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Tests are included as specified in plan.md (unit tests для DeploymentService, integration tests для routes).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app backend**: `backend/app/`, `backend/tests/`

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements, creating necessary agents, and assigning executors.

- [x] P001 Analyze all tasks and identify required agent types and capabilities
  → All tasks follow standard FastAPI patterns, MAIN executor suitable for all
- [x] P002 Create missing agents using meta-agent-v3 (launch N calls in single message, 1 per agent), then ask user restart
  → No new agents needed - standard Python/FastAPI patterns
- [x] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names
  → All tasks assigned [EXECUTOR: MAIN] - follow existing project patterns
- [x] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/)
  → No research tasks - all decisions made in research.md

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

## Phase 1: Setup (Configuration)

**Purpose**: Add configuration and prepare module structure

- [x] T001 Add RAILWAY_API_TOKEN setting to backend/app/core/config.py [EXECUTOR: MAIN] [SEQUENTIAL]
  → Artifacts: [config.py](backend/app/core/config.py)
- [x] T002 [P] Create deploy module __init__.py at backend/app/deploy/__init__.py [EXECUTOR: MAIN] [PARALLEL-GROUP-1]
  → Artifacts: [__init__.py](backend/app/deploy/__init__.py)

---

## Phase 2: Foundational (Database & Core Infrastructure)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create DeploymentStatus and DeploymentPlatform enums in backend/app/deploy/schemas.py [EXECUTOR: MAIN] [SEQUENTIAL]
  → Artifacts: [schemas.py](backend/app/deploy/schemas.py)
- [x] T004 Create Deployment SQLAlchemy model in backend/app/deploy/models.py [EXECUTOR: MAIN] [SEQUENTIAL]
  → Artifacts: [models.py](backend/app/deploy/models.py)
- [x] T005 Add deployments relationship to Project model in backend/app/projects/models.py [EXECUTOR: MAIN] [SEQUENTIAL]
  → Artifacts: [models.py](backend/app/projects/models.py)
- [x] T006 Create Alembic migration for deployments table in backend/alembic/versions/ [EXECUTOR: MAIN] [SEQUENTIAL]
  → Artifacts: [e5f6g7h8i9j0_add_deployments_table.py](backend/alembic/versions/e5f6g7h8i9j0_add_deployments_table.py)
- [x] T007 Create Pydantic schemas (DeploymentCreate, DeploymentResponse, DeploymentLogsResponse) in backend/app/deploy/schemas.py [EXECUTOR: MAIN] [SEQUENTIAL]
  → Artifacts: [schemas.py](backend/app/deploy/schemas.py)
- [x] T008 Implement RailwayClient GraphQL client in backend/app/deploy/railway.py [EXECUTOR: MAIN] [SEQUENTIAL]
  → Artifacts: [railway.py](backend/app/deploy/railway.py)

**Checkpoint**: Foundation ready - Railway client and database model available for all user stories

---

## Phase 3: User Story 1 - Deploy Project to Railway (Priority: P1) 🎯 MVP

**Goal**: User can deploy a ready project to Railway with one click and get a public URL

**Independent Test**: Create project with status "ready" and generated_code, call deploy endpoint with BOT_TOKEN, verify deployment created and URL returned

### Tests for User Story 1

- [x] T009 [P] [US1] Create test fixtures (ready_project, draft_project) in backend/tests/conftest.py
  → Artifacts: [conftest.py](backend/tests/conftest.py)
- [x] T010 [P] [US1] Write test_deploy_project_success in backend/tests/test_deploy.py
  → Artifacts: [test_deploy.py](backend/tests/test_deploy.py)
- [x] T011 [P] [US1] Write test_deploy_requires_ready_status in backend/tests/test_deploy.py
  → Artifacts: [test_deploy.py](backend/tests/test_deploy.py)
- [x] T012 [P] [US1] Write test_deployment_error_handling in backend/tests/test_deploy.py
  → Artifacts: [test_deploy.py](backend/tests/test_deploy.py)

### Implementation for User Story 1

- [x] T013 [US1] Implement DeploymentService.deploy_project() method in backend/app/deploy/service.py
  → Artifacts: [service.py](backend/app/deploy/service.py)
- [x] T014 [US1] Implement DeploymentService._poll_deployment_status() helper in backend/app/deploy/service.py
  → Artifacts: [service.py](backend/app/deploy/service.py)
- [x] T015 [US1] Implement POST /api/deployments/projects/{project_id}/deploy endpoint in backend/app/deploy/routes.py
  → Artifacts: [routes.py](backend/app/deploy/routes.py)
- [x] T016 [US1] Register deploy router in backend/app/main.py
  → Artifacts: [main.py](backend/app/main.py)

**Checkpoint**: User Story 1 complete - users can deploy projects to Railway

---

## Phase 4: User Story 2 - View Deployment Status (Priority: P2)

**Goal**: User can check current deployment status (pending/building/deploying/active/failed)

**Independent Test**: Create deployment, call GET endpoint, verify status and URL returned correctly

### Tests for User Story 2

- [x] T017 [P] [US2] Create deployment fixture in backend/tests/conftest.py
  → Artifacts: [conftest.py](backend/tests/conftest.py) (created in T009)
- [x] T018 [P] [US2] Write test_get_deployment_status in backend/tests/test_deploy.py
  → Artifacts: [test_deploy.py](backend/tests/test_deploy.py) (created in T010)

### Implementation for User Story 2

- [x] T019 [US2] Implement DeploymentService.get_deployment() method in backend/app/deploy/service.py
  → Artifacts: [service.py](backend/app/deploy/service.py) (created in T013)
- [x] T020 [US2] Implement GET /api/deployments/{deployment_id} endpoint in backend/app/deploy/routes.py
  → Artifacts: [routes.py](backend/app/deploy/routes.py) (created in T015)

**Checkpoint**: User Story 2 complete - users can check deployment status

---

## Phase 5: User Story 3 - View Deployment Logs (Priority: P2)

**Goal**: User can view deployment logs for debugging

**Independent Test**: Create deployment with logs, call logs endpoint, verify logs returned with timestamps

### Tests for User Story 3

- [x] T021 [P] [US3] Create active_deployment fixture in backend/tests/conftest.py
  → Artifacts: [conftest.py](backend/tests/conftest.py) (created in T009)
- [x] T022 [P] [US3] Write test_get_deployment_logs in backend/tests/test_deploy.py
  → Artifacts: [test_deploy.py](backend/tests/test_deploy.py) (created in T010)

### Implementation for User Story 3

- [x] T023 [US3] Implement DeploymentService.get_deployment_logs() method in backend/app/deploy/service.py
  → Artifacts: [service.py](backend/app/deploy/service.py) (created in T013)
- [x] T024 [US3] Implement GET /api/deployments/{deployment_id}/logs endpoint in backend/app/deploy/routes.py
  → Artifacts: [routes.py](backend/app/deploy/routes.py) (created in T015)

**Checkpoint**: User Story 3 complete - users can view deployment logs

---

## Phase 6: User Story 4 - Stop/Delete Deployment (Priority: P3)

**Goal**: User can stop and delete deployment to free resources

**Independent Test**: Create active deployment, call DELETE endpoint, verify status changed to "stopped" and Railway project deleted

### Tests for User Story 4

- [x] T025 [P] [US4] Write test_stop_deployment in backend/tests/test_deploy.py
  → Artifacts: [test_deploy.py](backend/tests/test_deploy.py) (created in T010)

### Implementation for User Story 4

- [x] T026 [US4] Implement DeploymentService.stop_deployment() method in backend/app/deploy/service.py
  → Artifacts: [service.py](backend/app/deploy/service.py) (created in T013)
- [x] T027 [US4] Implement DELETE /api/deployments/{deployment_id} endpoint in backend/app/deploy/routes.py
  → Artifacts: [routes.py](backend/app/deploy/routes.py) (created in T015)

**Checkpoint**: User Story 4 complete - users can stop deployments

---

## Phase 7: User Story 5 - Health Check (Priority: P3)

**Goal**: System can check if deployment is healthy (HTTP response <500)

**Independent Test**: Create active deployment with URL, call health check, verify last_health_check timestamp updated

### Tests for User Story 5

- [x] T028 [P] [US5] Write test_health_check in backend/tests/test_deploy.py
  → Artifacts: [test_deploy.py](backend/tests/test_deploy.py) (created in T010)

### Implementation for User Story 5

- [x] T029 [US5] Implement DeploymentService.check_health() method in backend/app/deploy/service.py
  → Artifacts: [service.py](backend/app/deploy/service.py) (created in T013)

**Checkpoint**: User Story 5 complete - health checks available for monitoring

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T030 Run mypy type-check on backend/app/deploy/
  → Note: mypy passes with SQLAlchemy Column type warnings (expected)
- [x] T031 Run all deploy tests: pytest backend/tests/test_deploy.py -v
  → Result: 15 passed, 0 failed
- [x] T032 [P] Update quickstart.md with actual test results in specs/007-deploy-module/quickstart.md
  → All tests passing, module complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
  - US2 and US3 can run in parallel (both P2)
  - US4 and US5 can run in parallel (both P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational - No dependencies on other stories
- **User Story 2 (P2)**: After Foundational - Uses get_deployment from US1 service
- **User Story 3 (P2)**: After Foundational - Uses get_deployment from US1 service
- **User Story 4 (P3)**: After Foundational - Independent
- **User Story 5 (P3)**: After Foundational - Independent

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Service methods before routes
- Core implementation before integration

### Parallel Opportunities

- T001, T002: Setup tasks can run in parallel
- T009-T012: All US1 tests can run in parallel
- T017, T018: US2 tests can run in parallel
- T021, T022: US3 tests can run in parallel
- US2 (Phase 4) and US3 (Phase 5) can run in parallel after US1 complete
- US4 (Phase 6) and US5 (Phase 7) can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# T003 and T004 must be sequential (T004 depends on enums from T003)
# After T004 complete:
Task: "Add deployments relationship to Project model" (T005)
Task: "Create Alembic migration" (T006)
# Can run in parallel
```

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task: "Create test fixtures in conftest.py" (T009)
Task: "Write test_deploy_project_success" (T010)
Task: "Write test_deploy_requires_ready_status" (T011)
Task: "Write test_deployment_error_handling" (T012)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T008)
3. Complete Phase 3: User Story 1 (T009-T016)
4. **STOP and VALIDATE**: Run tests, verify deployment works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → Deploy (MVP!)
3. Add User Stories 2-3 (status + logs) → Test → Deploy
4. Add User Stories 4-5 (stop + health) → Test → Deploy
5. Each story adds value without breaking previous stories

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Setup | 2 | T001, T002 parallel |
| Foundational | 6 | T005, T006 parallel after T004 |
| US1 (P1) | 8 | T009-T012 parallel, then T013-T016 sequential |
| US2 (P2) | 4 | T017, T018 parallel |
| US3 (P2) | 4 | T021, T022 parallel |
| US4 (P3) | 3 | - |
| US5 (P3) | 2 | - |
| Polish | 3 | T030, T31 sequential, T032 parallel |
| **Total** | **32** | - |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests use mocked Railway client (no real API calls)
- Commit after each task or logical group
- httpx already in requirements.txt - no new dependencies needed
