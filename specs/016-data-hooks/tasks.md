# Tasks: Data Hooks (React Query Integration)

**Input**: Design documents from `/specs/016-data-hooks/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Paths relative to `frontend/`

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

## Phase 1: Setup (Dependencies & Infrastructure)

**Purpose**: Install React Query and create foundational infrastructure files

- [x] T001 Install @tanstack/react-query and @tanstack/react-query-devtools in frontend/package.json
- [x] T002 [P] Create QueryClient configuration in frontend/lib/api/query-client.ts — default staleTime 5min, gcTime 10min, retry 1 for queries, 0 for mutations, refetchOnWindowFocus false
- [x] T003 [P] Create query keys convention file in frontend/lib/api/query-keys.ts — hierarchical keys for user, templates, projects, credits per contracts/query-keys.ts
- [x] T004 Create Providers component in frontend/app/providers.tsx — 'use client', QueryClientProvider wrapping children, ReactQueryDevtools in development only
- [x] T005 Update root layout in frontend/app/layout.tsx — wrap ThemeProvider+AuthInitializer+Toaster inside new Providers component

→ Artifacts: `frontend/lib/api/query-client.ts`, `frontend/lib/api/query-keys.ts`, `frontend/app/providers.tsx`, `frontend/app/layout.tsx`

**Checkpoint**: App starts without errors, QueryClientProvider active, DevTools visible in dev mode

---

## Phase 2: Foundational (Types, Mappers, API Functions)

**Purpose**: Core types and API functions that ALL user stories depend on. MUST complete before any story phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Add new types to frontend/types/index.ts — CreditBalance, DailyBonusInfo, DailyBonusClaim, TransactionsPaginated, PaginationMeta, ProjectsPaginated, UpdateProfilePayload, CreateProjectPayload, UpdateProjectPayload, BackendProjectStatus; update CreditTransaction to match backend fields; update Template to include backend API fields (id, configSchema, usageCount, previewImageUrl); update Project to include backend API fields (userId, isPublic, generatedCode, generationLogs, aiModelUsed, errorMessage, deployedUrl, deployPlatform, generatedAt, deployedAt)
- [x] T007 [P] Create snake_case→camelCase mappers in frontend/lib/api/mappers.ts — mapUser (existing moved from client.ts), mapCreditBalance, mapDailyBonusInfo, mapDailyBonusClaim, mapCreditTransaction, mapTransactionsPaginated, mapTemplate, mapProject, mapProjectsPaginated, mapProjectStatus (ready→generated, error→failed)
- [x] T008 [P] Create user API functions in frontend/lib/api/users.ts — fetchCurrentUser(signal), updateProfile(payload, signal) using ky api instance with mappers; replaces getCurrentUser from auth.ts
- [x] T009 [P] Create credits API functions in frontend/lib/api/credits.ts — fetchCreditBalance(signal), fetchDailyBonusStatus(signal), claimDailyBonus(), fetchCreditTransactions(params, signal) using ky api instance with mappers
- [x] T010 [P] Replace mock templates API in frontend/lib/api/templates.ts — fetchTemplates(params?, signal), fetchTemplate(slugOrId, signal) using real ky api calls with mappers; remove mock data imports
- [x] T011 [P] Replace mock projects API in frontend/lib/api/projects.ts — fetchProjects(params?, signal), fetchProject(id, signal), createProject(payload), deleteProject(id), updateProject(id, payload) using real ky api calls with mappers; remove mock data imports and PROJECTS constant
- [x] T012 [P] Replace mock settings API in frontend/lib/api/settings.ts — replace getProfile/updateProfile/getTransactions with imports from users.ts and credits.ts; remove mock data imports; keep only functions not covered by other modules

→ Artifacts: `frontend/types/index.ts`, `frontend/lib/api/mappers.ts`, `frontend/lib/api/users.ts`, `frontend/lib/api/credits.ts`, `frontend/lib/api/templates.ts`, `frontend/lib/api/projects.ts`, `frontend/lib/api/settings.ts`

**Checkpoint**: All API functions compile (type-check passes), mappers tested against expected backend response shapes

---

## Phase 3: User Story 1 — Инфраструктура кэширования данных (Priority: P1) 🎯 MVP

**Goal**: React Query setup works, caching behavior verified, all subsequent hooks can use the infrastructure

**Independent Test**: App starts without errors, data is cached between page transitions, retry on error works

> Note: This US is already fully covered by Phase 1 (Setup). Marking complete after Phase 1 checkpoint passes.

**Checkpoint**: Phase 1 artifacts validated — QueryClientProvider active, staleTime/gcTime/retry configured correctly

---

## Phase 4: User Story 2 — Данные пользователя и кредитов (Priority: P1)

**Goal**: Navbar and all pages show real user name + credit balance from API

**Independent Test**: After login, navbar shows real name and credit count from backend API

- [x] T013 [P] [US2] Create useCurrentUser hook in frontend/lib/hooks/use-user.ts — useQuery wrapping fetchCurrentUser, queryKey: queryKeys.user.me, enabled only when authenticated (check auth store)
- [x] T014 [P] [US2] Create useUpdateProfile hook in frontend/lib/hooks/use-user.ts — useMutation wrapping updateProfile, onSuccess: invalidate queryKeys.user.me, sync auth store user
- [x] T015 [P] [US2] Create useCreditBalance hook in frontend/lib/hooks/use-credits.ts — useQuery wrapping fetchCreditBalance, queryKey: queryKeys.credits.balance, enabled only when authenticated
- [x] T016 [P] [US2] Create useDailyBonusStatus hook in frontend/lib/hooks/use-credits.ts — useQuery wrapping fetchDailyBonusStatus, queryKey: queryKeys.credits.dailyBonus
- [x] T017 [P] [US2] Create useClaimDailyBonus hook in frontend/lib/hooks/use-credits.ts — useMutation wrapping claimDailyBonus, onSuccess: invalidate credits.balance + credits.dailyBonus, optimistic update balance in cache, toast success "Бонус получен!"
- [x] T018 [US2] Update navbar in frontend/components/layout/navbar.tsx — replace hardcoded credits with useCreditBalance() hook; show loading state and real balance

→ Artifacts: `frontend/lib/hooks/use-user.ts`, `frontend/lib/hooks/use-credits.ts`, `frontend/components/layout/navbar.tsx`

**Checkpoint**: Navbar shows real user name and credit balance from API; skeletons during loading; error state on API failure

---

## Phase 5: User Story 3 — Дашборд с актуальными данными (Priority: P1)

**Goal**: Dashboard shows real data from API — welcome card, recent projects, quick actions, daily bonus

**Independent Test**: Open dashboard, verify all cards show data from API, claim daily bonus works

- [x] T019 [P] [US3] Create useRecentProjects hook in frontend/lib/hooks/use-projects.ts — useQuery wrapping fetchProjects({page:1, per_page:3}), queryKey: queryKeys.projects.recent, returns projects array
- [x] T020 [US3] Update welcome card in frontend/components/dashboard/welcome-card.tsx — self-contained with useCurrentUser() + useCreditBalance(); loading shimmer
- [x] T021 [US3] Quick actions kept as-is (static data, no API dependency)
- [x] T022 [US3] Update recent projects in frontend/components/dashboard/recent-projects.tsx — self-contained with useRecentProjects(); loading shimmer
- [x] T023 [US3] Update daily bonus card in frontend/components/dashboard/daily-bonus.tsx — replaced useDailyBonusStore with useDailyBonusStatus() + useClaimDailyBonus()
- [x] T024 [US3] Update dashboard page in frontend/app/dashboard/page.tsx — removed useDashboardStore, hooks self-fetch
- [x] T025 [US3] Deleted frontend/stores/dashboard.ts — fully replaced by hooks
- [x] T026 [US3] Deleted frontend/stores/daily-bonus.ts — fully replaced by hooks

→ Artifacts: `frontend/lib/hooks/use-projects.ts`, `frontend/components/dashboard/*.tsx`, `frontend/app/dashboard/page.tsx`, `frontend/stores/dashboard.ts` (simplified/deleted), `frontend/stores/daily-bonus.ts` (deleted)

**Checkpoint**: Dashboard shows real user data, real recent projects, daily bonus works with optimistic updates

---

## Phase 6: User Story 4 — Галерея шаблонов из API (Priority: P2)

**Goal**: Templates gallery and detail pages load real templates from API with filtering

**Independent Test**: Open templates page, filter by category, search by name, open detail page, click "Create Project"

- [x] T027 [P] [US4] Create useTemplates hook in frontend/lib/hooks/use-templates.ts — staleTime 30min, gcTime 60min
- [x] T028 [P] [US4] Create useTemplate hook in frontend/lib/hooks/use-templates.ts — enabled when slugOrId provided
- [x] T029 [P] [US4] Create useCreateProject hook in frontend/lib/hooks/use-projects.ts — invalidates projects on success
- [x] T030 [US4] Update templates gallery page — useTemplates() + client-side filtering + apiToTemplate adapter
- [x] T031 [US4] Update template detail page — useTemplate(slug) + useCreditBalance() + useCreateProject()
- [x] T032 [US4] Simplify templates store — UI-only: searchQuery, activeTab, setters

→ Artifacts: `frontend/lib/hooks/use-templates.ts`, `frontend/app/templates/page.tsx`, `frontend/app/templates/[slug]/page.tsx`, `frontend/stores/templates.ts`

**Checkpoint**: Templates gallery shows API data, filtering works, detail page shows config schema, "Create Project" creates project and redirects

---

## Phase 7: User Story 5 — Управление проектами через API (Priority: P2)

**Goal**: Projects list and detail pages load real data with CRUD operations

**Independent Test**: Open projects page, filter by status, search, delete a project (optimistic), open detail page with code/logs tabs

- [x] T033 [P] [US5] Create useProjects hook in frontend/lib/hooks/use-projects.ts — paginated query with filters
- [x] T034 [P] [US5] Create useProject hook in frontend/lib/hooks/use-projects.ts — single project detail
- [x] T035 [P] [US5] Create useDeleteProject hook — invalidates projects on success
- [x] T036 [P] [US5] Create useUpdateProject hook — invalidates project detail + list on success
- [x] T037 [US5] Update projects list page — useProjects() + client-side filtering + apiToProject adapter
- [x] T038 [US5] Update project detail page — useProject(id) + useDeleteProject() + code/logs adapters
- [x] T039 [US5] Simplify projects store — UI-only: searchQuery, filter, sort, viewMode, setters

→ Artifacts: `frontend/lib/hooks/use-projects.ts` (completed), `frontend/app/projects/page.tsx`, `frontend/app/projects/[id]/page.tsx`, `frontend/stores/projects.ts`

**Checkpoint**: Projects list shows API data with filters, delete works with optimistic update, detail page shows real code/logs

---

## Phase 8: User Story 6 — История транзакций с пагинацией (Priority: P3)

**Goal**: Credit transactions page with infinite scroll pagination

**Independent Test**: Open billing page, scroll down to trigger loading of next page, filter by transaction type

- [x] T040 [P] [US6] Create useCreditTransactions infinite query hook in frontend/lib/hooks/use-credits.ts
- [x] T041 [US6] Update billing page + credit-balance-card + transaction-history — replaced stores with hooks
- [x] T042 [US6] Simplify settings store — kept transactionFilter + profile/plan actions for profile page

→ Artifacts: `frontend/lib/hooks/use-credits.ts` (completed), `frontend/app/(main)/settings/billing/page.tsx`, `frontend/stores/settings.ts`

**Checkpoint**: Billing page shows paginated transactions, infinite scroll loads more, filter by type works

---

## Phase 9: User Story 7 — Редактирование профиля (Priority: P3)

**Goal**: Profile page allows editing name/avatar with API persistence

**Independent Test**: Change name in settings, verify navbar updates immediately after save

- [x] T043 [US7] Update profile settings page + profile-info-form — replaced useSettingsStore with useCurrentUser() + useUpdateProfile() hooks
- [x] T044 [US7] Final settings store simplification — UI-only: transactionFilter. Plan/password components use mock data and API directly

→ Artifacts: `frontend/app/(main)/settings/profile/page.tsx`, `frontend/stores/settings.ts` (final simplification)

**Checkpoint**: Profile edit saves to API, navbar shows updated name, error handling works

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, dead code removal, final validation

- [ ] T045 Delete mock data files no longer used: frontend/lib/api/dashboard.ts (replaced by hooks), frontend/lib/data/projects.ts (if no longer imported), frontend/lib/data/settings.ts (if no longer imported) — verify no remaining imports before deletion
- [ ] T046 Delete frontend/lib/data/templates.ts if no longer imported — verify no remaining imports; generation store may still reference mock templates, keep if so
- [ ] T047 Audit all stores for dead code — run grep for removed store methods across all components; remove any orphaned imports
- [ ] T048 Run type-check (npm run type-check) and fix any TypeScript errors across all modified files
- [ ] T049 Run build (npm run build) and fix any build errors
- [ ] T050 Validate quickstart.md scenarios — app starts, dashboard loads real data, templates gallery works, projects CRUD works, daily bonus works, transactions paginate

→ Artifacts: Cleaned codebase, passing type-check + build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001 (npm install) — BLOCKS all user stories
- **Phase 3 (US1)**: Covered by Phase 1 — no additional work
- **Phase 4 (US2)**: Depends on Phase 2 — hooks need types + API functions + mappers
- **Phase 5 (US3)**: Depends on Phase 4 (US2) — dashboard uses useCurrentUser + useCreditBalance from US2
- **Phase 6 (US4)**: Depends on Phase 2 — can run in PARALLEL with Phase 4/5
- **Phase 7 (US5)**: Depends on Phase 2 — can run in PARALLEL with Phase 4/5/6
- **Phase 8 (US6)**: Depends on Phase 2 — can run in PARALLEL with Phase 4-7
- **Phase 9 (US7)**: Depends on Phase 4 (US2) — uses useCurrentUser + useUpdateProfile
- **Phase 10 (Polish)**: Depends on ALL previous phases

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                        ↓
            ┌───────────┼───────────┬───────────┐
            ↓           ↓           ↓           ↓
        Phase 4      Phase 6     Phase 7     Phase 8
        (US2: P1)    (US4: P2)   (US5: P2)   (US6: P3)
            ↓
      ┌─────┴─────┐
      ↓           ↓
  Phase 5     Phase 9
  (US3: P1)   (US7: P3)
      ↓           ↓
      └─────┬─────┘
            ↓
        Phase 10 (Polish)
```

### Within Each Phase — Parallel Opportunities

- **Phase 2**: T006-T012 ALL run in parallel (different files, no dependencies)
- **Phase 4**: T013-T017 run in parallel (different hooks in different files), then T018 sequential
- **Phase 5**: T019 parallel with Phase 4, then T020-T026 sequential (same component updates)
- **Phase 6**: T027-T029 parallel (different hook files), then T030-T032 sequential
- **Phase 7**: T033-T036 parallel (same file but additive hooks), then T037-T039 sequential
- **Phase 8**: T040 then T041-T042 sequential
- **Phase 9**: T043-T044 sequential

---

## Parallel Example: Phase 2 (Foundational)

```bash
# All 7 tasks run in parallel — each touches different files:
Task: "T006 — Add types to frontend/types/index.ts"
Task: "T007 — Create mappers in frontend/lib/api/mappers.ts"
Task: "T008 — Create user API in frontend/lib/api/users.ts"
Task: "T009 — Create credits API in frontend/lib/api/credits.ts"
Task: "T010 — Replace templates API in frontend/lib/api/templates.ts"
Task: "T011 — Replace projects API in frontend/lib/api/projects.ts"
Task: "T012 — Replace settings API in frontend/lib/api/settings.ts"
```

## Parallel Example: Phase 4 + Phase 6 + Phase 7

```bash
# After Phase 2, these can run simultaneously:
# Agent A: Phase 4 (US2) — user + credits hooks + navbar
# Agent B: Phase 6 (US4) — templates hooks + pages
# Agent C: Phase 7 (US5) — projects hooks + pages
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Complete Phase 1: Setup — install React Query, create provider
2. Complete Phase 2: Foundational — types, mappers, API functions
3. Complete Phase 4: US2 — user data + credits in navbar
4. Complete Phase 5: US3 — dashboard with real data
5. **STOP and VALIDATE**: Dashboard works with real API data

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US2 (navbar) → Real user data visible everywhere (MVP!)
3. US3 (dashboard) → Main page fully functional
4. US4 (templates) → Gallery works with API
5. US5 (projects) → CRUD fully operational
6. US6 (transactions) → Billing page with pagination
7. US7 (profile) → Profile editing works
8. Polish → Cleanup dead code, final validation

---

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 50 (P001-P004 + T001-T050) |
| Phase 1 (Setup) | 5 |
| Phase 2 (Foundational) | 7 |
| Phase 4 (US2) | 6 |
| Phase 5 (US3) | 8 |
| Phase 6 (US4) | 6 |
| Phase 7 (US5) | 7 |
| Phase 8 (US6) | 3 |
| Phase 9 (US7) | 2 |
| Phase 10 (Polish) | 6 |
| Max parallel in Phase 2 | 7 tasks |
| Max parallel phases | 4 (US2 + US4 + US5 + US6) |

---

## Notes

- [P] tasks = different files, no dependencies — safe to parallelize
- [Story] label maps task to specific user story
- No test tasks generated (not requested in spec)
- Hooks that need `enabled: !!isAuthenticated` check auth store to prevent unauthenticated requests
- Status mapping (ready→generated, error→failed) in mappers.ts is critical for UI compatibility
- Mock data files (lib/data/*) deleted only after verifying zero remaining imports
- Settings store simplified incrementally across US6 + US7 phases
- Password change (US7 acceptance scenario 2) skipped — backend endpoint not implemented
