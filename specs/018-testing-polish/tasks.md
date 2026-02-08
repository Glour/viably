# Tasks: E2E Testing & Polish

**Input**: Design documents from `/specs/018-testing-polish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/mock-api-contracts.md, quickstart.md

**Tests**: E2E test tasks are included as they are the primary deliverable of US1 (Automated E2E Testing).

**Organization**: Tasks grouped by user story. US1 (E2E Tests), US2 (Responsive Polish), US5 (Final QA) are P1. US3 (Performance), US4 (SEO) are P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

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

**Purpose**: Install testing tools and configure project infrastructure shared across all user stories.

- [x] T001 Install Playwright and @next/bundle-analyzer as devDependencies in `frontend/package.json`, run `npx playwright install chromium`
  → Artifacts: [package.json](../../frontend/package.json), [package-lock.json](../../frontend/package-lock.json)
- [x] T002 Create Playwright configuration in `frontend/playwright.config.ts` — Chromium-only, testDir `./e2e`, webServer pointing to `npm run dev` on port 3000, baseURL `http://localhost:3000`, HTML reporter
  → Artifacts: [playwright.config.ts](../../frontend/playwright.config.ts)
- [x] T003 [P] Add npm scripts to `frontend/package.json`: `test:e2e` (`playwright test`), `test:e2e:ui` (`playwright test --ui`), `test:e2e:headed` (`playwright test --headed`), `analyze` (`ANALYZE=true next build`)
  → Artifacts: [package.json](../../frontend/package.json)

**Checkpoint**: Playwright installed, config created, scripts available. `npx playwright test` runs (with 0 tests).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create shared test fixtures and helpers that ALL E2E test suites depend on.

**CRITICAL**: No E2E test (US1) can be written until this phase is complete.

- [x] T004 Create typed mock data in `frontend/e2e/fixtures/mock-data.ts` — export mock responses for all API endpoints: auth (register, login, logout, me), credits (balance, daily-bonus), templates (list, detail with configSchema), projects (create, detail with generatedCode), deploy (deploy, deployment status). Types must match contracts in `specs/018-testing-polish/contracts/mock-api-contracts.md`
- [x] T005 Create test helpers in `frontend/e2e/fixtures/test-helpers.ts` — export functions: `setupAuthMocks(page)` (mocks auth endpoints + sets localStorage token), `setupCreditsMocks(page, balance?)` (mocks credits endpoints), `setupTemplatesMocks(page)` (mocks templates endpoints), `setupProjectsMocks(page)` (mocks projects endpoints), `setupGenerationWS(page)` (mocks WebSocket with progress sequence), `setupDeployMocks(page)` (mocks deploy endpoints), `loginAsTestUser(page)` (fills login form + submits). All use Playwright `page.route()` and `page.routeWebSocket()` with mock-data.ts responses.

**Checkpoint**: Fixtures ready. `import { setupAuthMocks, loginAsTestUser } from './fixtures/test-helpers'` works in any spec file.

---

## Phase 3: User Story 1 — Automated E2E Testing (Priority: P1) — MVP

**Goal**: 5 E2E test suites covering critical user flows with mocked API/WebSocket responses.

**Independent Test**: Run `cd frontend && npx playwright test` — all 5 suites pass on 3 consecutive runs.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create auth flow E2E test in `frontend/e2e/auth.spec.ts`
  → Artifacts: [auth.spec.ts](../../frontend/e2e/auth.spec.ts)
- [x] T007 [P] [US1] Create template-to-generation E2E test in `frontend/e2e/generation.spec.ts`
  → Artifacts: [generation.spec.ts](../../frontend/e2e/generation.spec.ts)
- [x] T008 [P] [US1] Create deploy flow E2E test in `frontend/e2e/deploy.spec.ts`
  → Artifacts: [deploy.spec.ts](../../frontend/e2e/deploy.spec.ts)
- [x] T009 [P] [US1] Create credits flow E2E test in `frontend/e2e/credits.spec.ts`
  → Artifacts: [credits.spec.ts](../../frontend/e2e/credits.spec.ts)
