# Tasks: Generation Flow

**Input**: Design documents from `/specs/013-generation-flow/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/generation-api.md, quickstart.md

**Tests**: Not explicitly requested in specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (frontend-only)**: `frontend/` at repository root
- All paths relative to `/home/alex/PycharmProjects/viably/frontend/`

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

**Purpose**: Install dependencies, create project structure, add shared types

- [x] T001 Install new dependencies: `npm install react-resizable-panels client-zip canvas-confetti prism-react-renderer` and `npm install -D @types/canvas-confetti` in `frontend/`
  → Artifacts: [package.json](frontend/package.json)
- [x] T002 Add generation types (GenerationStatus, GenerationStepStatus, GenerationStep, GeneratedCode, GenerationSession, DeploymentStatus, DeploymentStepStatus, DeploymentStep, DeployedBotInfo, DeployConfig, DeploymentSession, ConfigFormValues, GenerationStoreState, StartGenerationResponse, StartDeploymentResponse) to `frontend/types/index.ts` per data-model.md
  → Artifacts: [types/index.ts](frontend/types/index.ts)
- [x] T003 [P] Create mock generated code data (MOCK_GENERATED_FILES with Python bot file tree, MOCK_CODE_SNIPPETS for typewriter animation) in `frontend/lib/data/generation.ts` following patterns from `frontend/lib/data/projects.ts`
  → Artifacts: [lib/data/generation.ts](frontend/lib/data/generation.ts)
- [x] T004 [P] Create Zustand generation store with initial state, all actions (setProjectContext, setFormValues, startGeneration, retryGeneration, resetGeneration, startDeployment, resetDeployment, internal _update methods) in `frontend/stores/generation.ts` per data-model.md GenerationStoreState interface
  → Artifacts: [stores/generation.ts](frontend/stores/generation.ts)
- [x] T005 [P] Create mock API functions (startGeneration, startDeployment, downloadGeneratedCode using client-zip, getTemplateForProject) in `frontend/lib/api/generation.ts` per contracts/generation-api.md
  → Artifacts: [lib/api/generation.ts](frontend/lib/api/generation.ts)
- [x] T006 Add new animation variants (typewriter, pulseGlow, staggerFadeIn, progressBar) to `frontend/lib/animations.ts`
  → Artifacts: [lib/animations.ts](frontend/lib/animations.ts)

**Checkpoint**: Types compiled, store created, mock data ready, API mock layer complete

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hook and shared components that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Implement useGeneration hook with simulation logic (setTimeout-based sequential step progress, 2-5s per step, progress calculation, code snippet emission on step 3, mock code on completion, 10% error probability) in `frontend/lib/generation/use-generation.ts` per contracts/generation-api.md hook interface
- [x] T008 [P] Create CompactNavbar component (48px height, logo, project name, credits badge, back button, backdrop blur) in `frontend/components/generation/compact-navbar.tsx` following styling from `frontend/components/layout/navbar.tsx`
- [x] T009 [P] Create MobileTabs component (bottom tab bar with Chat/Preview tabs, active state, auto-switch on generation start, hidden on md+ breakpoint) in `frontend/components/generation/mobile-tabs.tsx`

**Checkpoint**: Foundation ready — useGeneration hook drives all state, navbar and mobile tabs available

---

## Phase 3: User Story 1 — Configure and Launch AI Bot Generation (Priority: P1) MVP

**Goal**: User can open generation page, see split-view with config form, fill parameters, and click Generate to start the process.

**Independent Test**: Navigate to `/projects/[id]/generate`, fill config form fields from template, click Generate, verify generation starts.

**FR Coverage**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-023, FR-024

### Implementation for User Story 1

- [x] T010 [P] [US1] Create ConfigForm component with dynamic field rendering from template.configFields (text→Input, textarea→Textarea, select→Select, multiselect→Checkbox group, number→Number input), react-hook-form + zod dynamic schema, required field validation, staggered appear animation in `frontend/components/generation/config-form.tsx`
  → Artifacts: [config-form.tsx](frontend/components/generation/config-form.tsx)
- [x] T011 [P] [US1] Create FreeTextInput component with divider "или опиши своими словами", auto-resize textarea, submit button in `frontend/components/generation/free-text-input.tsx`
  → Artifacts: [free-text-input.tsx](frontend/components/generation/free-text-input.tsx)
- [x] T012 [US1] Create ChatPanel component wrapping template info header (collapsible, emoji + name + credit cost badge), AI welcome message bubble, ConfigForm, sticky Generate button (gradient, full-width, disabled when invalid or insufficient credits, "Insufficient credits" state with top-up link), FreeTextInput in `frontend/components/generation/chat-panel.tsx`
  → Artifacts: [chat-panel.tsx](frontend/components/generation/chat-panel.tsx)
- [x] T013 [P] [US1] Create IdleState component (centered placeholder with code brackets icon, instructional text in Russian, subtitle, GlowOrbs background) in `frontend/components/generation/idle-state.tsx`
  → Artifacts: [idle-state.tsx](frontend/components/generation/idle-state.tsx)
- [x] T014 [US1] Create PreviewPanel component with Tabs (Preview/Code/Logs), state switching based on generation.status (idle→IdleState, generating→placeholder, complete→placeholder, error→placeholder) in `frontend/components/generation/preview-panel.tsx`
  → Artifacts: [preview-panel.tsx](frontend/components/generation/preview-panel.tsx)
- [x] T015 [US1] Create Generation page with split layout using react-resizable-panels (Group horizontal, Panel 40%/60%, Separator with hover highlight, minSize constraints 320px/400px, localStorage persistence via onLayoutChange/defaultLayout), CompactNavbar, ChatPanel in left panel, PreviewPanel in right panel, useGeneration hook integration in `frontend/app/projects/[id]/generate/page.tsx`
  → Artifacts: [page.tsx](frontend/app/projects/[id]/generate/page.tsx)
- [x] T016 [US1] Add double-click protection (FR-017) and beforeunload navigation warning (FR-018) to generation page in `frontend/app/projects/[id]/generate/page.tsx`
  → Artifacts: [page.tsx](frontend/app/projects/[id]/generate/page.tsx)

**Checkpoint**: Generation page loads with split view, config form renders from template, generate button starts simulation, idle state visible in preview panel

---

## Phase 4: User Story 2 — Monitor Real-Time Generation Progress (Priority: P1)

**Goal**: User sees step-by-step progress with animated indicators, progress bar, and typewriter code snippets during generation.

**Independent Test**: Start generation, verify progress steps animate one-by-one with elapsed time, progress bar increments, code snippets appear with typewriter effect.

**FR Coverage**: FR-009, FR-010, FR-011

### Implementation for User Story 2

- [x] T017 [P] [US2] Create CodeSnippetAnimation component with typewriter effect using prism-react-renderer (Highlight with nightOwl theme), character-by-character reveal with cursor blink, dark background code block, staggered appearance of multiple snippets in `frontend/components/generation/code-snippet-animation.tsx`
  → Artifacts: [code-snippet-animation.tsx](frontend/components/generation/code-snippet-animation.tsx)
- [x] T018 [US2] Create GenerationProgress component with step list (done=checkmark, running=animated pulse dot, pending=circle, error=x), gradient animated progress bar, elapsed time per step, CodeSnippetAnimation below progress during "Writing code" step in `frontend/components/generation/generation-progress.tsx`
  → Artifacts: [generation-progress.tsx](frontend/components/generation/generation-progress.tsx)
- [x] T019 [US2] Update PreviewPanel to render GenerationProgress when generation.status === "generating", add smooth transition animation between states in `frontend/components/generation/preview-panel.tsx`
  → Artifacts: [preview-panel.tsx](frontend/components/generation/preview-panel.tsx)

**Checkpoint**: Generation progress animates with all 6 steps, progress bar, and typewriter code snippets

---

## Phase 5: User Story 3 — Review Generated Code and Take Action (Priority: P1)

**Goal**: After generation completes, code tab auto-activates showing Monaco editor with file tree and action bar (Deploy, Download ZIP, Preview).

**Independent Test**: Complete a generation, verify code tab activates, browse files in editor, click Download ZIP to download archive.

**FR Coverage**: FR-012, FR-013

### Implementation for User Story 3

- [x] T020 [US3] Create CompleteState component with reused CodeViewer (from components/projects/code-viewer.tsx), action bar below with Deploy button (gradient), Download ZIP button (secondary, calls downloadGeneratedCode from api/generation.ts), Preview button (ghost) in `frontend/components/generation/complete-state.tsx`
  → Artifacts: [complete-state.tsx](frontend/components/generation/complete-state.tsx)
- [x] T021 [US3] Update PreviewPanel to render CompleteState when generation.status === "complete", auto-switch to Code tab on completion in `frontend/components/generation/preview-panel.tsx`
  → Artifacts: [preview-panel.tsx](frontend/components/generation/preview-panel.tsx), [page.tsx](frontend/app/projects/[id]/generate/page.tsx)

**Checkpoint**: Full generation flow works end-to-end: form → generate → progress → code viewer with actions

---

## Phase 6: User Story 4 — Deploy Generated Bot (Priority: P2)

**Goal**: User clicks Deploy, enters bot token, sees deployment progress, celebrates on success or sees error with retry.

**Independent Test**: Click Deploy button, enter bot token, observe 3-phase modal flow (config → progress → success/failure), verify confetti on success.

**FR Coverage**: FR-014, FR-015, FR-016 (deploy part)

### Implementation for User Story 4

- [ ] T022 [P] [US4] Create DeployProgress component with step list (same visual pattern as GenerationProgress but for deploy steps), animated gradient border around parent container in `frontend/components/generation/deploy-progress.tsx`
- [ ] T023 [P] [US4] Create DeploySuccess component with canvas-confetti trigger (disableForReducedMotion), glow pulse animation, bot info card (@username, running status, t.me link), action buttons (Open in Telegram gradient, Back to projects secondary) in `frontend/components/generation/deploy-success.tsx`
- [ ] T024 [US4] Create DeployModal component using Dialog, 3-phase flow: Phase 1 config (bot token password input with show/hide, additional env vars, warning text, Deploy + Cancel buttons, Download ZIP alternative), Phase 2 DeployProgress, Phase 3 DeploySuccess or failure state (error details, retry + download buttons), glass card max-w-[520px] in `frontend/components/generation/deploy-modal.tsx`
- [ ] T025 [US4] Integrate DeployModal into CompleteState — Deploy button opens modal, wire deployment store actions in `frontend/components/generation/complete-state.tsx`

**Checkpoint**: Deploy modal flows through all 3 phases, confetti on success, retry on failure

---

## Phase 7: User Story 5 — Handle Generation Errors Gracefully (Priority: P2)

**Goal**: On generation error, user sees clear error state with message, expandable details, credit reassurance, retry and modify options.

**Independent Test**: Trigger error scenario (10% random), verify error state displays with all elements, retry restarts generation, modify returns to form.

**FR Coverage**: FR-016 (generation part), FR-017

### Implementation for User Story 5

- [ ] T026 [US5] Create ErrorState component with error icon (red), error message in Russian, expandable error details (collapsible), "Credits not deducted" reassurance text, Retry button (primary, calls retryGeneration), Modify Parameters button (secondary, calls resetGeneration) in `frontend/components/generation/error-state.tsx`
- [ ] T027 [US5] Update PreviewPanel to render ErrorState when generation.status === "error", add smooth transition from generating state in `frontend/components/generation/preview-panel.tsx`

**Checkpoint**: Error flow works: generation fails → error state → retry or modify

---

## Phase 8: User Story 6 — Use Generation Flow on Mobile Devices (Priority: P3)

**Goal**: On mobile (<768px), split view transforms to tabbed interface with bottom tabs, floating generate button, full-screen deploy sheet.

**Independent Test**: Open `/projects/[id]/generate` at <768px viewport, verify tab navigation, floating button, full-screen modals.

**FR Coverage**: FR-019, FR-020, FR-021, FR-022

### Implementation for User Story 6

- [ ] T028 [US6] Update Generation page to conditionally render MobileTabs (bottom tab bar) instead of split view on mobile (md breakpoint), with ChatPanel and PreviewPanel as full-width tab content, auto-switch to Preview tab on generation start in `frontend/app/projects/[id]/generate/page.tsx`
- [ ] T029 [US6] Add floating Generate button bar (fixed bottom, gradient, full-width, 44px min height) for mobile in ChatPanel, ensure all interactive elements have min 44px tap targets in `frontend/components/generation/chat-panel.tsx`
- [ ] T030 [US6] Update DeployModal to render as full-screen bottom sheet on mobile (slide-up animation, full height) in `frontend/components/generation/deploy-modal.tsx`

**Checkpoint**: Full mobile flow works: tabs → form → generate → progress → code → deploy

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Build validation, edge cases, final quality pass

- [ ] T031 Handle edge case: template with no configFields — show only FreeTextInput in ChatPanel in `frontend/components/generation/chat-panel.tsx`
- [ ] T032 Handle edge case: browser resize below min panel widths — collapse to tabbed view in `frontend/app/projects/[id]/generate/page.tsx`
- [ ] T033 Run type-check (`npm run type-check`) and fix any TypeScript errors across all new files
- [ ] T034 Run build (`npm run build`) and fix any build errors
- [ ] T035 Run quickstart.md validation — verify all 8 dev workflow steps work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (T001-T006) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on User Story 1 (needs PreviewPanel from T014)
- **User Story 3 (Phase 5)**: Depends on User Story 2 (needs PreviewPanel with progress working)
- **User Story 4 (Phase 6)**: Depends on User Story 3 (needs CompleteState with Deploy button)
- **User Story 5 (Phase 7)**: Depends on User Story 2 (needs PreviewPanel state switching)
- **User Story 6 (Phase 8)**: Depends on User Stories 1-5 (adapts all desktop components for mobile)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
     ↓
Phase 2: Foundational
     ↓
Phase 3: US1 (Config + Launch) ←── MVP STOP POINT
     ↓
Phase 4: US2 (Progress) ───────┐
     ↓                          │
Phase 5: US3 (Code Review)     │
     ↓                          │
Phase 6: US4 (Deploy) ←────────┘
     │
Phase 7: US5 (Error Handling)  ← can start after Phase 4
     ↓
Phase 8: US6 (Mobile)
     ↓
Phase 9: Polish
```

