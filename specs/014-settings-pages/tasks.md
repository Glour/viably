# Tasks: Settings Pages

**Input**: Design documents from `/specs/014-settings-pages/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/settings-api.md, quickstart.md

**Tests**: Not requested in specification. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

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

**Purpose**: Add new types, mock data, validation schemas, API layer, and store — foundation for all settings pages.

- [ ] T001 [P] Add settings-related types (SettingsSection, CreditTransaction, CreditPackage, SubscriptionPlan, UserPlanInfo, ThemeMode, TransactionType, TransactionFilter, PlanTier, SettingsStoreState, and API response types) to `frontend/types/index.ts` per data-model.md
- [ ] T002 [P] Create mock data module with MOCK_TRANSACTIONS (20-30 entries), AVAILABLE_PLANS (5 tiers), CREDIT_PACKAGES (3 packages), MOCK_USER_PLAN in `frontend/lib/data/settings.ts` per contracts/settings-api.md
- [ ] T003 [P] Create validation schemas (profileSchema, changePasswordSchema, customCreditsSchema) with inferred types in `frontend/lib/validations/settings.ts` per data-model.md
- [ ] T004 Create mock API functions (getProfile, updateProfile, changePassword, getTransactions, getUserPlan) with simulated delays in `frontend/lib/api/settings.ts` per contracts/settings-api.md (depends on T001, T002)
- [ ] T005 Create Zustand settings store (useSettingsStore) with profile, billing, plan state and actions in `frontend/stores/settings.ts` per data-model.md (depends on T001, T004)

**Checkpoint**: Foundation ready — all types, data, store, and API modules available for component development.

---

## Phase 2: User Story 1 — Navigate Settings Sections (Priority: P1) MVP

**Goal**: Settings layout with sidebar navigation (desktop) and horizontal tabs (mobile). Redirect `/settings` to `/settings/profile`.

**Independent Test**: Open `/settings` — see sidebar with 4 sections, click between them, verify active highlighting. On mobile viewport — horizontal tabs appear instead of sidebar.

### Implementation for User Story 1

- [ ] T006 [US1] Create SettingsSidebar component with sidebar nav (desktop: 220px aside with nav links, icons User/CreditCard/Crown/Palette, active state with primary bg + text) and horizontal Tabs (mobile: md:hidden) in `frontend/components/settings/settings-sidebar.tsx` (depends on T001)
- [ ] T007 [US1] Create settings layout with MainLayout wrapper, SettingsSidebar, and content area in `frontend/app/(main)/settings/layout.tsx` (depends on T006)
- [ ] T008 [US1] Create settings index page that redirects to `/settings/profile` in `frontend/app/(main)/settings/page.tsx` (depends on T007)
- [ ] T009 [US1] Create placeholder profile page (minimal content for navigation testing) in `frontend/app/(main)/settings/profile/page.tsx` (depends on T007)
- [ ] T010 [US1] Add Settings link to Navbar user menu dropdown to navigate to `/settings` in `frontend/components/layout/navbar.tsx` (depends on T007)

**Checkpoint**: Settings layout works — sidebar navigation, active state highlighting, mobile tabs, redirect from `/settings`. All four section URLs are navigable (profile has placeholder content, others show route content area).

---

## Phase 3: User Story 2 — Update Profile Information (Priority: P1)

**Goal**: Profile page with avatar upload (click/drag-drop + preview), name editing with validation, email (readonly), save with toast. Change password form with strength indicator and validation.

**Independent Test**: Navigate to `/settings/profile`, upload avatar (preview appears), change name, save (toast shown). Enter passwords, see strength indicator, submit (toast + fields cleared).

### Implementation for User Story 2

- [ ] T011 [P] [US2] Create ProfileInfoForm component with circular avatar upload (click + drag-drop, FileReader preview, file type/size validation), name Input (react-hook-form + profileSchema), email readonly field, Save Changes Button with loading/success/error states and toast in `frontend/components/settings/profile-info-form.tsx` (depends on T003, T005)
- [ ] T012 [P] [US2] Create ChangePasswordForm component with current password, new password (with PasswordStrength from `components/auth/password-strength.tsx`), confirm password, Update Password Button with loading/success/error states, clear fields on success, toast in `frontend/components/settings/change-password-form.tsx` (depends on T003, T005)
- [ ] T013 [US2] Update profile page with ProfileInfoForm and ChangePasswordForm wrapped in FadeInUp animations, load profile on mount via store in `frontend/app/(main)/settings/profile/page.tsx` (depends on T011, T012)

**Checkpoint**: Profile page fully functional — avatar upload preview, name editing with validation, password change with strength indicator, all toasts working.

---

## Phase 4: User Story 3 — View and Manage Credits (Priority: P1)

**Goal**: Billing page with credit balance display (gradient text, JetBrains Mono), plan badge, daily bonus info, Buy Credits modal with packages, transaction history with filters and load more.

**Independent Test**: Navigate to `/settings/billing`, see credit balance with gradient, click Buy Credits (modal with 3 packages + custom input), view transaction list, filter by type, click Load More.

### Implementation for User Story 3

- [x] T014 [P] [US3] Create CreditBalanceCard component with large gradient balance text (JetBrains Mono font), plan Badge, daily bonus info (streak from useDailyBonusStore), Buy Credits gradient Button in `frontend/components/settings/credit-balance-card.tsx` (depends on T005) → Artifacts: [credit-balance-card.tsx](frontend/components/settings/credit-balance-card.tsx)
- [x] T015 [P] [US3] Create TransactionRow component with amount display (green text for positive, red for negative), description, relative timestamp (reuse formatRelativeTime) in `frontend/components/settings/transaction-row.tsx` (depends on T001) → Artifacts: [transaction-row.tsx](frontend/components/settings/transaction-row.tsx)
- [x] T016 [P] [US3] Create BuyCreditsModal component using Dialog with 3 package cards (selectable, popular/best value badges), custom amount Input, payment method placeholder section, and confirm Button in `frontend/components/settings/buy-credits-modal.tsx` (depends on T001) → Artifacts: [buy-credits-modal.tsx](frontend/components/settings/buy-credits-modal.tsx)
- [x] T017 [US3] Create TransactionHistory component with filter tabs (All/Earned/Spent/Purchased), transaction list using TransactionRow, Load More button, empty state message in `frontend/components/settings/transaction-history.tsx` (depends on T015, T005) → Artifacts: [transaction-history.tsx](frontend/components/settings/transaction-history.tsx)
- [x] T018 [US3] Create billing page with CreditBalanceCard, BuyCreditsModal (state-controlled open), TransactionHistory, wrapped in FadeInUp, load transactions on mount in `frontend/app/(main)/settings/billing/page.tsx` (depends on T014, T016, T017) → Artifacts: [billing/page.tsx](frontend/app/(main)/settings/billing/page.tsx)

**Checkpoint**: Billing page fully functional — balance display with gradient, buy credits modal with packages, transaction history with working filters and load more.

---

## Phase 5: User Story 4 — View and Manage Subscription Plan (Priority: P2)

**Goal**: Plan page with current plan card (name, gradient badge, features, usage stats, renewal date) and plan comparison grid (all plans, current highlighted, upgrade/downgrade buttons, enterprise contact us).

**Independent Test**: Navigate to `/settings/plan`, see current plan card with usage stats, scroll to comparison grid, verify current plan is highlighted, click Upgrade (navigates to checkout placeholder).

### Implementation for User Story 4

- [x] T019 [P] [US4] Create PlanCard component with plan name, price (or "Contact us" for enterprise), features list, isPopular badge, isCurrent highlight border/badge, Upgrade/Downgrade/Current/Contact Us button variants in `frontend/components/settings/plan-card.tsx` (depends on T001) → Artifacts: [plan-card.tsx](frontend/components/settings/plan-card.tsx)
- [x] T020 [P] [US4] Create CurrentPlanCard component with plan name + gradient Badge, features list, usage stats (X/Y projects, Z credits), renewal date in `frontend/components/settings/current-plan-card.tsx` (depends on T005) → Artifacts: [current-plan-card.tsx](frontend/components/settings/current-plan-card.tsx)
- [x] T021 [US4] Create PlanComparison component with responsive grid of PlanCard components, current plan highlighted, proper button states per plan tier in `frontend/components/settings/plan-comparison.tsx` (depends on T019, T005) → Artifacts: [plan-comparison.tsx](frontend/components/settings/plan-comparison.tsx)
- [x] T022 [US4] Create plan page with CurrentPlanCard and PlanComparison wrapped in FadeInUp, load plan on mount via store in `frontend/app/(main)/settings/plan/page.tsx` (depends on T020, T021) → Artifacts: [plan/page.tsx](frontend/app/(main)/settings/plan/page.tsx)

**Checkpoint**: Plan page fully functional — current plan with usage stats, plan comparison grid with highlighting and action buttons.

---

## Phase 6: User Story 5 — Change Application Theme (Priority: P2)

**Goal**: Theme page with three radio cards (Light/Dark/System), each with preview and description. Selection applies immediately with smooth transition, persists via next-themes localStorage.

**Independent Test**: Navigate to `/settings/theme`, see 3 radio cards with previews, click Dark (theme changes with transition), reload page (theme persists), select System (follows OS preference).

### Implementation for User Story 5

- [ ] T023 [US5] Create ThemeSelector component with 3 radio Card options (Light/Dark/System), each showing icon, title, description, mini preview (small Card mockup showing theme colors), selected state, smooth CSS transition on theme change via useTheme() from next-themes, useMounted() for hydration safety in `frontend/components/settings/theme-selector.tsx` (depends on T001)
- [ ] T024 [US5] Create theme page with ThemeSelector wrapped in FadeInUp in `frontend/app/(main)/settings/theme/page.tsx` (depends on T023)

**Checkpoint**: Theme page fully functional — three options with previews, instant application, smooth transition, persistence across sessions.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify all pages work together, mobile adaptation, edge cases, type-check and build.

- [ ] T025 Verify mobile adaptation: horizontal tabs replace sidebar below md breakpoint, all pages render properly on mobile viewport, touch targets 44px minimum in all settings components
- [ ] T026 Add edge case handling: avatar file size >5MB error toast, non-image file rejection, empty transaction history empty state, long name truncation in `frontend/components/settings/` components
- [ ] T027 Run type-check (`npx tsc --noEmit`) and build (`npm run build`) in `frontend/`, fix any errors
- [ ] T028 Run quickstart.md validation checklist — verify all 12 items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on T001 (types) for SettingsSidebar
- **User Story 2 (Phase 3)**: Depends on T003 (validations), T005 (store)
- **User Story 3 (Phase 4)**: Depends on T001 (types), T005 (store)
- **User Story 4 (Phase 5)**: Depends on T001 (types), T005 (store)
- **User Story 5 (Phase 6)**: Depends on T001 (types) only (uses next-themes, no store)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Navigate)**: Foundation — blocks US2-US5 pages (they need layout to render)
- **US2 (Profile)**: Independent after US1 layout exists
- **US3 (Billing)**: Independent after US1 layout exists
- **US4 (Plan)**: Independent after US1 layout exists
- **US5 (Theme)**: Independent after US1 layout exists — lightest story, no store dependency

### Within Each User Story

- Components before pages
- Parallel components (marked [P]) can be built simultaneously
- Page assembly depends on all its components being ready

### Parallel Opportunities

**Phase 1 (Setup)**: T001, T002, T003 can run in parallel (different files, no dependencies)

**Phase 3 (US2)**: T011, T012 can run in parallel (different component files)

**Phase 4 (US3)**: T014, T015, T016 can run in parallel (different component files)

**Phase 5 (US4)**: T019, T020 can run in parallel (different component files)

**Cross-story parallelism**: After US1 is complete, US2-US5 can theoretically run in parallel (different page files, different component files). In practice, sequential P1→P2 order is recommended for single-developer flow.

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all foundation tasks in parallel (3 agents):
Task: "Add settings types to frontend/types/index.ts"             # T001
Task: "Create mock data in frontend/lib/data/settings.ts"          # T002
Task: "Create validation schemas in frontend/lib/validations/settings.ts" # T003

# Then sequential:
Task: "Create API layer in frontend/lib/api/settings.ts"           # T004 (needs T001, T002)
Task: "Create settings store in frontend/stores/settings.ts"       # T005 (needs T001, T004)
```

