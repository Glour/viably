# Tasks: Dashboard

**Input**: Design documents from `/specs/010-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/dashboard-api.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app frontend**: `frontend/` at repository root
- Path alias: `@/` maps to `frontend/`

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

## Phase 1: Setup

**Purpose**: Create directories and shared infrastructure

- [ ] T001 Create `frontend/components/dashboard/` directory and `frontend/lib/utils/` directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, mock API, stores, and utility hooks that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Add dashboard types (UserProfile, ProjectSummary, ProjectStatus, DailyBonusState, TemplateShortcut, UserProfileResponse, RecentProjectsResponse, DashboardState, DailyBonusStoreState) to `frontend/types/index.ts` per data-model.md and contracts/dashboard-api.md
- [ ] T003 Create mock API functions (getUserProfile, getRecentProjects) with 800ms delay and discriminated union responses in `frontend/lib/api/dashboard.ts` following the pattern from `frontend/lib/api/auth.ts` per contracts/dashboard-api.md mock data
- [ ] T004 [P] Create dashboard zustand store (user, projects, isLoading, loadDashboard) in `frontend/stores/dashboard.ts` that calls mock API from T003, following pattern of `frontend/stores/sidebar.ts`
- [ ] T005 [P] Create daily bonus zustand store with localStorage persist middleware (claimedToday, lastClaimedDate, streak, todayReward, nextReward, claim, checkStreak) in `frontend/stores/daily-bonus.ts` per data-model.md streak reset logic and state transitions
- [ ] T006 [P] Create `useCountUp` hook in `frontend/hooks/use-count-up.ts` — accepts (end: number, duration?: number) returns animated number, uses requestAnimationFrame with easeOutCubic, respects reduced motion via `frontend/hooks/use-reduced-motion.ts`
- [ ] T007 [P] Create `formatRelativeTime` utility in `frontend/lib/utils/format-relative-time.ts` — accepts ISO 8601 string, returns Russian relative time string ("2 часа назад", "вчера", "3 дня назад") using Intl.RelativeTimeFormat with locale "ru"

**Checkpoint**: Foundation ready — types exported, mock API returns data, stores work, utilities tested manually

---

## Phase 3: User Story 1 — Welcome Card & Account Overview (Priority: P1) MVP

**Goal**: Авторизованный пользователь видит персональное приветствие с именем, три карточки статистики с count-up анимацией, кнопку "Создать проект" и ссылку "Пополнить кредиты"

**Independent Test**: Открыть `/dashboard` — welcome card отображается с mock именем, 3 stat cards анимируют числа от 0, кнопки ведут на `/projects/new` и `/credits`

### Implementation for User Story 1

- [ ] T008 [US1] Create WelcomeCard component in `frontend/components/dashboard/welcome-card.tsx`:
  - Import UserProfile from types, useCountUp from hooks, FadeInUp, Card, Badge, Button from design system
  - Props: user: UserProfile
  - Layout: gradient subtle bg (bg-[var(--primary-subtle)]) with glow orb in corner (absolute positioned div with bg-[var(--primary-glow)] blur-3xl rounded-full)
  - Greeting: "Привет, {name}!" in font-heading text-2xl with truncate for long names (max-w-[300px])
  - 3 mini stat cards in a row (flex gap-4):
    - Credits: useCountUp(user.credits) + plan Badge (variant based on plan)
    - Projects: useCountUp(user.projectsCount) + "из {projectsLimit}" label
    - Deployed: useCountUp(user.deployedCount) + "из {projectsCount}" label
  - Stat card styling: bg-card/50 backdrop-blur border rounded-xl p-4, font-code for numbers (text-2xl font-bold)
  - "Создать проект" gradient Button (Link to `/projects/new`)
  - "Пополнить кредиты →" ghost Button (Link to `/credits`)
  - Responsive: desktop flex-row for stats, mobile flex-col or horizontal scroll (overflow-x-auto snap-x)
  - Edge case: all zeros — show stats normally, zero is valid
  - Edge case: projects at limit — add "(лимит)" text next to count

- [ ] T009 [US1] Wire WelcomeCard into dashboard page `frontend/app/dashboard/page.tsx`:
  - Import MainLayout, FadeInUp, WelcomeCard, useDashboardStore
  - Call store.loadDashboard() in useEffect on mount
  - Show Shimmer skeleton (matching WelcomeCard dimensions) while isLoading
  - Show WelcomeCard with user data when loaded
  - Wrap in FadeInUp with delay={0}
  - Guard: redirect to `/login` if no user after load (mock always succeeds for MVP)

**Checkpoint**: Welcome card fully functional, stats animate, buttons navigate, responsive layout works

---

## Phase 4: User Story 2 — Recent Projects (Priority: P2)

**Goal**: Пользователь видит до 3 последних проектов со статусами и временем, или empty state с CTA

**Independent Test**: С mock проектами — видны 3 карточки со статусами и relative time. Без проектов (пустой массив в store) — empty state с кнопкой

### Implementation for User Story 2

- [ ] T010 [US2] Create RecentProjects component in `frontend/components/dashboard/recent-projects.tsx`:
  - Import ProjectSummary from types, formatRelativeTime, Card, Badge, Button from design system
  - Props: projects: ProjectSummary[]
  - Section header: "Мои проекты" (font-heading text-xl) + "Все проекты →" Link to `/projects` (text-sm text-muted-foreground hover:text-primary)
  - **With projects (grid 3 columns on desktop, 1 on mobile — grid grid-cols-1 md:grid-cols-3 gap-4)**:
    - Project card: Card component wrapping Link to `/projects/{id}`
    - Content: emoji + name (font-medium truncate), status Badge (variant from PROJECT_STATUS_MAP: deployed→success, ready→warning, draft→secondary, failed→destructive), formatRelativeTime(updatedAt) in text-sm text-muted-foreground
    - Hover effects: inherits from Card component (lift + gradient line)
  - **Empty state (when projects.length === 0)**:
    - Centered layout with large emoji illustration (📦 text-6xl)
    - "У тебя пока нет проектов" (font-heading text-lg)
    - "Создай первый бот за 60 секунд!" (text-muted-foreground)
    - Gradient Button "Создать проект →" Link to `/projects/new`

- [ ] T011 [US2] Add RecentProjects to dashboard page `frontend/app/dashboard/page.tsx`:
  - Import RecentProjects component
  - Pass store.projects to RecentProjects
  - Wrap in FadeInUp with delay={0.2}
  - Show skeleton (3 Shimmer cards in grid) while isLoading

**Checkpoint**: Project cards display with statuses, time ago works in Russian, empty state shows correctly

---

## Phase 5: User Story 3 — Quick Actions (Priority: P3)

**Goal**: 2 карточки шаблонов (Shop Bot, FAQ Bot) с бейджами и hover-эффектами, клик ведёт к созданию проекта

**Independent Test**: Видны 2 карточки с бейджами, hover показывает lift + gradient line, клик переходит на `/projects/new?template={slug}`

### Implementation for User Story 3

- [ ] T012 [US3] Create QuickActions component in `frontend/components/dashboard/quick-actions.tsx`:
  - Import TemplateShortcut from types, Card, Badge from design system
  - Define QUICK_ACTIONS constant array of TemplateShortcut: [{slug: "shop-bot", name: "Shop Bot", emoji: "🛒", badge: "Самый популярный", href: "/projects/new?template=shop-bot"}, {slug: "faq-bot", name: "FAQ Bot", emoji: "❓", badge: "Быстрый старт", href: "/projects/new?template=faq-bot"}]
  - Section header: "Быстрые действия" (font-heading text-xl)
  - 2 cards in row (grid grid-cols-1 sm:grid-cols-2 gap-4):
    - Each card: Card wrapping Link to action.href
    - Badge overlay: absolute top-3 right-3, Badge variant="default" with action.badge text
    - Content: emoji (text-3xl), name (font-heading text-lg), "Создать →" in text-sm text-primary
    - Hover: inherits Card lift + gradient line

- [ ] T013 [US3] Add QuickActions to dashboard page `frontend/app/dashboard/page.tsx`:
  - Import QuickActions component
  - Place between WelcomeCard and RecentProjects sections
  - Wrap in FadeInUp with delay={0.1}
  - No loading state needed (static data)

**Checkpoint**: Both template cards visible, badges render, hover effects work, click navigates correctly

---

## Phase 6: User Story 4 — Daily Bonus (Priority: P4)

**Goal**: Карточка daily bonus с двумя состояниями (получен/не получен), streak counter, прогресс-бар, анимация при получении

**Independent Test**: При первом визите — кнопка "Получить", клик зачисляет, glow-pulse анимация, карточка переходит в режим "Получено". Обновить страницу — state сохранён в localStorage

### Implementation for User Story 4

- [ ] T014 [US4] Create DailyBonus component in `frontend/components/dashboard/daily-bonus.tsx`:
  - Import DailyBonusStoreState from types, useDailyBonusStore, Card, Button, Badge from design system
  - Call store.checkStreak() in useEffect on mount (validates streak on page load)
  - **Not claimed state**:
    - Card with subtle bg (bg-card border)
    - "🎁 Получи +{todayReward} кредитов" (font-heading text-lg)
    - "Серия: {streak} дней подряд · Завтра: +{nextReward} кредитов" (text-sm text-muted-foreground)
    - Progress bar: div with bg-muted rounded-full h-2, inner div with bg-[image:var(--gradient-main)] rounded-full h-2 width={(streak % 7) / 7 * 100}%, transition-all duration-500
    - "{streak % 7}/7 дней до бонуса x2" label (text-xs text-muted-foreground)
    - Gradient Button "Получить бонус" — onClick calls store.claim()
    - On claim: add animate-[glow-pulse_0.6s_ease-in-out] class to card for 600ms, then remove
  - **Claimed state**:
    - Same card layout but info mode
    - "🎁 +{todayReward} кредитов получено сегодня!" with Badge variant="success" showing checkmark
    - Streak and progress info same as above
    - No button (replaced by green check icon from lucide-react)
  - **Streak milestone display**: when streak >= 7, show Badge "x2" variant="default" next to reward
  - Responsive: full width, internal padding p-6

- [ ] T015 [US4] Add DailyBonus to dashboard page `frontend/app/dashboard/page.tsx`:
  - Import DailyBonus component
  - Place as last section after RecentProjects
  - Wrap in FadeInUp with delay={0.3}
  - No loading state needed (state from localStorage, available immediately)

**Checkpoint**: Claim flow works, animation plays, state persists after refresh, streak logic correct

---

## Phase 7: User Story 5 — Animations & Visual Polish (Priority: P5)

**Goal**: Staggered fadeInUp при загрузке, count-up анимации в welcome card, reduced motion support

**Independent Test**: Загрузить dashboard — секции появляются последовательно. Включить reduced motion в OS — анимации отключаются

### Implementation for User Story 5

- [ ] T016 [US5] Verify and adjust staggered animation delays in `frontend/app/dashboard/page.tsx`:
  - Review all FadeInUp wrappers have correct incremental delays: WelcomeCard(0), QuickActions(0.1), RecentProjects(0.2), DailyBonus(0.3)
  - Verify skeleton→content transitions are smooth (no layout shift)
  - Ensure all FadeInUp components properly respect reduced motion via existing use-reduced-motion hook
  - Add section spacing: space-y-8 between all dashboard sections

**Checkpoint**: All animations smooth at 60fps, sequential appearance, reduced motion fully supported

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all user stories

- [ ] T017 [P] Responsive testing and fixes in `frontend/components/dashboard/*.tsx` — verify all components at 320px, 768px, 1024px, 1280px, 2560px viewports
- [ ] T018 [P] Skeleton loading states — verify Shimmer components match real content dimensions for WelcomeCard and RecentProjects in `frontend/app/dashboard/page.tsx`
- [ ] T019 Accessibility audit in `frontend/components/dashboard/*.tsx` — verify semantic HTML (section, h2 headings, nav landmarks), keyboard navigation (all links/buttons focusable), ARIA labels on stat cards (aria-label="Баланс кредитов: {n}"), focus-visible styles
- [ ] T020 Dark mode verification — test all dashboard components in dark theme, verify contrast ratios, glow orb opacity difference (0.08 light vs 0.15 dark for welcome card)
- [ ] T021 Run quality gates: `cd frontend && npm run type-check && npm run build && npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: T002-T003 sequential (types → mock API), T004-T007 parallel after T002-T003
- **Phases 3-6 (User Stories)**: All depend on Phase 2 completion
  - US1 depends on: T004 (dashboard store), T006 (useCountUp)
  - US2 depends on: T004 (dashboard store), T007 (formatRelativeTime)
  - US3 depends on: T002 (types only — static data)
  - US4 depends on: T005 (daily bonus store)
- **Phase 7 (Animations)**: Depends on all US components being assembled (T009, T011, T013, T015)
- **Phase 8 (Polish)**: Depends on Phase 7

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only — no other story dependencies
- **US2 (P2)**: Depends on Phase 2 only — no other story dependencies
- **US3 (P3)**: Depends on T002 (types) only — can start earliest
- **US4 (P4)**: Depends on T005 (daily bonus store) — no other story dependencies
- **US5 (P5)**: Depends on all US1-US4 components being in the page

### Within Each User Story

- Component implementation → page integration → checkpoint validation

### Parallel Opportunities

- **Phase 2**: T004, T005, T006, T007 all in parallel (different files, no dependencies)
- **Phase 3-6**: US1, US2, US3, US4 can be implemented in parallel (different components, different stores)
- **Phase 8**: T017, T018 in parallel (different concerns)

---

## Parallel Example: Phase 2 Foundational

```bash
# After T002 (types) and T003 (mock API) complete sequentially:

# Launch all 4 in parallel:
Task: "Create dashboard store in frontend/stores/dashboard.ts"
Task: "Create daily bonus store in frontend/stores/daily-bonus.ts"
Task: "Create useCountUp hook in frontend/hooks/use-count-up.ts"
Task: "Create formatRelativeTime in frontend/lib/utils/format-relative-time.ts"
```

## Parallel Example: User Stories (after Phase 2)

```bash
# Launch US1-US4 components in parallel (different files, independent stores):
Task: "Create WelcomeCard in frontend/components/dashboard/welcome-card.tsx"
Task: "Create RecentProjects in frontend/components/dashboard/recent-projects.tsx"
Task: "Create QuickActions in frontend/components/dashboard/quick-actions.tsx"
Task: "Create DailyBonus in frontend/components/dashboard/daily-bonus.tsx"

# Then assemble sequentially into page (same file):
Task: "Wire WelcomeCard into dashboard page"
Task: "Add QuickActions to dashboard page"
Task: "Add RecentProjects to dashboard page"
Task: "Add DailyBonus to dashboard page"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational — T002, T003 sequential, then T004+T006 parallel
3. Complete Phase 3: US1 (T008, T009)
4. **STOP and VALIDATE**: Dashboard shows welcome card with animated stats and working navigation
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Welcome Card) → Test independently → MVP!
3. Add US3 (Quick Actions) → Test independently → Enhanced onboarding
4. Add US2 (Recent Projects) → Test independently → Returning user value
5. Add US4 (Daily Bonus) → Test independently → Retention mechanic
6. US5 (Animations) → Visual polish pass
7. Phase 8 → Quality assurance

**Note**: US3 before US2 in delivery because it has fewer dependencies (static data only) and can be completed faster.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All mock data follows existing pattern from `frontend/lib/api/auth.ts`
- Zustand stores follow existing pattern from `frontend/stores/sidebar.ts`
- Types centralized in `frontend/types/index.ts` (Single Source of Truth)
- Design system components (Card, Badge, Button, Shimmer, FadeInUp) fully reused
- No new npm dependencies required — all custom code <20 lines
- CSS variables and keyframes from `frontend/app/globals.css` reused (--primary-subtle, --gradient-main, glow-pulse)