### Within Each User Story

- Components with [P] can be created in parallel (different files)
- Components without [P] depend on prior tasks in that story
- PreviewPanel updates are sequential (each story adds a state)

### Parallel Opportunities

**Phase 1 (3 parallel groups)**:
```
Group A: T001 (install deps)
Group B: T003 + T004 + T005 (mock data, store, API — all [P], different files)
Group C: T006 (animations)
Note: T002 (types) must complete before Group B starts
```

**Phase 2 (2 parallel)**:
```
T008 + T009 can run in parallel (CompactNavbar + MobileTabs)
T007 (useGeneration hook) is sequential — core dependency
```

**Phase 3 — US1 (2 parallel groups)**:
```
Group A: T010 + T011 + T013 (ConfigForm, FreeTextInput, IdleState — all [P])
Group B: T012 → T014 → T015 → T016 (sequential: ChatPanel → PreviewPanel → Page)
```

**Phase 4 — US2**:
```
T017 parallel (CodeSnippetAnimation)
T018 → T019 sequential (GenerationProgress → PreviewPanel update)
```

**Phase 6 — US4 (2 parallel)**:
```
T022 + T023 parallel (DeployProgress + DeploySuccess)
T024 → T025 sequential (DeployModal → integrate into CompleteState)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T009)
3. Complete Phase 3: User Story 1 (T010-T016)
4. **STOP and VALIDATE**: Page loads, form renders, generation starts
5. Deploy/demo if ready — minimal but functional generation page

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Config + Launch) → **MVP!** Form works, generation starts
3. Add US2 (Progress) → Users see animated progress
4. Add US3 (Code Review) → Users see generated code, download ZIP
5. Add US4 (Deploy) → One-click deployment with celebration
6. Add US5 (Error Handling) → Graceful failures with retry
7. Add US6 (Mobile) → Full mobile support
8. Polish → Edge cases, validation, final quality

### Task Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 0: Planning | 4 | — |
| Phase 1: Setup | 6 | 3 |
| Phase 2: Foundational | 3 | 2 |
| Phase 3: US1 (P1) | 7 | 3 |
| Phase 4: US2 (P1) | 3 | 1 |
| Phase 5: US3 (P1) | 2 | 0 |
| Phase 6: US4 (P2) | 4 | 2 |
| Phase 7: US5 (P2) | 2 | 0 |
| Phase 8: US6 (P3) | 3 | 0 |
| Phase 9: Polish | 5 | 0 |
| **Total** | **35 impl + 4 planning** | **11 parallelizable** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after its phase completes
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All Russian text in UI components (messages, placeholders, labels)
- Reuse existing components from components/ui/ and components/projects/ — do NOT recreate
