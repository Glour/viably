# Tasks: Projects List & Detail Pages

**Input**: Design documents from `/specs/012-projects-pages/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not requested in spec. No test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (frontend only)**: `frontend/` at repository root
- Follows existing Next.js App Router structure with `app/`, `components/`, `stores/`, `types/`, `lib/`

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

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, add shadcn/ui components, extend types and badge variants

- [x] T001 Install `@monaco-editor/react` package in `frontend/package.json`
- [x] T002 Install shadcn/ui components: dropdown-menu, tabs, dialog, select, switch, alert-dialog, tooltip via `npx shadcn@latest add` in `frontend/`
- [x] T003 Extend `ProjectStatus` type and add all Project-related types (Project, DeploymentInfo, ProjectFile, LogEntry, EnvVariable, ProjectsStoreState, ViewMode, ProjectFilter, ProjectSort, API response types) in `frontend/types/index.ts` per data-model.md
- [x] T004 Add `info` and `neutral-dark` badge variants (blue for Generating with pulse animation, dark for Stopped) in `frontend/components/ui/badge.tsx`

**Checkpoint**: All dependencies installed, types defined, badge variants ready. Foundation for all user stories.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mock data, API layer, and Zustand store — shared by ALL user stories

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Create mock project data (6-8 projects with varied statuses, config, deployment info, files tree, env vars, logs) in `frontend/lib/data/projects.ts`
- [x] T006 Implement mock API functions (getProjects, getProjectById, deleteProject, duplicateProject, updateProjectEnvVars, toggleProjectStatus) with delays per contracts/api.md in `frontend/lib/api/projects.ts`
- [x] T007 Create Zustand projects store with all state, actions, and getFilteredProjects computed method per data-model.md in `frontend/stores/projects.ts`

**Checkpoint**: Data layer complete. Store can load projects, filter/sort/search, delete. All user stories can now begin.

---

## Phase 3: User Story 1 — Browse and Manage Projects List (Priority: P1) MVP

**Goal**: Users see all projects in grid/list view with search, filter, sort, view toggle, and action menu.

**Independent Test**: Open `/projects`, verify grid shows mock projects. Toggle to list view. Search, filter by status, sort. Open action menu, click Delete — confirm modal appears.

### Implementation for User Story 1

- [x] T008 [P] [US1] Create ProjectActionMenu component (⋮ dropdown with Open, Duplicate, Download ZIP, divider, Delete with red text) using shadcn DropdownMenu in `frontend/components/projects/project-action-menu.tsx`
- [x] T009 [P] [US1] Create ProjectCard component (emoji+name, status badge, description line-clamp-2, footer with relative time + action menu, hover: lift + gradient top line) using Card in `frontend/components/projects/project-card.tsx`
- [x] T010 [P] [US1] Create ProjectListRow component (table-like row: emoji+name, category, status badge, updated time, action menu, hover bg) in `frontend/components/projects/project-list-row.tsx`
- [x] T011 [P] [US1] Create ProjectToolbar component (search input with useDebounce, status filter Select, sort Select, grid/list view toggle buttons) in `frontend/components/projects/project-toolbar.tsx`
- [x] T012 [P] [US1] Create ProjectNoResults component (inline "no results" message with suggestion to clear filters) in `frontend/components/projects/project-no-results.tsx`
- [x] T013 [US1] Create delete confirmation dialog using AlertDialog (warning text about permanent deletion, confirm/cancel buttons) in `frontend/components/projects/delete-project-dialog.tsx`
- [x] T014 [US1] Replace stub with full projects list page: header (H1 "Мои проекты" + "+ Новый проект" gradient button, subtitle with count/limit/plan), toolbar, grid/list conditional rendering (responsive: 3/2/1 columns grid, list view default on mobile), loading Shimmer state, integrate store in `frontend/app/projects/page.tsx`

**Checkpoint**: Projects list page fully functional. Grid/list toggle, search, filter, sort, action menu with delete confirmation all working.

→ Artifacts: `project-action-menu.tsx`, `project-card.tsx`, `project-list-row.tsx`, `project-toolbar.tsx`, `project-no-results.tsx`, `delete-project-dialog.tsx`, `app/projects/page.tsx`

---

## Phase 4: User Story 2 — View Project Details and Overview (Priority: P1)

**Goal**: Users click a project card to open detail page with header, tab navigation, and Overview tab content.

**Independent Test**: Click a project card from list. Verify detail page shows header with emoji, name, status, category, created date, action buttons. Click tabs — URL changes. Overview shows config key-value pairs and deployment info.

### Implementation for User Story 2

- [x] T015 [P] [US2] Create ProjectDetailHeader component (breadcrumb "← Назад к проектам", project info card: emoji+name H2+status badge, category+created date, action buttons: Open in Telegram, Redeploy, Download ZIP, Settings dropdown; disable actions for generating/draft status) using Tooltip and Button in `frontend/components/projects/project-detail-header.tsx`
- [x] T016 [P] [US2] Create ProjectTabs component (shadcn Tabs controlled by useSearchParams ?tab=, values: overview/code/logs/settings, default overview, shallow URL navigation with useRouter) in `frontend/components/projects/project-tabs.tsx`
- [x] T017 [P] [US2] Create OverviewTab component (two sections: Config — key-value pairs in card grid, Deployment Info — URL, bot username, status, running since, cost estimate in info card) in `frontend/components/projects/overview-tab.tsx`
- [x] T018 [US2] Create project detail page: load project by id from store, show Shimmer while loading, render ProjectDetailHeader + ProjectTabs with tab content switching (Overview, Code placeholder, Logs placeholder, Settings placeholder), handle 404 in `frontend/app/projects/[id]/page.tsx`

**Checkpoint**: Project detail page navigable from list. Header shows all info. Tabs switch via URL. Overview displays config and deployment data. Code/Logs/Settings show placeholders.

→ Artifacts: `project-detail-header.tsx`, `project-tabs.tsx`, `overview-tab.tsx`, `app/projects/[id]/page.tsx`

---

## Phase 5: User Story 3 — View and Navigate Project Code (Priority: P2)

**Goal**: Users inspect generated bot code with a file tree and read-only Monaco editor.

**Independent Test**: Navigate to project detail → Code tab. File tree shows mock files. Click file — Monaco loads content with Python syntax highlighting. Read-only mode. Folders expand/collapse.

### Implementation for User Story 3

- [x] T019 [P] [US3] Create FileTree recursive component (folder/file icons via lucide-react, click file → callback with file path, click folder → expand/collapse, active file highlighted, styled to match design system) in `frontend/components/projects/file-tree.tsx`
- [x] T020 [US3] Create CodeViewer component (split layout: FileTree 200px left + @monaco-editor/react right, read-only, vs-dark theme always, JetBrains Mono font, line numbers + minimap, Python syntax highlighting, Shimmer loading state while Monaco loads, empty state "No files available" when no files) in `frontend/components/projects/code-viewer.tsx`
- [x] T021 [US3] Integrate CodeViewer into project detail page Code tab (replace placeholder), pass project files from store in `frontend/app/projects/[id]/page.tsx`

**Checkpoint**: Code tab fully functional. File tree navigates mock files. Monaco displays Python code read-only with syntax highlighting.

→ Artifacts: `file-tree.tsx`, `code-viewer.tsx`, updated `app/projects/[id]/page.tsx`

---

## Phase 6: User Story 4 — Monitor Project Logs (Priority: P2)

**Goal**: Users view terminal-style logs with color-coded levels, filtering, and auto-scroll.

**Independent Test**: Navigate to project detail → Logs tab. Dark terminal viewer shows colored log entries. Filter by Error — only errors shown. Click Clear — logs disappear. Auto-scrolls to bottom.

### Implementation for User Story 4

- [x] T022 [US4] Create LogsViewer component (dark bg #0D1117, JetBrains Mono font, colored output: timestamps gray, INFO green, WARNING yellow, ERROR red; filter buttons All/Info/Warning/Error, Clear button, auto-scroll to bottom via useRef+scrollIntoView, mock log data from project) in `frontend/components/projects/logs-viewer.tsx`
- [x] T023 [US4] Integrate LogsViewer into project detail page Logs tab (replace placeholder), pass project logs from store in `frontend/app/projects/[id]/page.tsx`

**Checkpoint**: Logs tab fully functional. Terminal appearance, color coding, level filter, clear, auto-scroll all working.

→ Artifacts: `logs-viewer.tsx`, updated `app/projects/[id]/page.tsx`

---

## Phase 7: User Story 5 — Manage Project Settings (Priority: P2)

**Goal**: Users manage environment variables, control bot start/stop, and access danger zone for project deletion.

**Independent Test**: Navigate to project detail → Settings tab. Env vars section shows masked values, add/remove rows work. Start/Stop toggle switches states. Delete in Danger Zone shows confirmation.

### Implementation for User Story 5

- [x] T024 [P] [US5] Create EnvVarEditor component (dynamic rows: key input + value input + show/hide eye toggle + delete row button, add variable button, key validation regex ^[a-zA-Z_][a-zA-Z0-9_-]*$, local state management) in `frontend/components/projects/env-var-editor.tsx`
- [x] T025 [P] [US5] Create DangerZone component (red border card, heading "Danger Zone", description about permanent deletion, Delete Project button in red, AlertDialog confirmation modal with warning text) in `frontend/components/projects/danger-zone.tsx`
- [x] T026 [US5] Create ProjectSettings component (three sections: Environment Variables with EnvVarEditor, Actions with Start/Stop Switch toggle green/red + Redeploy button + Download ZIP button, Danger Zone with DangerZone component; toast notifications for mock actions) in `frontend/components/projects/project-settings.tsx`
- [x] T027 [US5] Integrate ProjectSettings into project detail page Settings tab (replace placeholder), connect store actions (toggleProjectStatus, deleteProject with redirect) in `frontend/app/projects/[id]/page.tsx`

**Checkpoint**: Settings tab fully functional. Env vars editable. Start/Stop toggles. Danger zone with delete confirmation working.

→ Artifacts: `env-var-editor.tsx`, `danger-zone.tsx`, `project-settings.tsx`, updated `app/projects/[id]/page.tsx`

---

## Phase 8: User Story 6 — Empty State for New Users (Priority: P3)

**Goal**: New users with no projects see onboarding empty state with CTA buttons.

**Independent Test**: Set mock data to empty array. Open `/projects`. Centered empty state with illustration, heading, subheading, two CTA buttons (Choose template → /templates, Create from scratch → /projects/new).

### Implementation for User Story 6

- [x] T028 [US6] Create ProjectEmptyState component (centered layout, illustration/icon, heading "У тебя пока нет проектов", subheading "Создай первый бот за 60 секунд!", gradient button "Выбрать шаблон →" linking to /templates, secondary button "Создать с нуля →" linking to /projects/new) in `frontend/components/projects/project-empty-state.tsx`
- [x] T029 [US6] Integrate ProjectEmptyState into projects list page (show when projects array is empty and not loading, replace grid/list content) in `frontend/app/projects/page.tsx`

**Checkpoint**: Empty state displays correctly when no projects. Both CTAs navigate to correct routes.

→ Artifacts: `project-empty-state.tsx`, updated `app/projects/page.tsx`

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, responsive polish, accessibility check

- [x] T030 Run `npm run build` in `frontend/` to verify type-check and build pass with zero errors
- [x] T031 Verify responsive behavior: projects grid 3→2→1 columns, list view default on mobile, detail page tabs stack properly, code viewer collapses file tree on mobile
- [x] T032 Mark all tasks complete in `specs/012-projects-pages/tasks.md` and add artifact links

→ Artifacts: [button.tsx](frontend/components/ui/button.tsx), [code-viewer.tsx](frontend/components/projects/code-viewer.tsx)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types must exist for mock data)
- **Phase 3-8 (User Stories)**: All depend on Phase 2 (store + API + mock data)
  - US1 (Phase 3): No dependencies on other stories
  - US2 (Phase 4): No dependencies on other stories (card link from US1 is nice-to-have, not blocking)
  - US3 (Phase 5): Depends on US2 (detail page must exist for Code tab)
  - US4 (Phase 6): Depends on US2 (detail page must exist for Logs tab)
  - US5 (Phase 7): Depends on US2 (detail page must exist for Settings tab)
  - US6 (Phase 8): No dependencies on other stories (list page integration)
- **Phase 9 (Polish)**: Depends on all user stories complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                        ↓
          ┌─────────────┼──────────────┐
          ↓             ↓              ↓
    US1 (List)    US2 (Detail)    US6 (Empty)
                   ↓    ↓    ↓
                 US3  US4  US5
                (Code)(Logs)(Settings)
                        ↓
                  Phase 9 (Polish)
```