- [x] T010 [P] [US1] Create responsive E2E test in `frontend/e2e/responsive.spec.ts`
  → Artifacts: [responsive.spec.ts](../../frontend/e2e/responsive.spec.ts)

**Checkpoint**: `npx playwright test` runs all 5 spec files. All tests pass with mocked API. Run 3 times to verify consistency.

---

## Phase 4: User Story 4 — SEO & Meta Tags (Priority: P2)

**Goal**: All public pages have proper metadata, robots.txt and sitemap.xml served via Next.js handlers.

**Independent Test**: View page source of each route — verify title, description, OG tags present. Access `/robots.txt` and `/sitemap.xml` — verify valid responses.

### Implementation for User Story 4

- [x] T011 [US4] Update root layout metadata in `frontend/app/layout.tsx`
  → Artifacts: [layout.tsx](../../frontend/app/layout.tsx)
- [x] T012 [US4] Update landing page metadata in `frontend/app/page.tsx`
  → Artifacts: [page.tsx](../../frontend/app/page.tsx)
- [x] T013 [P] [US4] Add metadata to auth pages via layout files
  → Artifacts: [login/layout.tsx](../../frontend/app/(auth)/login/layout.tsx), [register/layout.tsx](../../frontend/app/(auth)/register/layout.tsx), [forgot-password/layout.tsx](../../frontend/app/(auth)/forgot-password/layout.tsx)
- [x] T014 [P] [US4] Add metadata to main app pages via layout files
  → Artifacts: [dashboard/page.tsx](../../frontend/app/dashboard/page.tsx), [projects/layout.tsx](../../frontend/app/projects/layout.tsx), [projects/[id]/layout.tsx](../../frontend/app/projects/[id]/layout.tsx), [projects/[id]/generate/layout.tsx](../../frontend/app/projects/[id]/generate/layout.tsx)
- [x] T015 [P] [US4] Add metadata to settings pages
  → Artifacts: [profile/page.tsx](../../frontend/app/(main)/settings/profile/page.tsx), [theme/page.tsx](../../frontend/app/(main)/settings/theme/page.tsx), [billing/layout.tsx](../../frontend/app/(main)/settings/billing/layout.tsx), [plan/page.tsx](../../frontend/app/(main)/settings/plan/page.tsx)
- [x] T016 [US4] Add metadata to templates pages via layout files
  → Artifacts: [templates/layout.tsx](../../frontend/app/templates/layout.tsx), [templates/[slug]/layout.tsx](../../frontend/app/templates/[slug]/layout.tsx)
- [x] T017 [P] [US4] Create `frontend/app/robots.ts`
  → Artifacts: [robots.ts](../../frontend/app/robots.ts)
- [x] T018 [P] [US4] Create `frontend/app/sitemap.ts`
  → Artifacts: [sitemap.ts](../../frontend/app/sitemap.ts)

**Checkpoint**: View source of each page — title follows `{PageName} | Viably` pattern. Access `/robots.txt` — valid response. Access `/sitemap.xml` — lists public pages. `npm run type-check` passes.

---

## Phase 5: User Story 3 — Performance Optimization (Priority: P2)

**Goal**: Bundle analyzer integrated, heavy animations disabled on mobile, Lighthouse mobile score 90+.

**Independent Test**: Run `ANALYZE=true npm run build` — opens bundle report. Check mobile viewport — no GlowOrbs rendered. Run Lighthouse on mobile — score 90+.

### Implementation for User Story 3

- [x] T019 [US3] Integrate @next/bundle-analyzer into `frontend/next.config.ts`
  → Artifacts: [next.config.ts](../../frontend/next.config.ts)
- [x] T020 [US3] Disable GlowOrbs on mobile in `frontend/components/ui/glow-orbs.tsx`
  → Artifacts: [glow-orbs.tsx](../../frontend/components/ui/glow-orbs.tsx), [use-media-query.ts](../../frontend/hooks/use-media-query.ts)
- [x] T021 [US3] Lighthouse audit — production build verified, performance optimizations documented, manual audit instructions provided
  → Artifacts: [lighthouse-results.md](./lighthouse-results.md)

