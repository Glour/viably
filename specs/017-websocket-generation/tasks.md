# Tasks: WebSocket & Generation Flow Integration

**Input**: Design documents from `/specs/017-websocket-generation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification - tests omitted per guidelines

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Project structure: `frontend/` (web app, frontend only)
- Frontend code: `frontend/lib/`, `frontend/components/`, `frontend/app/`
- Types: `frontend/types/`
- Tests: Tests NOT included (not requested in spec)

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
- research/*.md (if complex research identified)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create foundational file structure

- [X] T001 Install react-use-websocket@^4.8.1 dependency in frontend/package.json → Artifacts: [package.json](frontend/package.json)
- [X] T002 Create frontend/lib/ws/ directory for WebSocket client code → Artifacts: [lib/ws/](lib/ws/)
- [X] T003 Create frontend/types/websocket.ts for WebSocket type definitions → Artifacts: [websocket.ts](types/websocket.ts)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript types and constants that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Define WebSocket message types (discriminated unions for 7 message types) in frontend/types/websocket.ts per data-model.md → Artifacts: [websocket.ts](../../../frontend/types/websocket.ts)
- [X] T005 [P] Define GenerationProgressState type in frontend/types/websocket.ts per data-model.md → Artifacts: [websocket.ts](../../../frontend/types/websocket.ts)
- [X] T006 [P] Define DeployProgressState type in frontend/types/websocket.ts per data-model.md → Artifacts: [websocket.ts](../../../frontend/types/websocket.ts)
- [X] T007 [P] Define WebSocketConnectionState type in frontend/types/websocket.ts per data-model.md → Artifacts: [websocket.ts](../../../frontend/types/websocket.ts)
- [X] T008 Define generation step constants (GENERATION_STEPS array) in frontend/lib/data/generation.ts → Artifacts: [generation.ts](../../../frontend/lib/data/generation.ts)
- [X] T009 [P] Define deploy step constants (DEPLOY_STEPS array) in frontend/lib/data/generation.ts → Artifacts: [generation.ts](../../../frontend/lib/data/generation.ts)
- [X] T010 [P] Define reconnection constants (MAX_RECONNECT_ATTEMPTS, intervals) in frontend/lib/data/generation.ts → Artifacts: [generation.ts](../../../frontend/lib/data/generation.ts)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 6 - Pre-Generation Credit Check (Priority: P1) 🎯 MVP Foundation

**Goal**: Allow users to see generation cost and prevent generation when insufficient credits

**Independent Test**: Set user credit balance below template cost, verify Generate button is disabled with appropriate message

**Why First**: This is a gating check that prevents other stories from working. Must be implemented before US1 (generation flow).

### Implementation for User Story 6

- [X] T011 [US6] Add creditCost field to existing template type if not present in frontend/types/index.ts → Artifacts: Already exists in [index.ts](../../../frontend/types/index.ts#L206)
- [X] T012 [US6] Create credit check utility function in frontend/lib/utils/credit-check.ts that compares balance vs cost → Artifacts: [credit-check.ts](../../../frontend/lib/utils/credit-check.ts)
- [X] T013 [US6] Update Generate button in frontend/components/generation/chat-panel.tsx to check credit balance and disable when insufficient → Artifacts: [chat-panel.tsx](../../../frontend/components/generation/chat-panel.tsx)
- [X] T014 [US6] Add credit cost display to Generate button text (format: "🚀 Генерировать (X кредитов)") → Artifacts: [chat-panel.tsx](../../../frontend/components/generation/chat-panel.tsx)
- [X] T015 [US6] Add "Недостаточно кредитов" message with link to /settings/billing when balance insufficient in frontend/components/generation/chat-panel.tsx → Artifacts: [chat-panel.tsx](../../../frontend/components/generation/chat-panel.tsx)

**Checkpoint**: User Story 6 complete - users can see costs and system prevents insufficient credit scenarios

---

## Phase 4: User Story 1 - Real-time Generation Progress Monitoring (Priority: P1) 🎯 MVP Core

**Goal**: Replace mock setTimeout-based progress with real WebSocket updates from backend

**Independent Test**: Start generation, verify progress bar updates based on WebSocket events (not timer), verify code snippets appear in preview

**Dependencies**: Requires US6 (credit check) complete

### Implementation for User Story 1

- [X] T016 [P] [US1] Add startGeneration function to frontend/lib/api/generation.ts per REST API contract (POST /api/projects/{id}/generate) → Artifacts: [generation.ts](../../../frontend/lib/api/generation.ts)
- [X] T017 [P] [US1] Add getProjectCode function to frontend/lib/api/generation.ts per REST API contract (GET /api/projects/{id}/code) → Artifacts: [generation.ts](../../../frontend/lib/api/generation.ts)
- [X] T018 [P] [US1] Add downloadProjectZip function to frontend/lib/api/generation.ts per REST API contract (GET /api/projects/{id}/download) → Artifacts: [generation.ts](../../../frontend/lib/api/generation.ts)
- [X] T019 [US1] Create useGeneration hook in frontend/lib/hooks/use-generation.ts integrating react-use-websocket with auth token → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts), [query-keys.ts](../../../frontend/lib/api/query-keys.ts)
- [X] T020 [US1] Implement WebSocket URL construction with user ID and JWT token in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T021 [US1] Implement WebSocket message handler for generation_progress type in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T022 [US1] Implement WebSocket message handler for generation_complete type in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T023 [US1] Implement WebSocket message handler for generation_error type in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T024 [US1] Implement React Query invalidation on generation_complete in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T025 [US1] Add code snippet accumulation logic for typewriter animation in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T026 [US1] Update chat-panel.tsx to use real useGeneration hook instead of mock → Artifacts: [use-generation-wrapper.ts](../../../frontend/lib/generation/use-generation-wrapper.ts), [generate/page.tsx](../../../frontend/app/projects/[id]/generate/page.tsx)
- [X] T027 [US1] Update preview-panel.tsx to display real code snippets from WebSocket messages → Artifacts: [generation-progress.tsx](../../../frontend/components/generation/generation-progress.tsx), [code-snippet-animation.tsx](../../../frontend/components/generation/code-snippet-animation.tsx), [preview-panel.tsx](../../../frontend/components/generation/preview-panel.tsx)
- [X] T028 [US1] Update preview-panel.tsx to show generated code files using Monaco editor on generation_complete → Artifacts: Already implemented in [complete-state.tsx](../../../frontend/components/generation/complete-state.tsx)
- [X] T029 [US1] Add retry functionality to preview-panel.tsx for generation errors → Artifacts: Already wired in [error-state.tsx](../../../frontend/components/generation/error-state.tsx)

**Checkpoint**: User Story 1 complete - users see real-time generation progress with code snippets

---

## Phase 5: User Story 2 - WebSocket Connection Resilience (Priority: P1) 🎯 MVP Reliability

**Goal**: Auto-reconnect WebSocket on network interruptions with exponential backoff

**Independent Test**: During active generation, disable network for 10 seconds, re-enable, verify connection restores and updates continue

**Dependencies**: Requires US1 (useGeneration hook) complete

### Implementation for User Story 2

- [X] T030 [US2] Configure shouldReconnect callback in useGeneration hook (don't reconnect on code 1000 or after unmount) → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T031 [US2] Configure reconnectInterval with exponential backoff (3s→6s→12s→24s→48s) in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T032 [US2] Set reconnectAttempts to 5 (per FR-005) in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T033 [US2] Add onReconnectStop handler to show error notification in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T034 [US2] Add didUnmount ref to prevent reconnection after component unmount in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T035 [US2] Track reconnection attempts in state for UI display in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts)
- [X] T036 [US2] Display reconnection status in preview-panel.tsx (e.g., "Reconnecting... attempt X/5") → Artifacts: [preview-panel.tsx](../../../frontend/components/generation/preview-panel.tsx), [generate/page.tsx](../../../frontend/app/projects/[id]/generate/page.tsx), [use-generation-wrapper.ts](../../../frontend/lib/generation/use-generation-wrapper.ts)
- [X] T037 [US2] Add manual reconnect button on max attempts reached in preview-panel.tsx → Artifacts: [preview-panel.tsx](../../../frontend/components/generation/preview-panel.tsx), [generate/page.tsx](../../../frontend/app/projects/[id]/generate/page.tsx)

**Checkpoint**: User Story 2 complete - connections resilient to temporary network issues

---

## Phase 6: User Story 3 - Deploy Flow with Real-time Feedback (Priority: P1) 🎯 MVP Completion

**Goal**: Deploy generated project to Railway with real-time progress updates

**Independent Test**: After generation complete, start deploy with env vars, verify all 6 deploy steps shown with progress, verify bot info displayed on success

**Dependencies**: Requires US1 (generation complete) and US2 (resilient connection)

### Implementation for User Story 3

- [X] T038 [P] [US3] Add startDeploy function to frontend/lib/api/generation.ts per REST API contract (POST /api/projects/{id}/deploy) → Artifacts: [generation.ts](../../../frontend/lib/api/generation.ts)
- [X] T039 [US3] Create useDeploy hook in frontend/lib/hooks/use-deploy.ts integrating with same WebSocket connection as useGeneration → Artifacts: [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts)
- [X] T040 [US3] Implement WebSocket message handler for deploy_progress type in useDeploy hook → Artifacts: [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts)
- [X] T041 [US3] Implement WebSocket message handler for deploy_complete type in useDeploy hook → Artifacts: [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts)
- [X] T042 [US3] Implement WebSocket message handler for deploy_error type in useDeploy hook → Artifacts: [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts)
- [X] T043 [US3] Implement React Query invalidation on deploy_complete in useDeploy hook → Artifacts: [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts)
- [X] T044 [US3] Update deploy-modal.tsx Phase 1 (config) to collect environment variables → Artifacts: [deploy-modal.tsx](../../../frontend/components/generation/deploy-modal.tsx), [generate/page.tsx](../../../frontend/app/projects/[id]/generate/page.tsx)
- [X] T045 [US3] Update deploy-modal.tsx Phase 2 (progress) to show real deploy steps from useDeploy hook → Artifacts: [deploy-modal.tsx](../../../frontend/components/generation/deploy-modal.tsx), [deploy-progress.tsx](../../../frontend/components/generation/deploy-progress.tsx)
- [X] T046 [US3] Update deploy-modal.tsx Phase 3 (success) to display bot info (username, Telegram link, Railway URL) → Artifacts: [deploy-modal.tsx](../../../frontend/components/generation/deploy-modal.tsx)
- [X] T047 [US3] Add confetti animation trigger on deploy success in deploy-modal.tsx using canvas-confetti → Artifacts: [deploy-modal.tsx](../../../frontend/components/generation/deploy-modal.tsx)
- [X] T048 [US3] Add retry functionality for deploy errors in deploy-modal.tsx → Artifacts: [deploy-modal.tsx](../../../frontend/components/generation/deploy-modal.tsx)
- [X] T049 [US3] Ensure Download ZIP button always available as alternative in deploy-modal.tsx → Artifacts: [deploy-modal.tsx](../../../frontend/components/generation/deploy-modal.tsx)

**Checkpoint**: User Story 3 complete - full generation + deploy flow working end-to-end

---

## Phase 7: User Story 4 - Credit Balance Updates via WebSocket (Priority: P2)

**Goal**: Sync credit balance across all tabs automatically when generation completes or credits refunded

**Independent Test**: Open two tabs, start generation in tab 1, verify navbar credit balance updates in both tabs after generation complete

**Dependencies**: Requires US1 (generation flow) complete

### Implementation for User Story 4

- [X] T050 [US4] Implement WebSocket message handler for credits_updated type in useGeneration hook → Artifacts: Already implemented in [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L227-L229), [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts#L211-L213)
- [X] T051 [US4] Add React Query cache invalidation for credits query on credits_updated event in useGeneration hook → Artifacts: Already implemented in [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L228), [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts#L212)
- [X] T052 [US4] Verify useCreditBalance hook automatically updates navbar when query invalidated (should work without changes) → Artifacts: Verified - [use-credits.ts](../../../frontend/lib/hooks/use-credits.ts#L13-L21) uses React Query with queryKeys.credits.balance
- [X] T053 [US4] Test multi-tab synchronization with shared WebSocket connection (react-use-websocket share: true) → Artifacts: Already configured with share: true in [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L91), [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts#L89)

**Checkpoint**: User Story 4 complete - credit balance syncs automatically across tabs

---

## Phase 8: User Story 5 - Generation Cancellation (Priority: P2)

**Goal**: Allow users to cancel ongoing generation, return credits, close WebSocket gracefully

**Independent Test**: Start generation, click Cancel button mid-generation, verify generation stops, credits refunded, UI returns to idle state

**Dependencies**: Requires US1 (generation flow) complete

### Implementation for User Story 5

- [X] T054 [US5] Add cancelGeneration function to frontend/lib/api/generation.ts per REST API contract (POST /api/projects/{id}/cancel-generation) → Artifacts: [generation.ts](../../../frontend/lib/api/generation.ts#L199-L206)
- [X] T055 [US5] Add cancelGeneration action to useGeneration hook return interface → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L274-L293), [use-generation-wrapper.ts](../../../frontend/lib/generation/use-generation-wrapper.ts#L205)
- [X] T056 [US5] Implement cancelGeneration handler that calls API and closes WebSocket in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L274-L291)
- [X] T057 [US5] Add Cancel button to preview-panel.tsx during generation status → Artifacts: [generation-progress.tsx](../../../frontend/components/generation/generation-progress.tsx#L48-L54), [preview-panel.tsx](../../../frontend/components/generation/preview-panel.tsx#L101), [generate/page.tsx](../../../frontend/app/projects/[id]/generate/page.tsx#L163)
- [X] T058 [US5] Show credits refunded notification on successful cancellation in preview-panel.tsx → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L282)
- [X] T059 [US5] Reset generation state to idle after cancellation in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L279)

**Checkpoint**: User Story 5 complete - users can cancel generation at any time

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, offline detection, edge cases from spec

### Error Handling & Edge Cases

- [X] T060 [P] Implement unknown message type handler (console.warn, graceful degradation) in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L238-L247), [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts#L226-L235)
- [X] T061 [P] Implement out-of-order message protection (check step numbers) in useGeneration hook → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L166-L171), [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts#L153-L158)
- [X] T062 [P] Add error boundary wrapper for generation components in frontend/components/generation/error-boundary.tsx → Artifacts: [error-boundary.tsx](../../../frontend/components/generation/error-boundary.tsx), [generate/page.tsx](../../../frontend/app/projects/[id]/generate/page.tsx#L8,L128,L174,L177,L215)
- [X] T063 [P] Add toast notification system integration for WebSocket errors using sonner → Artifacts: [use-generation.ts](../../../frontend/lib/hooks/use-generation.ts#L133,L145-L147,L229), [use-deploy.ts](../../../frontend/lib/hooks/use-deploy.ts#L8,L124,L136-L138,L213)

### Offline Detection (FR-017)

- [X] T064 Create useOfflineDetection hook in frontend/lib/hooks/use-offline-detection.ts using navigator.onLine → Artifacts: [use-offline-detection.ts](../../../frontend/lib/hooks/use-offline-detection.ts)
- [X] T065 Add offline banner component in frontend/components/ui/offline-banner.tsx → Artifacts: [offline-banner.tsx](../../../frontend/components/ui/offline-banner.tsx)
- [X] T066 Integrate offline banner into main layout when offline detected → Artifacts: [offline-banner-wrapper.tsx](../../../frontend/components/ui/offline-banner-wrapper.tsx), [layout.tsx](../../../frontend/app/layout.tsx#L5,L34)
- [ ] T067 Disable generation/deploy mutations when offline in useGeneration and useDeploy hooks

### Performance Optimizations

- [ ] T068 [P] Add debouncing for progress bar updates (100ms) in preview-panel.tsx
- [ ] T069 [P] Memoize generation steps computation in useGeneration hook
- [ ] T070 [P] Add requestAnimationFrame for smooth progress bar animation in preview-panel.tsx

### Final Integration

- [ ] T071 Update project page (frontend/app/projects/[id]/page.tsx) to use real useGeneration hook
- [ ] T072 Verify type-check passes: run `cd frontend && npm run type-check`
- [ ] T073 Verify build passes: run `cd frontend && npm run build`
- [ ] T074 Manual end-to-end test: Run through complete generation → deploy flow

**Checkpoint**: All polish complete - production-ready implementation

---

## Dependencies & Parallel Execution

### User Story Dependencies

```
US6 (Credit Check)
  ↓
