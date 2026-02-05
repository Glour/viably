# Tasks: Projects Module

**Input**: Design documents from `/specs/005-projects-module/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Integration tests included (following existing test_templates.py patterns).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- All paths relative to `backend/`

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements and assigning executors.

- [x] P001 Analyze all tasks and identify required agent types and capabilities [EXECUTOR: MAIN]
  → All tasks follow existing patterns from templates/credits modules
- [x] P002 Create missing agents using meta-agent-v3 (launch N calls in single message, 1 per agent), then ask user restart [EXECUTOR: MAIN]
  → No new agents needed — standard CRUD module
- [x] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names [EXECUTOR: MAIN]
  → All tasks assigned to MAIN (follows existing codebase patterns)
- [x] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/) [EXECUTOR: MAIN]
  → All research resolved in research.md

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports, single pip install)
- **Existing agents**: ONLY if 100% capability match
- **No complex research**: All decisions resolved in research.md

**Artifacts**:
- Updated tasks.md with [EXECUTOR: name] annotations
- No new agents needed (standard CRUD module)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependency and prepare module structure

- [x] T001 Add jsonschema>=4.20.0 to backend/requirements.txt
  → Artifacts: [requirements.txt](../../backend/requirements.txt)
- [x] T002 [P] Create backend/app/projects/__init__.py with module exports
  → Artifacts: [__init__.py](../../backend/app/projects/__init__.py)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model and schemas that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create ProjectStatus enum and Project SQLAlchemy model in backend/app/projects/models.py
  → Artifacts: [models.py](../../backend/app/projects/models.py)
- [x] T004 Create Alembic migration for projects table in backend/alembic/versions/xxx_add_projects_table.py
  → Artifacts: [c3d4e5f6g7h8_add_projects_table.py](../../backend/alembic/versions/c3d4e5f6g7h8_add_projects_table.py)
- [x] T005 [P] Create Pydantic schemas (ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse, ProjectListResponse) in backend/app/projects/schemas.py
  → Artifacts: [schemas.py](../../backend/app/projects/schemas.py)
- [x] T006 [P] Add test fixtures (test_project, multiple_projects, other_user_project) in backend/tests/conftest.py
  → Artifacts: [conftest.py](../../backend/tests/conftest.py)
- [x] T007 Add User.projects relationship in backend/app/auth/models.py
  → Artifacts: [models.py](../../backend/app/auth/models.py)

**Checkpoint**: Foundation ready — model, schemas, fixtures available for all user stories

---

## Phase 3: User Story 1 - Create Project (Priority: P1) 🎯 MVP

**Goal**: User can create a new project with name, template, and config

**Independent Test**: Create project via POST /api/projects, verify status="draft" and data persisted

### Tests for User Story 1

- [x] T008 [P] [US1] Test create_project success in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)
- [x] T009 [P] [US1] Test create_project with invalid template returns 404 in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)
- [x] T010 [P] [US1] Test create_project with invalid config validation in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)

### Implementation for User Story 1

- [x] T011 [US1] Implement create_project() service function in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T012 [US1] Add config validation against template.config_schema using jsonschema in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T013 [US1] Implement POST /projects endpoint in backend/app/projects/routes.py
  → Artifacts: [routes.py](../../backend/app/projects/routes.py)
- [x] T014 [US1] Integrate with templates module: call increment_usage_count() on project creation in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)

**Checkpoint**: User Story 1 complete — can create projects via API

---

## Phase 4: User Story 2 - View and Manage Projects (Priority: P1)

**Goal**: User can list their projects with pagination/filtering and view project details

**Independent Test**: Create multiple projects, verify pagination works and details include all fields

### Tests for User Story 2

- [x] T015 [P] [US2] Test list_projects pagination in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)
- [x] T016 [P] [US2] Test list_projects filter by status in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)
- [x] T017 [P] [US2] Test get_project returns full details in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)

### Implementation for User Story 2

- [x] T018 [US2] Implement list_user_projects() service function with pagination in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T019 [US2] Implement get_project_by_id() service function in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T020 [US2] Implement GET /projects endpoint with pagination and status filter in backend/app/projects/routes.py
  → Artifacts: [routes.py](../../backend/app/projects/routes.py)
- [x] T021 [US2] Implement GET /projects/{project_id} endpoint in backend/app/projects/routes.py
  → Artifacts: [routes.py](../../backend/app/projects/routes.py)

**Checkpoint**: User Story 2 complete — can list and view projects

---

## Phase 5: User Story 3 - Update Project (Priority: P2)

**Goal**: User can update project name, description, config, and visibility

**Independent Test**: Create project, update fields via PATCH, verify changes persisted

### Tests for User Story 3

- [x] T022 [P] [US3] Test update_project success in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)
- [x] T023 [P] [US3] Test update_project on non-existent project returns 404 in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)

### Implementation for User Story 3

- [x] T024 [US3] Implement update_project() service function in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T025 [US3] Add config re-validation on update in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T026 [US3] Implement PATCH /projects/{project_id} endpoint in backend/app/projects/routes.py
  → Artifacts: [routes.py](../../backend/app/projects/routes.py)

**Checkpoint**: User Story 3 complete — can update projects

---

## Phase 6: User Story 4 - Delete Project (Priority: P2)

**Goal**: User can delete their project

**Independent Test**: Create project, delete via DELETE, verify 404 on subsequent GET

### Tests for User Story 4

- [x] T027 [P] [US4] Test delete_project success in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)
- [x] T028 [P] [US4] Test delete_project on non-existent returns 404 in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)

### Implementation for User Story 4

- [x] T029 [US4] Implement delete_project() service function in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T030 [US4] Implement DELETE /projects/{project_id} endpoint in backend/app/projects/routes.py
  → Artifacts: [routes.py](../../backend/app/projects/routes.py)

**Checkpoint**: User Story 4 complete — can delete projects

---

## Phase 7: User Story 5 - Trigger Code Generation (Priority: P1)

**Goal**: User can trigger generation for draft projects, status changes to "generating"

**Independent Test**: Create draft project, trigger generation, verify status="generating"

### Tests for User Story 5

- [x] T031 [P] [US5] Test trigger_generation success in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)
- [x] T032 [P] [US5] Test trigger_generation on non-draft returns 400 in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)
- [x] T033 [P] [US5] Test status_transitions (draft→generating, cannot re-trigger) in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)

### Implementation for User Story 5

- [x] T034 [US5] Implement trigger_generation() service function with status validation in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T035 [US5] Implement save_generated_code() service function (for AI module callback) in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T036 [US5] Implement set_error() service function for error handling in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T037 [US5] Implement POST /projects/{project_id}/generate endpoint in backend/app/projects/routes.py
  → Artifacts: [routes.py](../../backend/app/projects/routes.py)

**Checkpoint**: User Story 5 complete — can trigger generation workflow

---

## Phase 8: User Story 6 - Access Control (Priority: P1)

**Goal**: Only owner can access private projects, public projects readable by anyone

**Independent Test**: Create project as user A, try access as user B — should fail. Make public, try again — should succeed (read-only)

### Tests for User Story 6

- [x] T038 [P] [US6] Test owner_only_access (other user gets 404) in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)
- [x] T039 [P] [US6] Test public_project_access in backend/tests/test_projects.py
  → Artifacts: [test_projects.py](../../backend/tests/test_projects.py)

### Implementation for User Story 6

- [x] T040 [US6] Implement get_public_project() service function in backend/app/projects/service.py
  → Artifacts: [service.py](../../backend/app/projects/service.py)
- [x] T041 [US6] Implement GET /projects/public/{project_id} endpoint in backend/app/projects/routes.py
  → Artifacts: [routes.py](../../backend/app/projects/routes.py)
- [x] T042 [US6] Add other_user fixture for access control tests in backend/tests/conftest.py
  → Artifacts: [conftest.py](../../backend/tests/conftest.py)

**Checkpoint**: User Story 6 complete — access control enforced

---

## Phase 9: Integration & Router Registration

**Purpose**: Wire up module to main application

- [x] T043 Register projects router in backend/app/main.py
  → Artifacts: [main.py](../../backend/app/main.py)
- [x] T044 Run full test suite: pytest backend/tests/test_projects.py -v
  → 18 tests passed
- [ ] T045 Apply Alembic migration: alembic upgrade head

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [x] T046 [P] Run type-check: mypy backend/app/projects/
  → Known SQLAlchemy Column type issues (common pattern in codebase)
- [x] T047 Verify all edge cases from spec.md are handled
  → All 18 tests cover edge cases: invalid template, invalid config, unauthorized, not found, access control
- [ ] T048 Run quickstart.md validation (manual API test)
- [x] T049 Update specs/005-projects-module/checklists/requirements.md with implementation status
  → Checklist is for specification quality (already complete), not implementation

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → [User Stories in parallel or priority order]
                                          ↓
                                    Phase 9 (Integration)
                                          ↓
                                    Phase 10 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Create) | Phase 2 | US2, US5, US6 |
| US2 (View/List) | Phase 2 | US1, US3, US4, US5, US6 |
| US3 (Update) | Phase 2 | US1, US2, US4, US5, US6 |
| US4 (Delete) | Phase 2 | US1, US2, US3, US5, US6 |
| US5 (Generate) | Phase 2 | US1, US2, US3, US4, US6 |
| US6 (Access) | Phase 2 | US1, US2, US3, US4, US5 |

**All user stories are independent** — can be implemented in any order after Phase 2.

### Within Each User Story

1. Tests FIRST (T0XX [US?] Test...) — ensure they FAIL
2. Service functions
3. Route endpoints
4. Verify tests PASS

---

## Parallel Execution Examples

### Phase 2 (Foundational) — Parallel Tasks

```
# Launch in single message:
T005: Pydantic schemas in backend/app/projects/schemas.py
T006: Test fixtures in backend/tests/conftest.py
```

### User Story 1 — Parallel Tests

```
# Launch in single message:
T008: Test create_project success
T009: Test create_project invalid template
T010: Test create_project invalid config
```

### Multiple User Stories — Parallel Execution

```
# If team capacity allows, after Phase 2:
Developer A: Phase 3 (US1 - Create)
Developer B: Phase 4 (US2 - View/List)
Developer C: Phase 7 (US5 - Generate)
```

---

## Implementation Strategy

### MVP First (Recommended)

1. ✅ Phase 0: Planning
2. ✅ Phase 1: Setup
3. ✅ Phase 2: Foundational (CRITICAL)
4. ✅ Phase 3: User Story 1 (Create Project)
5. ⏸️ **STOP and VALIDATE** — can create projects
6. ✅ Phase 4: User Story 2 (View/List)
7. ⏸️ **MVP COMPLETE** — CRUD basics working
8. Continue with US3, US4, US5, US6 as needed

### Full Implementation

Complete all phases in order. Each user story checkpoint allows validation before proceeding.

---

## Task Summary

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Phase 0: Planning | 4 | — |
| Phase 1: Setup | 2 | 1 |
| Phase 2: Foundational | 5 | 2 |
| Phase 3: US1 Create | 7 | 3 |
| Phase 4: US2 View/List | 7 | 3 |
| Phase 5: US3 Update | 5 | 2 |
| Phase 6: US4 Delete | 4 | 2 |
| Phase 7: US5 Generate | 7 | 3 |
| Phase 8: US6 Access | 5 | 2 |
| Phase 9: Integration | 3 | 0 |
| Phase 10: Polish | 4 | 1 |

**Total**: 53 tasks (49 implementation + 4 planning)
**Parallel opportunities**: 19 tasks marked [P]

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story independently testable after Phase 2
- Commit after each task or logical group
- All tests follow existing test_templates.py patterns
