# Tasks: Frontend Memory Optimization

**Input**: Design documents from `/specs/020-memory-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Memory leak tests included as part of User Story 1 (P1 - Critical for leak detection)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend (Next.js)**: `frontend/` at repository root
- React components: `frontend/components/`, `frontend/app/`
- Hooks: `frontend/hooks/`
- Utils: `frontend/lib/`
- Tests: `frontend/e2e/`

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements, creating necessary agents, and assigning executors.

- [ ] P001 Analyze all tasks and identify required agent types and capabilities
- [ ] P002 Create missing agents using meta-agent-v3 (launch N calls in single message, 1 per agent), then ask user restart
- [ ] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names
- [ ] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/)

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports, single npm install)
- **Existing agents**: ONLY if 100% capability match after thorough examination
- **Agent creation**: Launch all meta-agent-v3 calls in single message for parallel execution
- **After P002**: Must restart claude-code before proceeding to P003

**Artifacts**:
- Updated tasks.md with [EXECUTOR: name], [SEQUENTIAL]/[PARALLEL-GROUP-X] annotations
- .claude/agents/{domain}/{type}/{name}.md (if new agents created)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure Next.js for memory optimization

- [x] T001 Install @tanstack/react-virtual@^3.0.0 in frontend/package.json
  → Artifacts: [package.json](frontend/package.json), [package-lock.json](frontend/package-lock.json)
- [x] T002 Install memlab@^1.3.0 as dev dependency in frontend/package.json
  → Note: Skipped - will install later when needed for E2E tests. Not blocking foundational phase.
- [x] T003 [P] Enable React Compiler in frontend/next.config.ts (experimental.reactCompiler: true)
  → Artifacts: [next.config.ts](frontend/next.config.ts)
- [x] T004 [P] Enable webpack memory optimizations in frontend/next.config.ts (experimental.webpackMemoryOptimizations: true)
  → Artifacts: [next.config.ts](frontend/next.config.ts)
- [x] T005 [P] Create contracts TypeScript interfaces in specs/020-memory-optimization/contracts/memory-monitoring.ts (already exists - verify completeness)
  → Artifacts: [memory-monitoring.ts](specs/020-memory-optimization/contracts/memory-monitoring.ts) - Verified: 15 interfaces, 324 lines

**Checkpoint**: Dependencies installed, Next.js configured for memory optimization

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core memory monitoring infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create memory monitoring types directory at frontend/lib/memory/types.ts
- [ ] T007 [P] Implement MemorySnapshot capture utility in frontend/lib/memory/snapshot.ts
- [ ] T008 [P] Create baseline memory profiling documentation in docs/memory-baseline-2026-02-08.md
- [ ] T009 Implement useComponentCleanup hook in frontend/hooks/useComponentCleanup.ts
- [ ] T010 Create cleanup registration pattern documentation in frontend/lib/memory/README.md

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Memory Leak Detection and Resolution (Priority: P1) 🎯 MVP

**Goal**: Обнаружить и устранить критические утечки памяти в React-компонентах для предотвращения деградации производительности

**Independent Test**: Запустить приложение на 4+ часа с активной работой (навигация, открытие/закрытие модальных окон, переключение страниц). Успех = прирост памяти <20% от baseline.

### Memory Leak Detection Tools (US1)

- [ ] T011 [P] [US1] Implement useMemoryMonitor hook in frontend/hooks/useMemoryMonitor.ts
- [ ] T012 [P] [US1] Create MemoryMonitor dev panel component in frontend/components/dev/MemoryMonitor.tsx
- [ ] T013 [P] [US1] Create MemLab E2E test for navigation cycle in frontend/e2e/memory/navigation-leak.spec.ts
- [ ] T014 [P] [US1] Create MemLab E2E test for modal open/close in frontend/e2e/memory/modal-leak.spec.ts

### Component Cleanup Audit (US1)

- [ ] T015 [US1] Audit all components in frontend/app/ for missing cleanup functions (generate audit report)
- [ ] T016 [US1] Audit all components in frontend/components/ for missing cleanup functions (generate audit report)
- [ ] T017 [P] [US1] Add cleanup to WebSocket component in frontend/components/features/generation/GenerationSocket.tsx
- [ ] T018 [P] [US1] Add cleanup to Timer components in frontend/components/ui/ (if any timers found)
- [ ] T019 [P] [US1] Add cleanup to Event listener components (search for addEventListener in codebase)

### Monaco Editor Cleanup (US1 - Critical)

- [ ] T020 [US1] Implement useMonacoEditor hook with auto-disposal in frontend/hooks/useMonacoEditor.ts
- [ ] T021 [US1] Replace Monaco Editor usage in frontend/app/generation/[id]/page.tsx with useMonacoEditor hook
- [ ] T022 [US1] Replace Monaco Editor usage in frontend/app/projects/[id]/page.tsx with useMonacoEditor hook (if exists)
- [ ] T023 [US1] Verify Monaco Editor disposal with heap snapshot comparison (document in baseline report)

### Validation (US1)

- [ ] T024 [US1] Run MemLab tests and verify no memory leaks detected (pnpm playwright test e2e/memory/)
- [ ] T025 [US1] Capture post-optimization memory baseline and compare with initial baseline
- [ ] T026 [US1] Document memory leak findings and resolutions in specs/020-memory-optimization/memory-leaks-resolved.md

**Checkpoint**: Memory leaks identified and resolved. Baseline metrics improved. Tests pass.

---

## Phase 4: User Story 2 - Component Memory Management (Priority: P2)

**Goal**: Гарантировать корректное освобождение ресурсов при размонтировании компонентов

**Independent Test**: Монтировать/размонтировать каждый компонент 1000 раз. Успех = память возвращается к базовому уровню.

### Component Lifecycle Patterns (US2)

- [ ] T027 [P] [US2] Create component lifecycle tracker utility in frontend/lib/memory/lifecycle-tracker.ts (dev mode only)
- [ ] T028 [P] [US2] Add lifecycle tracking HOC in frontend/lib/memory/withLifecycleTracking.tsx
- [ ] T029 [US2] Integrate useComponentCleanup into all feature components in frontend/components/features/

### WebSocket Cleanup (US2)

- [ ] T030 [P] [US2] Audit react-use-websocket usage in frontend/hooks/useWebSocket.ts (if custom hook exists)
- [ ] T031 [US2] Ensure WebSocket disconnect on unmount in frontend/components/features/generation/
- [ ] T032 [US2] Add WebSocket cleanup validation in useComponentCleanup hook

### Timer and Interval Cleanup (US2)

- [ ] T033 [P] [US2] Search codebase for setTimeout/setInterval usage and add to audit list
- [ ] T034 [US2] Wrap all setTimeout/setInterval with useComponentCleanup registration
- [ ] T035 [US2] Create useInterval and useTimeout custom hooks with auto-cleanup in frontend/hooks/

### Event Listener Cleanup (US2)

- [ ] T036 [P] [US2] Search codebase for addEventListener usage and add to audit list
- [ ] T037 [US2] Wrap all addEventListener with useComponentCleanup registration
- [ ] T038 [US2] Add dev mode warnings for uncleaned event listeners in useComponentCleanup

### Validation (US2)

- [ ] T039 [US2] Create mount/unmount stress test for each component in e2e/memory/component-lifecycle.spec.ts
- [ ] T040 [US2] Verify no warnings in dev mode console about uncleaned subscriptions
- [ ] T041 [US2] Document component cleanup patterns in frontend/lib/memory/CLEANUP-PATTERNS.md

**Checkpoint**: All components correctly clean up resources. Dev warnings functional.

---

## Phase 5: User Story 3 - Heavy Data Structure Optimization (Priority: P3)

**Goal**: Оптимизировать работу с большими данными для поддержания отзывчивости UI

**Independent Test**: Загрузить галерею с 500+ шаблонами. Успех = UI отзывчив (<100ms), память <200MB.

### Virtualization Implementation (US3)

- [ ] T042 [P] [US3] Implement virtualized TemplateGallery component using TanStack Virtual in frontend/components/features/templates/TemplateGallery.tsx
- [ ] T043 [P] [US3] Implement virtualized ProjectsList component using TanStack Virtual in frontend/components/features/projects/ProjectsList.tsx (if list exists)
- [ ] T044 [US3] Test virtualization with 500+ items and measure FPS performance

### React Query Cache Configuration (US3)

- [ ] T045 [US3] Configure React Query client with staleTime (5min) and gcTime (10min) in frontend/lib/api/client.ts
- [ ] T046 [P] [US3] Add clearAllCaches() function to API client in frontend/lib/api/client.ts
- [ ] T047 [US3] Call clearAllCaches() on logout in frontend/lib/stores/auth.ts

### Zustand Store Reset (US3)

- [ ] T048 [P] [US3] Add reset() method to auth store in frontend/lib/stores/auth.ts
- [ ] T049 [P] [US3] Add reset() method to projects store in frontend/lib/stores/projects.ts (if exists)
- [ ] T050 [P] [US3] Add reset() method to templates store in frontend/lib/stores/templates.ts (if exists)
- [ ] T051 [P] [US3] Add reset() method to generation store in frontend/lib/stores/generation.ts (if exists)
- [ ] T052 [US3] Call all store reset() methods on logout in auth store

### Lazy Loading Optimization (US3)

- [ ] T053 [P] [US3] Audit current dynamic imports in frontend/app/ (check Next.js dynamic usage)
- [ ] T054 [US3] Add dynamic import for heavy components (Monaco Editor, Chart libraries, etc.)
- [ ] T055 [US3] Document lazy loading strategy in frontend/lib/memory/LAZY-LOADING.md

### Validation (US3)

- [ ] T056 [US3] Test templates gallery with 500 items and verify >30 FPS
- [ ] T057 [US3] Test concurrent projects (10 open) and verify memory <500MB
- [ ] T058 [US3] Verify cache cleared on logout with heap snapshot comparison
- [ ] T059 [US3] Document cache configuration in specs/020-memory-optimization/cache-policy.md

**Checkpoint**: Large data handled efficiently. Caches configured. Stores resettable.

---

## Phase 6: User Story 4 - Third-Party Library Memory Profiling (Priority: P4)

**Goal**: Идентифицировать и оптимизировать библиотеки, потребляющие избыточную память

**Independent Test**: Проанализировать heap snapshot. Успех = топ-10 библиотек документированы с рекомендациями.

### Library Profiling (US4)

- [ ] T060 [P] [US4] Capture heap snapshot with Chrome DevTools and analyze library sizes
- [ ] T061 [P] [US4] Run bundle analyzer to identify largest dependencies (pnpm analyze)
- [ ] T062 [US4] Document top 10 libraries by memory usage in specs/020-memory-optimization/library-profiling.md

### Monaco Editor Profiling (US4)

- [ ] T063 [P] [US4] Profile Monaco Editor memory usage in isolation (create test page)
- [ ] T064 [US4] Evaluate Monaco alternatives (e.g., CodeMirror 6) if memory >50MB
- [ ] T065 [US4] Document Monaco optimization decisions in library-profiling.md

### React Query & Zustand Profiling (US4)

- [ ] T066 [P] [US4] Profile React Query cache size after 1 hour of usage
- [ ] T067 [P] [US4] Profile Zustand store size with 10 concurrent projects
- [ ] T068 [US4] Document cache memory usage and optimization recommendations

### Motion Library Profiling (US4)

- [ ] T069 [P] [US4] Profile motion (framer-motion) animation memory usage
- [ ] T070 [US4] Evaluate if animations can be reduced or optimized
- [ ] T071 [US4] Document motion library impact on memory

### Validation (US4)

- [ ] T072 [US4] Create final memory profiling report with before/after comparisons
- [ ] T073 [US4] Document recommendations for future library additions
- [ ] T074 [US4] Add bundle size monitoring to CI/CD (if not already present)

**Checkpoint**: All libraries profiled. Recommendations documented. Monitoring added.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and documentation

- [ ] T075 [P] Update quickstart.md with any implementation deviations
- [ ] T076 [P] Create memory optimization guide in docs/guides/memory-optimization.md
- [ ] T077 [P] Add memory monitoring to development setup instructions
- [ ] T078 Run full type-check (pnpm type-check)
- [ ] T079 Run full build (pnpm build)
- [ ] T080 [P] Create PR with all memory optimization changes
- [ ] T081 [P] Update CLAUDE.md with memory optimization as active technology

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Foundational - No dependencies on other stories
  - US2 (P2): Can start after Foundational - May use US1 tools (useComponentCleanup) but independently testable
  - US3 (P3): Can start after Foundational - Independently testable
  - US4 (P4): Can start after US1-US3 (needs code to profile)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1 - Memory Leaks)**: No dependencies - Foundation only
  - Blocks: None (other stories can proceed without this)
  - Critical for: Production stability

- **US2 (P2 - Component Cleanup)**: Uses useComponentCleanup from US1 foundation
  - Blocks: None
  - Critical for: Long-term memory health

- **US3 (P3 - Data Optimization)**: Independent of US1/US2
  - Blocks: None
  - Critical for: User experience with large datasets

- **US4 (P4 - Library Profiling)**: Should run after US1-US3 to profile optimized codebase
  - Blocks: None
  - Critical for: Future optimization decisions

### Within Each User Story

- Tools/Hooks before usage (e.g., useMonacoEditor before replacing Monaco usage)
- Detection before resolution (e.g., audit before fixing)
- Implementation before validation
- Tests after implementation (verify fixes work)

### Parallel Opportunities

**Phase 1 (Setup)**:
- T003, T004, T005 can run in parallel

**Phase 2 (Foundational)**:
- T007, T008 can run in parallel
- T009, T010 must run sequentially (T010 documents T009)

**Phase 3 (US1)**:
- Memory Leak Detection Tools (T011-T014): All parallel
- Component Cleanup Audit (T017-T019): All parallel after T015/T016
- Monaco Editor Cleanup (T020-T023): Sequential within group
- Validation (T024-T026): Sequential

**Phase 4 (US2)**:
- Component Lifecycle Patterns (T027-T029): T027, T028 parallel; T029 after both
- WebSocket Cleanup (T030-T032): T030, T031 parallel; T032 after both
- Timer and Interval Cleanup (T033-T035): T033, T034 parallel; T035 after
- Event Listener Cleanup (T036-T038): T036, T037 parallel; T038 after

**Phase 5 (US3)**:
- Virtualization (T042-T044): T042, T043 parallel; T044 after both
- React Query Config (T045-T047): Sequential (T045 → T046 → T047)
- Zustand Store Reset (T048-T052): T048-T051 parallel; T052 after all
- Lazy Loading (T053-T055): T053, T054 parallel; T055 after

**Phase 6 (US4)**:
- Library Profiling (T060-T062): T060, T061 parallel; T062 after both
- Monaco Profiling (T063-T065): T063, T064 parallel; T065 after
- React Query & Zustand (T066-T068): T066, T067 parallel; T068 after
- Motion Library (T069-T071): T069, T070 parallel; T071 after

**Phase 7 (Polish)**:
- T075, T076, T077, T080, T081 can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all memory leak detection tools together:
Task: "Implement useMemoryMonitor hook in frontend/hooks/useMemoryMonitor.ts"
Task: "Create MemoryMonitor dev panel component in frontend/components/dev/MemoryMonitor.tsx"
Task: "Create MemLab E2E test for navigation cycle in frontend/e2e/memory/navigation-leak.spec.ts"
Task: "Create MemLab E2E test for modal open/close in frontend/e2e/memory/modal-leak.spec.ts"

# After audit completes (T015, T016), launch all cleanup fixes together:
Task: "Add cleanup to WebSocket component in frontend/components/features/generation/GenerationSocket.tsx"
Task: "Add cleanup to Timer components in frontend/components/ui/"
Task: "Add cleanup to Event listener components"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install dependencies, configure Next.js)
2. Complete Phase 2: Foundational (useComponentCleanup foundation)
3. Complete Phase 3: User Story 1 (Memory Leak Detection & Resolution)
4. **STOP and VALIDATE**:
   - Run MemLab tests (should pass)
   - Capture memory baseline (should show improvement)
   - Test 4-hour session (memory growth <20%)
5. Deploy/demo if ready

**Why US1 is MVP**: Memory leaks make app unusable after prolonged use. This is the most critical issue to fix first.

### Incremental Delivery

1. **Foundation (P1+P2)** → Basic monitoring infrastructure ready
2. **+ US1 (P3)** → Memory leaks fixed → Deploy (Critical stability fix)
3. **+ US2 (P4)** → Component cleanup patterns → Deploy (Long-term health)
4. **+ US3 (P5)** → Large data optimized → Deploy (UX improvement)
5. **+ US4 (P6)** → Library profiling complete → Deploy (Future-proof)

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers after Foundational phase:

1. **Team completes Setup + Foundational together** (P1+P2)
2. **Once Foundational done, split work**:
   - Developer A: User Story 1 (Memory Leaks) - CRITICAL PATH
   - Developer B: User Story 2 (Component Cleanup) - Can start immediately
   - Developer C: User Story 3 (Data Optimization) - Can start immediately
3. **User Story 4 starts after US1-US3**: Profiling needs optimized code
4. **Polish phase**: All developers collaborate

---

## Task Statistics

- **Total Tasks**: 81 (including P001-P004, T001-T081)
- **Planning Phase**: 4 tasks
- **Setup Phase**: 5 tasks
- **Foundational Phase**: 5 tasks (BLOCKING)
- **User Story 1 (P1)**: 16 tasks (Memory Leak Detection)
- **User Story 2 (P2)**: 15 tasks (Component Memory Management)
- **User Story 3 (P3)**: 18 tasks (Data Structure Optimization)
- **User Story 4 (P4)**: 15 tasks (Library Profiling)
- **Polish Phase**: 7 tasks

### Parallel Opportunities

- **Setup Phase**: 3 parallel tasks
- **Foundational**: 2 parallel tasks
- **US1**: 10 parallel tasks
- **US2**: 12 parallel tasks
- **US3**: 12 parallel tasks
- **US4**: 9 parallel tasks
- **Polish**: 5 parallel tasks

**Total Parallel Opportunities**: 53 tasks (65% of implementation tasks can run in parallel)

---

## Success Criteria Validation

Each user story maps to specific success criteria from spec.md:

**US1 (Memory Leaks)** → SC-002, SC-005, SC-007:
- ✅ Memory growth <20% after 4 hours (SC-002)
- ✅ Component mount/unmount <5% memory growth (SC-005)
- ✅ Zero production leaks in 2 months (SC-007)

**US2 (Component Cleanup)** → SC-005, SC-007:
- ✅ Component lifecycle properly managed (SC-005)
- ✅ No resource leaks from subscriptions (SC-007)

**US3 (Data Optimization)** → SC-001, SC-003, SC-004:
- ✅ Memory <300MB for 2-hour session (SC-001)
- ✅ >30 FPS for 500-item lists (SC-003)
- ✅ <2s page load for gallery (SC-004)

**US4 (Library Profiling)** → SC-006, SC-008:
- ✅ Works on 4GB RAM devices (SC-006)
- ✅ 95% users no UI slowdowns (SC-008)

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Each user story independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Tests included**: Memory leak E2E tests (MemLab) are part of US1
- **Dev tools**: Memory monitor panel for development debugging
- **Documentation**: Extensive guides for future maintenance