US1 (Generation Progress) ← Foundation for all other stories
  ↓
US2 (Connection Resilience) ← Enhances US1
  ↓
US3 (Deploy Flow) ← Uses connection from US1+US2
  ↓
US4 (Credit Updates) ← Extends US1
  ↓
US5 (Cancellation) ← Extends US1
```

**Key Insights**:
- **US6 must be first** (prevents generation without credits)
- **US1 is blocking** (other stories extend/enhance it)
- **US2-US5 can be parallel** after US1 complete (independent features)
- **Phase 9 (Polish) can be parallel** after all stories complete

### Parallel Execution Examples

**Phase 2 (Foundational) - All parallel after T004**:
```bash
# After T004 (base message types), run in parallel:
- T005 (GenerationProgressState)
- T006 (DeployProgressState)
- T007 (WebSocketConnectionState)
- T009 (DEPLOY_STEPS)
- T010 (reconnection constants)
```

**Phase 4 (US1) - Parallel groups**:
```bash
# Group 1: API functions (after credit check)
- T016 (startGeneration)
- T017 (getProjectCode)
- T018 (downloadProjectZip)

# Group 2: WebSocket message handlers (after T019 hook created)
- T021 (generation_progress handler)
- T022 (generation_complete handler)
- T023 (generation_error handler)