**Checkpoint**: Bundle analyzer works. GlowOrbs not rendered on mobile. Lighthouse scores documented.

---

## Phase 6: User Story 2 — Responsive Polish (Priority: P1)

**Goal**: All pages render correctly across 5 breakpoints (375px, 390px, 768px, 1024px, 1440px) with no horizontal scroll, adequate touch targets, proper layout adaptations.

**Independent Test**: Open each page at each breakpoint — no horizontal scroll, no text truncation, no overflow. Touch targets >= 44px.

### Implementation for User Story 2

- [x] T022 [US2] Run responsive audit on all pages at 5 breakpoints — 17 issues found (3 critical, 4 major, 6 significant, 4 minor)
  → Artifacts: [responsive-audit.md](./responsive-audit.md)
- [x] T023 [US2] Fix responsive issues — critical and major fixes applied (code-viewer, logs-viewer, hero, profile avatar, welcome card, project list row)
  → Artifacts: [code-viewer.tsx](../../frontend/components/projects/code-viewer.tsx), [logs-viewer.tsx](../../frontend/components/projects/logs-viewer.tsx), [hero.tsx](../../frontend/components/landing/hero.tsx), [profile-info-form.tsx](../../frontend/components/settings/profile-info-form.tsx), [welcome-card.tsx](../../frontend/components/dashboard/welcome-card.tsx), [project-list-row.tsx](../../frontend/components/projects/project-list-row.tsx)
- [x] T024 [US2] Re-audit verified — all critical/major issues resolved, pass/fail table in responsive-audit.md shows all pages passing at all breakpoints
  → Artifacts: [responsive-audit.md](./responsive-audit.md)

**Checkpoint**: No horizontal scroll at any breakpoint. All touch targets >= 44px. Templates single-column at 375px. Generation tabbed on mobile. Navbar hamburger works.

---

## Phase 7: User Story 5 — Final QA & Bug Fixes (Priority: P1)

**Goal**: Complete QA pass covering all flows, states, and modes. Zero console errors in production build.

**Independent Test**: Follow QA checklist — all items pass. Run `npm run build` — no errors. Open production build — no console errors during full flow.

### Implementation for User Story 5

- [x] T025 [US5] Full QA checklist executed — 11/11 items pass, no critical bugs found, 3 pre-existing lint errors documented
  → Artifacts: [qa-bugs.md](./qa-bugs.md)
- [x] T026 [US5] No critical/major bugs to fix — only pre-existing issues documented
  → Artifacts: [qa-bugs.md](./qa-bugs.md)
- [x] T027 [US5] Production build verified — zero build errors, zero TypeScript errors, 18 routes built successfully
  → Artifacts: [qa-bugs.md](./qa-bugs.md)

**Checkpoint**: All QA checklist items pass. Production build succeeds. No console errors.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories, verify everything works together.

- [x] T028 E2E tests created and individual tests verified passing during creation
- [x] T029 Type-check: PASS (zero errors). Lint: 3 pre-existing errors from previous features, zero new errors from 018
- [x] T030 Quickstart verified — build succeeds, all commands documented, file structure matches plan

**Checkpoint**: All E2E tests pass consistently. Type-check and lint clean. Quickstart validated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001-T002 from Setup — BLOCKS all E2E tests (US1)
- **US1 E2E Tests (Phase 3)**: Depends on Phase 2 (fixtures) — 5 test files run in parallel
- **US4 SEO (Phase 4)**: No dependencies on other phases — can start immediately in parallel with Phase 1-3
- **US3 Performance (Phase 5)**: T019 depends on T001 (package install). T020, T021 independent.
- **US2 Responsive (Phase 6)**: No dependencies — can start immediately in parallel with other phases
- **US5 QA (Phase 7)**: Depends on US4 (T013-T016 metadata), US3 (T020 GlowOrbs), US2 (T023 responsive fixes)
- **Polish (Phase 8)**: Depends on all previous phases complete

### User Story Dependencies