## Parallel Example: Phase 4 (US3 Billing)

```bash
# Launch 3 component tasks in parallel:
Task: "Create CreditBalanceCard in frontend/components/settings/credit-balance-card.tsx"  # T014
Task: "Create TransactionRow in frontend/components/settings/transaction-row.tsx"         # T015
Task: "Create BuyCreditsModal in frontend/components/settings/buy-credits-modal.tsx"      # T016

# Then sequential:
Task: "Create TransactionHistory in frontend/components/settings/transaction-history.tsx"  # T017 (needs T015)
Task: "Create billing page in frontend/app/(main)/settings/billing/page.tsx"              # T018 (needs T014, T016, T017)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: User Story 1 — Settings Navigation (T006-T010)
3. **STOP and VALIDATE**: Test navigation between settings sections
4. Basic settings page is functional — sidebar works, routes work

### Incremental Delivery

1. Setup + US1 → Navigation works (MVP)
2. Add US2 (Profile) → Users can manage profile and password
3. Add US3 (Billing) → Users can view credits and transaction history
4. Add US4 (Plan) → Users can view and compare plans
5. Add US5 (Theme) → Users can customize theme with previews
6. Polish → Mobile, edge cases, final validation

### Recommended Execution Order

Single-developer sequential flow:
1. T001, T002, T003 (parallel setup)
2. T004, T005 (sequential setup)
3. T006 → T007 → T008 → T009 → T010 (US1 layout)
4. T011, T012 (parallel US2 components) → T013 (US2 page)
5. T014, T015, T016 (parallel US3 components) → T017 → T018 (US3 page)
6. T019, T020 (parallel US4 components) → T021 → T022 (US4 page)
7. T023 → T024 (US5 theme)
8. T025 → T026 → T027 → T028 (polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No new npm packages required — all dependencies already installed
- All mock data uses Russian text where user-facing (descriptions, plan names, etc.)
- Theme page uses `next-themes` directly — no zustand store needed for theme state
- Password strength component reused from `components/auth/password-strength.tsx` — no duplication
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
