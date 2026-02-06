# Tasks: Templates Gallery

**Input**: Design documents from `/specs/011-templates-gallery/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/templates-api.md, quickstart.md

**Tests**: Not requested — test tasks excluded.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

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

## Phase 1: Setup (Types & Data Layer)

**Purpose**: Define types, mock data, and API layer — shared foundation for all user stories.

- [x] T001 Add Template, ConfigField, FilterTab, TemplatesStoreState, and response types to `frontend/types/index.ts`
  - Types from contracts/templates-api.md: TemplateCategory, ConfigFieldType, ConfigField, Template, FilterTab, TemplatesResponse, TemplateResponse, CreateProjectResponse, TemplatesStoreState
  - Follow existing pattern: union response types (`{ success: true; ... } | { success: false; error: string }`)
  - FR-016

- [x] T002 Create mock template data with 6 templates in `frontend/lib/data/templates.ts`
  - 6 templates per data-model.md: faq-bot (3cr), shop-bot (5cr, isPopular), notification-bot (3cr), poll-bot (4cr), support-bot (6cr), booking-bot (8cr)
  - Each template: slug, name, emoji, description (2-3 предложения на русском), category: "telegram_bot", creditCost, features, tags, configFields (2-4 fields each), isPopular
  - configFields: relevant to each template (e.g., shop-bot: storeName text, productList textarea, paymentSystem select, deliveryMethods multiselect)
  - Export as `const TEMPLATES: Template[]`
  - FR-016

- [x] T003 Create mock API functions in `frontend/lib/api/templates.ts`
  - `getTemplates()`: 800ms delay, returns TemplatesResponse with all TEMPLATES
  - `getTemplateBySlug(slug)`: 500ms delay, returns TemplateResponse, error if not found
  - `createProjectFromTemplate(templateSlug)`: 1200ms delay, returns CreateProjectResponse with mock projectId and redirectUrl
  - Follow pattern from `lib/api/dashboard.ts` (async + setTimeout)
  - FR-001, FR-013

---

## Phase 2: Foundational (Store & Hooks)

**Purpose**: State management and utility hooks — MUST complete before UI components.

**CRITICAL**: No UI component work can begin until this phase is complete.

- [x] T004 [P] Create `useDebounce` hook in `frontend/hooks/use-debounce.ts`
  - Generic `useDebounce<T>(value: T, delay: number): T`
  - ~7 lines, useState + useEffect with setTimeout/clearTimeout
  - Follow project hook pattern (named export, typed)
  - FR-003

- [x] T005 [P] Create Zustand templates store in `frontend/stores/templates.ts`
  - State: templates, searchQuery (""), activeTab ("all"), isLoading
  - Actions: loadTemplates() (calls getTemplates API), setSearchQuery, setActiveTab, resetFilters
  - Derived: getFilteredTemplates() — applies tab filter AND case-insensitive search on name+description, getTemplateBySlug(slug)
  - Filter logic from data-model.md: all=no filter, telegram=category match, popular=isPopular, cheap=creditCost<5
  - Follow pattern from `stores/dashboard.ts` (create, typed, async actions)
  - FR-003, FR-004

**Checkpoint**: Data layer complete — type-check should pass. Run `cd frontend && npm run type-check`.

---

## Phase 3: User Story 1 — Просмотр каталога шаблонов (Priority: P1) MVP

**Goal**: Пользователь видит все 6 шаблонов в адаптивной сетке карточек с hover-анимациями.

**Independent Test**: Открыть `/templates` — должны отображаться 6 карточек с полной информацией, адаптивная сетка, hover-эффекты.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create TemplateCard component in `frontend/components/templates/template-card.tsx`
  - Props: `template: Template`
  - Elements: emoji icon (48px), name (Space Grotesk/font-heading, 20px, font-semibold), gradient line separator (h-px, bg-gradient, opacity-0→1 on hover), description (14px, text-muted-foreground, line-clamp-3), feature list (checkmarks + feature name, max 4), credits badge ("💎 {cost} credits", pill), CTA button ("Использовать →", full width)
  - Hover: translateY(-4px), shadow increase, gradient line opacity 0→1, border transition to primary-subtle, transition-all duration-400
  - Wrap in `next/link` to `/templates/{slug}`
  - Use `group` class for group-hover effects
  - Reuse: Card (shadcn), Badge, Button components
  - FR-002, FR-005, FR-006, FR-007

- [x] T007 [P] [US1] Create EmptyState component in `frontend/components/templates/empty-state.tsx`
  - Props: `onReset?: () => void`
  - Large emoji (📭), message "Шаблоны не найдены", subtitle "Попробуйте изменить параметры поиска", reset button "Сбросить фильтры" (if onReset provided)
  - Centered layout, follow dashboard empty state pattern from RecentProjects
  - FR-014

- [x] T008 [US1] Assemble gallery page in `frontend/app/templates/page.tsx` (MODIFY existing stub)
  - "use client", MainLayout wrapper, FadeInUp animations (staggered: 0, 0.1, 0.2)
  - Heading: "Шаблоны ботов" (H1, font-heading), subtitle: "Выбери шаблон и создай бота за минуту"
  - Load templates via useTemplatesStore.loadTemplates() in useEffect
  - Display loading state with Shimmer components
  - Responsive grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
  - Map filtered templates → TemplateCard, show EmptyState if empty
  - FR-001, FR-005

**Checkpoint**: User Story 1 complete — 6 карточек отображаются, hover работает, адаптивная сетка. Run `cd frontend && npm run type-check && npm run build`.

→ Artifacts: [types/index.ts](frontend/types/index.ts), [templates data](frontend/lib/data/templates.ts), [templates API](frontend/lib/api/templates.ts), [useDebounce](frontend/hooks/use-debounce.ts), [store](frontend/stores/templates.ts), [TemplateCard](frontend/components/templates/template-card.tsx), [EmptyState](frontend/components/templates/empty-state.tsx), [page](frontend/app/templates/page.tsx)

---

## Phase 4: User Story 2 — Поиск и фильтрация шаблонов (Priority: P2)

**Goal**: Пользователь может искать шаблоны через поисковую строку и фильтровать по вкладкам.

**Independent Test**: Ввести текст в поиск — карточки фильтруются. Переключить вкладки — отображаются только соответствующие шаблоны.

### Implementation for User Story 2

- [x] T009 [P] [US2] Create SearchBar component in `frontend/components/templates/search-bar.tsx`
  - Full width Input with Search icon (Lucide) on left
  - Placeholder: "Поиск шаблонов..."
  - Controlled input → useDebounce(300ms) → store.setSearchQuery
  - ARIA label for accessibility
  - Reuse: Input (shadcn), Search icon (Lucide)
  - FR-003

- [x] T010 [P] [US2] Create FilterTabs component in `frontend/components/templates/filter-tabs.tsx`
  - Tabs: [{id: "all", label: "Все"}, {id: "telegram", label: "Telegram"}, {id: "popular", label: "Популярные"}, {id: "cheap", label: "Дешёвые < 5 cr."}]
  - Active tab: gradient bg (bg-[image:var(--gradient-main)]) + white text
  - Inactive: surface bg + text-muted-foreground
  - Pill style: rounded-full, px-4 py-2, smooth transition
  - onClick → store.setActiveTab
  - Keyboard accessible (button elements, focus ring)
  - FR-004

- [x] T011 [US2] Integrate SearchBar and FilterTabs into gallery page `frontend/app/templates/page.tsx`
  - Add SearchBar between subtitle and grid (FadeInUp delay=0.1)
  - Add FilterTabs between SearchBar and grid (FadeInUp delay=0.15)
  - Grid section at delay=0.2
  - Use store.getFilteredTemplates() for grid rendering
  - EmptyState shows when filteredTemplates.length === 0 with onReset → store.resetFilters
  - FR-003, FR-004, FR-014

**Checkpoint**: User Story 2 complete — поиск и фильтры работают совместно. Run `cd frontend && npm run type-check && npm run build`.

→ Artifacts: [SearchBar](frontend/components/templates/search-bar.tsx), [FilterTabs](frontend/components/templates/filter-tabs.tsx), [page](frontend/app/templates/page.tsx)

---

## Phase 5: User Story 3 — Просмотр детальной информации о шаблоне (Priority: P2)

**Goal**: Пользователь видит полную информацию о шаблоне на детальной странице с навигацией назад.

**Independent Test**: Перейти на `/templates/shop-bot` — отображается полная информация, кнопка "Назад к шаблонам" работает, адаптивный макет.

### Implementation for User Story 3

- [x] T012 [P] [US3] Create TemplateDetail component in `frontend/components/templates/template-detail.tsx`
  - Props: `template: Template`, `userCredits: number`, `onCreateProject: () => void`, `isCreating: boolean`
  - Two-column layout: left 40% (emoji 64px, name, gradient separator, description, credits badge "💎 {cost} credits", CTA button) / right 60% (features list "Что умеет этот бот:" with ✓ checkmarks, config fields list "Что нужно настроить:" with bullet points showing label)
  - CTA "Создать проект →": gradient button, shows credit cost
  - Responsive: stack vertically on mobile (flex-col on <lg, flex-row on lg:)
  - Reuse: Button, Badge from shadcn
  - FR-008, FR-009

- [x] T013 [US3] Create template detail page in `frontend/app/templates/[slug]/page.tsx`
  - "use client", MainLayout wrapper
  - Back navigation: "← Назад к шаблонам" (Link to /templates, with ArrowLeft icon)
  - Load template by slug from store (useTemplatesStore.getTemplateBySlug) or via API (getTemplateBySlug)
  - Load user credits from useDashboardStore (user.credits)
  - 404 state: if template not found → show "Шаблон не найден" with emoji (🔍), link back to gallery
  - Loading state with Shimmer
  - Render TemplateDetail component
  - FadeInUp animation
  - FR-008, FR-010, FR-015

**Checkpoint**: User Story 3 complete — детальная страница работает, навигация назад, 404 для несуществующих slug. Run `cd frontend && npm run type-check && npm run build`.

→ Artifacts: [TemplateDetail](frontend/components/templates/template-detail.tsx), [detail page](frontend/app/templates/[slug]/page.tsx)

---

## Phase 6: User Story 4 — Создание проекта из шаблона (Priority: P3)

**Goal**: Пользователь может инициировать создание проекта из шаблона с проверкой кредитов.

**Independent Test**: На детальной странице: при достаточных кредитах кнопка активна и создаёт проект (mock redirect). При недостаточных — кнопка disabled с подсказкой.

### Implementation for User Story 4

- [x] T014 [US4] Add create project logic to TemplateDetail component in `frontend/components/templates/template-detail.tsx`
  - Credit check: if `userCredits < template.creditCost` → button disabled
  - Disabled state: tooltip/title "Недостаточно кредитов", show "Пополнить →" link to `/settings`
  - Active state: onClick → call `createProjectFromTemplate(template.slug)`, show loading spinner on button, disable double-click
  - On success: redirect to response.redirectUrl via `router.push()`
  - On error: show toast via sonner
  - FR-011, FR-012, FR-013

**Checkpoint**: User Story 4 complete — создание проекта (mock) работает, проверка кредитов. Run `cd frontend && npm run type-check && npm run build`.

→ Artifacts: [TemplateDetail](frontend/components/templates/template-detail.tsx)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, animation polish, quality gates.

- [x] T015 [P] Accessibility pass on all templates components: ARIA labels, keyboard navigation, focus management, screen reader compatibility in `frontend/components/templates/*.tsx`
  - SearchBar: aria-label, role="search"
  - FilterTabs: role="tablist", aria-selected, keyboard arrow navigation
  - TemplateCard: focus-visible ring, semantic HTML (article/section)
  - TemplateDetail: heading hierarchy, landmark regions

- [x] T016 [P] Verify hover animations and gradient line reveal on TemplateCard, responsive grid breakpoints (320px-2560px), loading states with Shimmer in `frontend/components/templates/template-card.tsx` and `frontend/app/templates/page.tsx`
  - Verify: translateY(-4px), shadow-lg, gradient line opacity transition, border transition
  - Verify: 3 cols on lg, 2 cols on sm, 1 col on mobile
  - Verify: FadeInUp staggered delays work correctly
  - Verify: prefers-reduced-motion disables animations

- [x] T017 Run full quality gates: `cd frontend && npm run type-check && npm run build && npm run lint`
  - Fix any type errors, build errors, or lint warnings
  - Ensure no `any` types, no unused imports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. T001 → T002 → T003 (sequential: T002 depends on types from T001, T003 depends on types from T001 and data from T002)
- **Phase 2 (Foundational)**: Depends on Phase 1. T004 and T005 can run in parallel (different files)
- **Phase 3 (US1)**: Depends on Phase 2. T006 and T007 can run in parallel. T008 depends on T006 and T007
- **Phase 4 (US2)**: Depends on Phase 3 (gallery page exists). T009 and T010 can run in parallel. T011 depends on T009 and T010
- **Phase 5 (US3)**: Depends on Phase 2 (store). Can run in parallel with Phase 4. T012 before T013
- **Phase 6 (US4)**: Depends on Phase 5 (TemplateDetail exists). T014 modifies existing component
- **Phase 7 (Polish)**: Depends on all user stories. T015 and T016 can run in parallel. T017 final

### User Story Dependencies

- **US1 (P1)**: Foundation only — can start after Phase 2
- **US2 (P2)**: Depends on US1 (gallery page must exist to add search/filters)
- **US3 (P2)**: Foundation only — can start after Phase 2, parallel with US2
- **US4 (P3)**: Depends on US3 (TemplateDetail component must exist)

### Parallel Opportunities

```
Phase 2: T004 ║ T005 (useDebounce and store — different files)
Phase 3: T006 ║ T007 (TemplateCard and EmptyState — different files)
Phase 4: T009 ║ T010 (SearchBar and FilterTabs — different files)
Phase 5+4: T012 ║ T009+T010 (US3 TemplateDetail parallel with US2 SearchBar+FilterTabs)
Phase 7: T015 ║ T016 (a11y and animation polish — different concerns)
```

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch TemplateCard and EmptyState in parallel (different files):
Task: "Create TemplateCard component in frontend/components/templates/template-card.tsx"
Task: "Create EmptyState component in frontend/components/templates/empty-state.tsx"

# Then sequential: assemble gallery page (depends on both components):
Task: "Assemble gallery page in frontend/app/templates/page.tsx"
```

## Parallel Example: Phase 4+5 (User Stories 2 & 3 in parallel)

```bash
# US2: SearchBar and FilterTabs in parallel:
Task: "Create SearchBar in frontend/components/templates/search-bar.tsx"
Task: "Create FilterTabs in frontend/components/templates/filter-tabs.tsx"

# US3: TemplateDetail can run in parallel with US2:
Task: "Create TemplateDetail in frontend/components/templates/template-detail.tsx"

# Then sequential integration:
Task: "Integrate SearchBar+FilterTabs into gallery page" (US2)
Task: "Create detail page in frontend/app/templates/[slug]/page.tsx" (US3)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Types + Mock Data + Mock API
2. Complete Phase 2: Store + useDebounce
3. Complete Phase 3: TemplateCard + EmptyState + Gallery Page
4. **STOP and VALIDATE**: 6 карточек отображаются с hover-эффектами, адаптивная сетка
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1+2 → Data layer ready
2. Phase 3 (US1) → Gallery with cards → **MVP demo**
3. Phase 4 (US2) → Search + filters → Enhanced UX
4. Phase 5 (US3) → Detail page → Full navigation flow
5. Phase 6 (US4) → Create project → Complete feature
6. Phase 7 → Polish, a11y, quality gates → Production ready

---

## Notes

- **0 new dependencies** — all on existing stack
- All mock data in Russian (descriptions, features, config fields)
- Mock API delays: getTemplates 800ms, getTemplateBySlug 500ms, createProject 1200ms
- Gradient CSS variable: `var(--gradient-main)` from globals.css
- Font: `font-heading` for titles (Space Grotesk), default for body
- Credits check uses existing `useDashboardStore` → `user.credits`
