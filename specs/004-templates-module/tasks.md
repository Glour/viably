# Tasks: Templates Module

**Input**: Design documents from `/specs/004-templates-module/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Included per spec requirement (>90% coverage in Success Criteria)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Paths relative to `backend/` directory

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements and assigning executors.

- [ ] P001 Analyze all tasks and identify required agent types and capabilities
- [ ] P002 Create missing agents using meta-agent-v3 (launch N calls in single message), then ask user restart
- [ ] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names
- [ ] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/)

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports)
- **Existing agents**: ONLY if 100% capability match
- **Agent creation**: Launch all meta-agent-v3 calls in single message for parallel execution
- **After P002**: Must restart claude-code before proceeding to P003

**Artifacts**:
- Updated tasks.md with [EXECUTOR: name] annotations
- .claude/agents/{domain}/{type}/{name}.md (if new agents created)

---

## Phase 1: Setup (Module Structure)

**Purpose**: Create templates module directory structure and initialize files.

- [x] T001 Create module directory structure: `app/templates/` with `__init__.py`
- [x] T002 [P] Create empty module files: `models.py`, `schemas.py`, `service.py`, `routes.py`, `seed.py` in `app/templates/`

→ Artifacts: [app/templates/](backend/app/templates/)

**Checkpoint**: Module structure created, ready for implementation.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Create Template SQLAlchemy model in `app/templates/models.py` per data-model.md
- [x] T004 Generate Alembic migration for templates table: `alembic revision --autogenerate -m "add templates table"`
- [x] T005 Apply migration: `alembic upgrade head`
- [x] T006 [P] Create TemplateListItem Pydantic schema in `app/templates/schemas.py`
- [x] T007 [P] Create TemplateDetail Pydantic schema in `app/templates/schemas.py`
- [x] T008 Create seed.py with 6 initial templates (FAQ Bot, Shop Bot, Notification Bot, Support Bot, Poll Bot, Booking Bot) in `app/templates/seed.py`
- [x] T009 Register templates router in `app/main.py`
- [x] T010 Create test fixtures in `tests/conftest.py` for templates (template fixture, multiple templates fixture)

→ Artifacts: [models.py](backend/app/templates/models.py), [schemas.py](backend/app/templates/schemas.py), [seed.py](backend/app/templates/seed.py), [migration](backend/alembic/versions/4064d14c6ac4_add_templates_table.py)

**Checkpoint**: Foundation ready - Template model, schemas, seed data, and test fixtures in place.

---

## Phase 3: User Story 1 - Browse Available Templates (Priority: P1)

**Goal**: Users can view a list of all active templates with their key information.

**Independent Test**: Load templates list and verify templates display with name, description, category, cost, features, tags.

**FR Coverage**: FR-001, FR-004, FR-007, FR-009, FR-011, FR-013

### Tests for User Story 1

- [ ] T011 [P] [US1] Create test `test_list_templates` in `tests/test_templates.py`
- [ ] T012 [P] [US1] Create test `test_templates_sorted_by_order` in `tests/test_templates.py`
- [ ] T013 [P] [US1] Create test `test_inactive_template_not_in_list` in `tests/test_templates.py`
- [ ] T014 [P] [US1] Create test `test_empty_templates_list` in `tests/test_templates.py`

### Implementation for User Story 1

- [ ] T015 [US1] Implement `list_templates()` function in `app/templates/service.py` - returns all active templates sorted by sort_order, then usage_count
- [ ] T016 [US1] Implement `GET /api/templates` endpoint in `app/templates/routes.py` - basic list without filters
- [ ] T017 [US1] Add module exports to `app/templates/__init__.py`
- [ ] T018 [US1] Run seed script to populate initial templates
- [ ] T019 [US1] Verify all US1 tests pass

**Checkpoint**: User Story 1 complete - users can browse all active templates.

→ Artifacts: `app/templates/service.py`, `app/templates/routes.py`

---

## Phase 4: User Story 2 - Filter Templates by Category (Priority: P1)

**Goal**: Users can filter templates by category (telegram_bot, api_service).

**Independent Test**: Apply category filter and verify only matching templates appear.

**FR Coverage**: FR-002

### Tests for User Story 2

- [ ] T020 [P] [US2] Create test `test_list_templates_by_category` in `tests/test_templates.py`
- [ ] T021 [P] [US2] Create test `test_filter_invalid_category` in `tests/test_templates.py`

### Implementation for User Story 2

- [ ] T022 [US2] Add `category` parameter to `list_templates()` in `app/templates/service.py`
- [ ] T023 [US2] Add `category` query parameter to `GET /api/templates` in `app/templates/routes.py`
- [ ] T024 [US2] Verify all US2 tests pass

**Checkpoint**: User Story 2 complete - category filtering works.

→ Artifacts: Updated `app/templates/service.py`, `app/templates/routes.py`

---

## Phase 5: User Story 3 - Search Templates (Priority: P2)

**Goal**: Users can search templates by name or description (case-insensitive).

**Independent Test**: Enter search term and verify matching templates appear.

**FR Coverage**: FR-003

### Tests for User Story 3

- [ ] T025 [P] [US3] Create test `test_search_templates` in `tests/test_templates.py`
- [ ] T026 [P] [US3] Create test `test_search_no_results` in `tests/test_templates.py`
- [ ] T027 [P] [US3] Create test `test_search_combined_with_category` in `tests/test_templates.py`

### Implementation for User Story 3

- [ ] T028 [US3] Add `search` parameter to `list_templates()` in `app/templates/service.py` using ILIKE
- [ ] T029 [US3] Add `search` query parameter to `GET /api/templates` in `app/templates/routes.py`
- [ ] T030 [US3] Verify all US3 tests pass

**Checkpoint**: User Story 3 complete - search functionality works.

→ Artifacts: Updated `app/templates/service.py`, `app/templates/routes.py`

---

## Phase 6: User Story 4 - View Template Details (Priority: P1)

**Goal**: Users can view detailed template information including configuration schema and example values.

**Independent Test**: Select a template and verify all details display including config_schema.

**FR Coverage**: FR-005, FR-006, FR-010, FR-012

### Tests for User Story 4

- [ ] T031 [P] [US4] Create test `test_get_template_by_id` in `tests/test_templates.py`
- [ ] T032 [P] [US4] Create test `test_get_template_by_slug` in `tests/test_templates.py`
- [ ] T033 [P] [US4] Create test `test_get_template_not_found` in `tests/test_templates.py`
- [ ] T034 [P] [US4] Create test `test_inactive_template_returns_404` in `tests/test_templates.py`
- [ ] T035 [P] [US4] Create test `test_template_has_valid_schema` in `tests/test_templates.py`

### Implementation for User Story 4

- [ ] T036 [US4] Implement `get_template_by_id()` function in `app/templates/service.py`
- [ ] T037 [US4] Implement `get_template_by_slug()` function in `app/templates/service.py`
- [ ] T038 [US4] Implement `GET /api/templates/{template_id}` endpoint in `app/templates/routes.py` - supports both UUID and slug
- [ ] T039 [US4] Verify all US4 tests pass

**Checkpoint**: User Story 4 complete - template details accessible by ID or slug.

→ Artifacts: Updated `app/templates/service.py`, `app/templates/routes.py`

---

## Phase 7: User Story 5 - View Template Usage Statistics (Priority: P3)

**Goal**: Users can see how popular each template is (usage_count).

**Independent Test**: Verify usage_count displays on template cards and detail pages.

**FR Coverage**: FR-008

### Tests for User Story 5

- [ ] T040 [P] [US5] Create test `test_usage_count_in_list` in `tests/test_templates.py`
- [ ] T041 [P] [US5] Create test `test_usage_count_in_detail` in `tests/test_templates.py`
- [ ] T042 [P] [US5] Create test `test_increment_usage_count` in `tests/test_templates.py`

### Implementation for User Story 5

- [ ] T043 [US5] Implement `increment_usage_count()` function in `app/templates/service.py` - atomic SQL increment
- [ ] T044 [US5] Verify usage_count included in TemplateListItem schema (already done in T006)
- [ ] T045 [US5] Verify usage_count included in TemplateDetail schema (already done in T007)
- [ ] T046 [US5] Verify all US5 tests pass

**Checkpoint**: User Story 5 complete - usage statistics visible and incrementable.

→ Artifacts: Updated `app/templates/service.py`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, coverage check, and cleanup.

- [ ] T047 Run full test suite with coverage: `pytest tests/test_templates.py -v --cov=app/templates --cov-report=term-missing`
- [ ] T048 Verify coverage meets >90% requirement
- [ ] T049 Run type-check: `mypy app/templates`
- [ ] T050 Run quickstart.md validation checklist
- [ ] T051 Update `app/templates/__init__.py` with all public exports

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────┐
                                                   │
Phase 2 (Foundational) ◄──────────────────────────┘
         │
         │ BLOCKS ALL USER STORIES
         ▼
┌────────┴────────┬─────────────┬─────────────┬─────────────┐
│                 │             │             │             │
▼                 ▼             ▼             ▼             ▼
Phase 3 (US1)   Phase 4 (US2)   Phase 5 (US3)   Phase 6 (US4)   Phase 7 (US5)
Browse          Filter          Search          Details         Statistics
P1              P1              P2              P1              P3
                                                   │
                                                   │ (US4 needed for detail view,
                                                   │  but US5 can test list view independently)
                                                   ▼
                                              Phase 8 (Polish)
```