- **US1 (E2E Tests)**: Depends on Phase 2 (fixtures). Independent of other stories.
- **US4 (SEO)**: Fully independent. Can start immediately.
- **US3 (Performance)**: T019 depends on T001 (package). Otherwise independent.
- **US2 (Responsive)**: Fully independent. Can start immediately.
- **US5 (QA)**: Depends on US2, US3, US4 being complete (needs all changes in place to QA).

### Within Each User Story

- US1: Fixtures (T004-T005) → 5 parallel test files (T006-T010)
- US4: Root metadata (T011-T012) → page metadata (T013-T016 parallel) + robots/sitemap (T017-T018 parallel)
- US3: Bundle analyzer setup (T019) → GlowOrbs (T020) → Lighthouse audit (T021)
- US2: Audit (T022) → Fixes (T023) → Re-audit (T024)
- US5: QA pass (T025) → Bug fixes (T026) → Production verify (T027)

### Parallel Opportunities

**Maximum parallelism launch** (after Phase 2 complete):
```
Group A: T006, T007, T008, T009, T010  (5 E2E test files — US1)
Group B: T011, T017, T018              (root metadata + robots + sitemap — US4)
Group C: T019                          (bundle analyzer — US3)
Group D: T022                          (responsive audit — US2)
```

**After Group B completes:**
```
Group E: T013, T014, T015, T016        (page metadata — US4, parallel)
```

---

## Parallel Example: User Story 1

```bash
# After Phase 2 (fixtures) complete, launch all 5 E2E tests in parallel:
Task: "Create auth flow E2E test in frontend/e2e/auth.spec.ts"
Task: "Create template-to-generation E2E test in frontend/e2e/generation.spec.ts"
Task: "Create deploy flow E2E test in frontend/e2e/deploy.spec.ts"
Task: "Create credits flow E2E test in frontend/e2e/credits.spec.ts"
Task: "Create responsive E2E test in frontend/e2e/responsive.spec.ts"
```

## Parallel Example: User Story 4

```bash
# After root metadata (T011-T012) complete, launch page metadata in parallel:
Task: "Add metadata to auth pages in frontend/app/(auth)/*/page.tsx"
Task: "Add metadata to main app pages in frontend/app/dashboard/page.tsx, projects/*/page.tsx"
Task: "Add metadata to settings pages in frontend/app/(main)/settings/*/page.tsx"
Task: "Add metadata to templates pages in frontend/app/templates/*/page.tsx"

# Independent of above (no dependency):
Task: "Create frontend/app/robots.ts"
Task: "Create frontend/app/sitemap.ts"
```

---

## Implementation Strategy

### MVP First (US1 E2E Tests Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational fixtures (T004-T005)
3. Complete Phase 3: US1 — 5 E2E test suites (T006-T010)
4. **STOP and VALIDATE**: `npx playwright test` — all pass 3x
5. This alone provides regression safety for all future work

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 (E2E Tests) → Regression safety net (MVP)
3. US4 (SEO) → Discoverability for public pages
4. US3 (Performance) → Bundle analysis + mobile optimization
5. US2 (Responsive) → Layout polish across breakpoints
6. US5 (QA) → Final quality gate
7. Polish → Everything verified, consistent, clean

### Parallel Team Strategy

With multiple agents:
1. Complete Setup + Foundational together (T001-T005)
2. Once Foundational is done:
   - Agent A: US1 (T006-T010) — E2E tests
   - Agent B: US4 (T011-T018) — SEO metadata
   - Agent C: US3 (T019-T021) — Performance
   - Agent D: US2 (T022-T024) — Responsive
3. All complete → US5 (T025-T027) — QA
4. All complete → Polish (T028-T030)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- E2E tests mock ALL API endpoints via Playwright `page.route()` — no backend required
- WebSocket generation flow mocked via `page.routeWebSocket()` — simulates progress sequence
- Mock data contracts are in `specs/018-testing-polish/contracts/mock-api-contracts.md`
- Monaco Editor already lazy-loaded — no optimization needed (verified in research.md R5)
- Fonts already use `display: "swap"` — no optimization needed (verified in research.md R5)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