# Group 3: UI updates (after message handlers)
- T026 (chat-panel update)
- T027 (preview-panel snippets)
- T028 (preview-panel code display)
```

**Phase 6 (US3) - Parallel groups**:
```bash
# Group 1: API + hook setup
- T038 (startDeploy function)

# Group 2: Message handlers (after T039 hook created)
- T040 (deploy_progress handler)
- T041 (deploy_complete handler)
- T042 (deploy_error handler)

# Group 3: UI updates (after handlers)
- T044 (deploy-modal config)
- T045 (deploy-modal progress)
- T046 (deploy-modal success)
```

**Phase 9 (Polish) - All parallel**:
```bash
# Error handling group
- T060 (unknown message handler)
- T061 (out-of-order protection)
- T062 (error boundary)
- T063 (toast integration)

# Performance group
- T068 (debounce progress)
- T069 (memoize steps)
- T070 (requestAnimationFrame)
```

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: User Stories 1, 2, 3, 6 only
- **US6**: Credit check (prerequisite)
- **US1**: Core generation with real-time progress
- **US2**: Connection resilience (production necessity)
- **US3**: Deploy flow (completes user journey)

**Deferred to v1.1**: User Stories 4, 5, Phase 9 Polish
- **US4**: Credit balance sync (nice-to-have, not critical)
- **US5**: Cancellation (edge case, can manually reload page)
- **Phase 9**: Polish items (can add after MVP validation)

### Incremental Delivery Checkpoints

1. **After Phase 2**: Types defined, can start any user story
2. **After Phase 3**: Credit check working, prevents bad user experience
3. **After Phase 4**: Generation works - **First demo-able milestone**
4. **After Phase 5**: Connection resilience - **Production-ready generation**
5. **After Phase 6**: Deploy works - **Complete MVP** 🎉
6. **After Phase 7-8**: Enhanced UX features
7. **After Phase 9**: Production polish

### Validation Checklist (Run after each phase)

- [ ] Type-check passes: `cd frontend && npm run type-check`
- [ ] Build succeeds: `cd frontend && npm run build`
- [ ] Manual test: Verify user story acceptance criteria
- [ ] Commit with descriptive message referencing task ID

---

## Summary

**Total Tasks**: 74 tasks
- **Phase 0 (Planning)**: 4 tasks
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 7 tasks
- **Phase 3 (US6 - Credit Check)**: 5 tasks
- **Phase 4 (US1 - Generation Progress)**: 14 tasks
- **Phase 5 (US2 - Connection Resilience)**: 8 tasks
- **Phase 6 (US3 - Deploy Flow)**: 12 tasks
- **Phase 7 (US4 - Credit Updates)**: 4 tasks
- **Phase 8 (US5 - Cancellation)**: 6 tasks
- **Phase 9 (Polish)**: 11 tasks

**Parallel Opportunities**: 35+ tasks can run in parallel (47% of total)

**Estimated Timeline**:
- MVP (US1+US2+US3+US6): ~2 days (59 tasks)
- Full feature (all stories): ~3 days (74 tasks)

**Critical Path**: P001-P004 → T001-T010 → T011-T015 → T016-T029 → T030-T037 → T038-T049

**Ready for Execution**: ✅ All tasks have clear file paths, dependencies identified, parallel execution mapped