### User Story Dependencies

- **US1 (Browse)**: No dependencies - can start after Foundational
- **US2 (Filter)**: Extends US1's list_templates() - run after or parallel to US1
- **US3 (Search)**: Extends US1's list_templates() - run after US1+US2 complete
- **US4 (Details)**: No dependencies on other stories - can run parallel to US1-US3
- **US5 (Statistics)**: usage_count already in schemas - can run parallel after US1

### Parallel Opportunities

**Within Foundational (Phase 2)**:
- T006 + T007 (Pydantic schemas) can run in parallel

**Within Each User Story**:
- All test tasks (T011-T014, T020-T021, etc.) can run in parallel
- Test tasks must complete before implementation starts

**Across User Stories (with multiple agents)**:
- US1 + US4 can run in parallel (different focus areas)
- US2 depends on US1 (extends list_templates)
- US3 depends on US1+US2 (extends list_templates further)
- US5 can run after US1 completes

---

## Parallel Example: Foundational Phase

```bash
# Launch schema tasks in parallel:
Task: "Create TemplateListItem Pydantic schema in app/templates/schemas.py"
Task: "Create TemplateDetail Pydantic schema in app/templates/schemas.py"
```

## Parallel Example: User Story 4 Tests

```bash
# Launch all US4 tests in parallel:
Task: "Create test test_get_template_by_id in tests/test_templates.py"
Task: "Create test test_get_template_by_slug in tests/test_templates.py"
Task: "Create test test_get_template_not_found in tests/test_templates.py"
Task: "Create test test_inactive_template_returns_404 in tests/test_templates.py"
Task: "Create test test_template_has_valid_schema in tests/test_templates.py"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Browse)
4. Complete Phase 6: User Story 4 (Details)
5. **STOP and VALIDATE**: Test browsing + viewing details works
6. Deploy MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Browse) → Test independently → **MVP v0.1**
3. US4 (Details) → Test independently → **MVP v0.2**
4. US2 (Filter) → Test independently → **Release v0.3**
5. US3 (Search) → Test independently → **Release v0.4**
6. US5 (Statistics) → Test independently → **Release v1.0**

### Recommended Execution Order

Single developer:
1. Phase 1 → Phase 2 → Phase 3 (US1) → Phase 6 (US4) → Phase 4 (US2) → Phase 5 (US3) → Phase 7 (US5) → Phase 8

Two developers:
- Dev A: Phase 1 → Phase 2 (models, migration) → US1 → US2 → US3
- Dev B: Phase 2 (schemas, seed) → US4 → US5 → Phase 8

---

## Task Summary

| Phase | Tasks | Stories | Parallel |
|-------|-------|---------|----------|
| Setup | 2 | - | 1 |
| Foundational | 8 | - | 2 |
| US1 Browse | 9 | US1 | 4 tests |
| US2 Filter | 5 | US2 | 2 tests |
| US3 Search | 6 | US3 | 3 tests |
| US4 Details | 9 | US4 | 5 tests |
| US5 Statistics | 7 | US5 | 3 tests |
| Polish | 5 | - | 0 |
| **Total** | **51** | **5** | **20** |

---

## Notes

- [P] tasks = different files, no dependencies
- Tests MUST fail before implementation (TDD)
- Commit after each task or logical group
- All endpoints are public (no authentication required)
- Stop at any checkpoint to validate story independently