### Parallel Opportunities

**Phase 1**: T001 + T002 can run in parallel (npm install + shadcn add). T003 + T004 after types installed.
**Phase 2**: T005 + T006 + T007 can run in parallel (different files, all use types from Phase 1).
**Phase 3 (US1)**: T008-T012 all parallel (independent component files). T013 after T008 (uses menu pattern). T014 after all components ready.
**Phase 4 (US2)**: T015-T017 all parallel (independent components). T018 after all ready.
**Phase 5 (US3)**: T019 parallel-independent. T020 depends on T019 (uses FileTree). T021 after T020.
**Phase 7 (US5)**: T024 + T025 parallel (independent components). T026 depends on both. T027 after T026.
**Cross-story**: US1 + US2 + US6 can all run in parallel after Phase 2.

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch all independent components in parallel:
Task: "Create ProjectActionMenu in frontend/components/projects/project-action-menu.tsx"
Task: "Create ProjectCard in frontend/components/projects/project-card.tsx"
Task: "Create ProjectListRow in frontend/components/projects/project-list-row.tsx"
Task: "Create ProjectToolbar in frontend/components/projects/project-toolbar.tsx"
Task: "Create ProjectNoResults in frontend/components/projects/project-no-results.tsx"

# Then sequential (depends on above):
Task: "Create delete confirmation dialog in frontend/components/projects/delete-project-dialog.tsx"
Task: "Replace projects page stub with full implementation in frontend/app/projects/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (install deps, types, badges)
2. Complete Phase 2: Foundational (mock data, API, store)
3. Complete Phase 3: User Story 1 (projects list page)
4. **STOP and VALIDATE**: List page works independently
5. Complete Phase 4: User Story 2 (detail page + overview)
6. **STOP and VALIDATE**: List → Detail navigation works

### Incremental Delivery

1. Setup + Foundational → Data layer ready
2. US1 (List) → First usable page (MVP!)
3. US2 (Detail + Overview) → Navigation works
4. US3 (Code tab) → Code inspection
5. US4 (Logs tab) → Log monitoring
6. US5 (Settings tab) → Full management
7. US6 (Empty state) → Onboarding polish
8. Polish → Responsive + build verification

---

## Notes

- Total tasks: **32** (4 planning + 4 setup + 3 foundational + 7 US1 + 4 US2 + 3 US3 + 2 US4 + 4 US5 + 2 US6 + 3 polish)
- All mock data — no backend integration needed
- Monaco Editor lazy-loaded from CDN — no SSR concerns with `"use client"`
- Reuses existing: MainLayout, FadeInUp, Shimmer, useDebounce, Badge, Card, Button, Input, cn()
- New shadcn/ui: DropdownMenu, Tabs, Dialog, Select, Switch, AlertDialog, Tooltip
- New npm: @monaco-editor/react
