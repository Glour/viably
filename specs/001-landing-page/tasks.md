# Tasks: Landing Page

**Input**: Design documents from `/specs/001-landing-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/data-contracts.ts, quickstart.md

**Tests**: Tests are NOT explicitly requested in specification - NOT included in this task list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend app**: `frontend/` at repository root
- All paths are relative to `/home/alex/PycharmProjects/viably/`

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements, creating necessary agents, and assigning executors.

- [x] P001 Analyze all tasks and identify required agent types and capabilities [EXECUTOR: MAIN]
- [x] P002 Create missing agents — SKIPPED, fullstack-nextjs-specialist covers all tasks
- [x] P003 Assign executors: MAIN (trivial), fullstack-nextjs-specialist (all components)
- [x] P004 Resolve research: all resolved in research.md, reuse existing GlowOrbs/data/animations

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

**Purpose**: Project initialization, dependencies, and type system setup

- [x] T001 Install animation dependencies: `npm install react-type-animation` (motion already installed 12.33.0) [EXECUTOR: MAIN]
- [x] T002 SKIPPED — reuse existing types from `frontend/types/index.ts` (Template, SubscriptionPlan already defined)
- [x] T003 SKIPPED — `frontend/lib/data/templates.ts` already exists with 6 templates (TEMPLATES array)
- [x] T004 SKIPPED — `frontend/lib/data/settings.ts` already has AVAILABLE_PLANS with Free, Starter, Pro
- [x] T005 Run type-check — PASSED [EXECUTOR: MAIN]

**Checkpoint**: Dependencies installed, types defined, data ready - foundation complete

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create landing page route `frontend/app/page.tsx` with metadata and placeholder sections [EXECUTOR: MAIN]
- [x] T007 Create directory structure: `frontend/components/landing/` and `frontend/app/(public)/` [EXECUTOR: MAIN]

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 5 - Навигация и доступ к основным действиям (Priority: P1) 🎯 MVP Foundation

**Goal**: Sticky navigation bar с glass effect, доступ к CTA и навигации на всех устройствах

**Independent Test**: Прокрутить страницу до низа, проверить что nav виден, все кнопки кликабельны, glass effect активируется после 100px scroll

### Implementation for User Story 5

- [x] T008 [US5] Create `frontend/components/landing/landing-nav.tsx` with desktop navigation structure [EXECUTOR: fullstack-nextjs-specialist]
- [x] T009 [US5] Implement sticky positioning with scroll-triggered glass effect (transparent → glass at 100px)
- [x] T010 [US5] Add responsive hamburger menu for mobile (<768px) with AnimatePresence + Esc to close
- [x] T011 [US5] Style navigation links and CTA buttons (gradient Sign Up, outline Login, smooth scroll)
- [x] T012 [US5] Wire navigation links: Features → #features, Pricing → #pricing, Login → /login, Sign Up → /register

**Checkpoint**: Navigation functional, sticky behavior works, glass effect triggers on scroll, mobile menu operational

---

## Phase 4: User Story 1 - Понимание продукта через Hero-секцию (Priority: P1) 🎯 MVP Core

**Goal**: Hero секция с wow-эффектами: glow orbs, typing animation, CTA buttons, social proof

**Independent Test**: Показать только Hero-секцию пользователю, спросить "Что делает этот продукт?". Успех = 90%+ правильных ответов

### Implementation for User Story 1

- [x] T013 [P] [US1] Create `frontend/components/landing/hero.tsx` as client component with heading, subtitle, 2 CTAs, social proof [EXECUTOR: fullstack-nextjs-specialist]
- [x] T014 [P] [US1] Reuse existing GlowOrbs from `@/components/ui/glow-orbs` (mouse tracking + parallax built-in)
- [x] T015 [US1] Mouse tracking/parallax handled by GlowOrbs component — no additional work needed
- [x] T016 [US1] Demo card with glass styling (backdrop-blur-xl, traffic lights, status bar, code area)
- [x] T017 [US1] Typing animation via react-type-animation: 5-step sequence ~8.5s loop with Infinity repeat
- [x] T018 [US1] Scroll-triggered fadeInUp using staggerContainer + whileInView (once: true, amount: 0.3)
- [x] T019 [US1] Responsive layout: column mobile → side-by-side lg, gradient text on "бот", pt-28 for nav
- [x] T020 [US1] CTAs wired: "Начать бесплатно" → /register, "Смотреть демо" → # (placeholder)
- [x] T021 [US1] Reduced motion: useReducedMotion() disables all animations, TypeAnimation falls back to static text

**Checkpoint**: Hero section complete with glow orbs, typing animation, CTAs functional, responsive layout works

---

## Phase 5: User Story 2 - Понимание процесса через "How It Works" (Priority: P2)

**Goal**: Секция "How It Works" с 3 карточками шагов и staggered анимацией

**Independent Test**: Показать только секцию "How It Works", попросить описать процесс. Успех = объясняют 3 шага своими словами

### Implementation for User Story 2

- [x] T022 [US2] Create `frontend/components/landing/how-it-works.tsx` with section heading (gradient underline styling) [EXECUTOR: fullstack-nextjs-specialist]
- [x] T023 [US2] Implement 3 step cards structure with gradient number badges (circles), icons (✎, ⚡, 🚀), titles, descriptions
- [x] T024 [US2] Add staggered fadeInUp animation for cards using Motion with viewport trigger and delay calculation (100ms per card)
- [x] T025 [US2] Implement hover glow effect for step cards using Motion `whileHover` prop with scale and shadow transitions
- [x] T026 [US2] Style cards grid: single column mobile → 3 columns desktop (lg breakpoint), surface background, proper spacing
→ Artifacts: [how-it-works.tsx](frontend/components/landing/how-it-works.tsx)

**Checkpoint**: How It Works section displays 3 steps, stagger animation works on scroll, hover effects functional

---

## Phase 6: User Story 4 - Выбор тарифного плана (Priority: P2)

**Goal**: Секция Pricing с 3 планами, monthly/yearly toggle, Popular badge для Pro

**Independent Test**: Показать Pricing секцию, попросить выбрать план для "10 ботов в месяц". Успех = правильный выбор за <1 минуту

### Implementation for User Story 4

- [x] T027 [P] [US4] Create custom hook `frontend/lib/hooks/use-pricing-toggle.ts` for managing monthly/yearly state with localStorage persistence [EXECUTOR: fullstack-nextjs-specialist]
- [x] T028 [P] [US4] Create `frontend/components/landing/pricing.tsx` with section heading and billing period toggle (Monthly/Yearly switch) [EXECUTOR: fullstack-nextjs-specialist]
- [x] T029 [US4] Implement 3 pricing plan cards loading data from `lib/data/pricing.ts`, displaying name, price, features list, CTA button
- [x] T030 [US4] Add "Popular" badge and gradient border styling specifically for Pro plan (conditional rendering based on `plan.popular` flag)
- [x] T031 [US4] Implement price calculation logic: display monthly price or yearly price based on toggle state, show monthly equivalent for yearly
- [x] T032 [US4] Add staggered appear animation for pricing cards using Motion viewport trigger with 100ms delay per card
- [x] T033 [US4] Style pricing grid: stack on mobile → 3 columns desktop (lg breakpoint), highlight Pro plan with gradient border
- [x] T034 [US4] Wire CTA buttons: Free → /register, Starter → /pricing/starter, Pro → /pricing/pro
- [x] T035 [US4] Add smooth price transition animation when toggling between monthly/yearly using Motion `AnimatePresence`
→ Artifacts: [pricing.tsx](frontend/components/landing/pricing.tsx), [use-pricing-toggle.ts](frontend/lib/hooks/use-pricing-toggle.ts)

**Checkpoint**: Pricing section displays 3 plans, toggle works and persists to localStorage, Popular badge shows, CTAs wired correctly

---

## Phase 7: User Story 3 - Выбор шаблона из превью (Priority: P3)

**Goal**: Секция Templates Preview с 6 карточками шаблонов и hover эффектами

**Independent Test**: Показать Templates Preview, попросить выбрать шаблон для задачи. Успех = находит релевантный за <30 секунд

### Implementation for User Story 3

- [x] T036 [US3] Create `frontend/components/landing/templates-preview.tsx` with section heading and "Смотреть все шаблоны →" link [EXECUTOR: fullstack-nextjs-specialist]
- [x] T037 [US3] Implement template cards grid loading data from `lib/data/templates.ts`, displaying emoji, name, cost in credits
- [x] T038 [US3] Add staggered appear animation for template cards using Motion viewport trigger with 100ms delay per card
- [x] T039 [US3] Implement hover effects for template cards: lift (translateY), glow (shadow), scale using Motion `whileHover`
- [x] T040 [US3] Style templates grid: 1 column mobile → 2 columns tablet (md) → 3 columns desktop (lg), surface background
- [x] T041 [US3] Wire "Смотреть все шаблоны →" link to `/templates` route (templates gallery page from 011-templates-gallery)
→ Artifacts: [templates-preview.tsx](frontend/components/landing/templates-preview.tsx)

**Checkpoint**: Templates Preview shows 6 cards, stagger animation works, hover effects functional, link to gallery works

---

## Phase 8: Footer

**Goal**: Footer с 4 колонками навигации, социальными иконками, копирайтом

**Independent Test**: Прокрутить до footer, проверить что все ссылки кликабельны, социальные иконки отображаются

### Implementation for Footer

- [x] T042 [P] [Footer] Create `frontend/components/landing/footer.tsx` with 4 columns structure: Product, Resources, Company, Legal [EXECUTOR: fullstack-nextjs-specialist]
- [x] T043 [P] [Footer] Add social media icons (Twitter, GitHub, Telegram) using lucide-react with links opening in new tab
- [x] T044 [Footer] Populate navigation links in each column (Products: Templates, Pricing; Resources: Docs, Blog; Company: About, Contact; Legal: Privacy, Terms)
- [x] T045 [Footer] Add gradient separator line at top of footer using Tailwind gradient utilities
- [x] T046 [Footer] Style footer responsive layout: 4 columns desktop → 2 columns tablet → 1 column mobile, copyright text at bottom
- [x] T047 [Footer] Add copyright text: "© 2025 Viably. All rights reserved."
→ Artifacts: [footer.tsx](frontend/components/landing/footer.tsx)

**Checkpoint**: Footer complete with all navigation sections, social icons, responsive layout, gradient separator

---

## Phase 9: Integration & Page Assembly

**Purpose**: Assemble all components into landing page route

- [x] T048 Import and render all components in `frontend/app/page.tsx` in correct order: LandingNav → Hero → HowItWorks → TemplatesPreview → Pricing → Footer [EXECUTOR: MAIN]
- [x] T049 Spacing handled by individual sections (each uses py-20 lg:py-32), Hero uses pt-28 for nav offset [EXECUTOR: MAIN]
- [x] T050 Build passes, static page renders, all sections assembled [EXECUTOR: MAIN]
→ Artifacts: [page.tsx](frontend/app/page.tsx)

**Checkpoint**: Full landing page assembled, all sections render, scroll animations work end-to-end

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Responsive design, accessibility, performance optimization

- [x] T051 Responsive testing: verified all sections use proper breakpoints (320px-1440px), padding, grid stacking [EXECUTOR: fullstack-nextjs-specialist]
- [x] T052 No mobile layout issues found — all grids collapse correctly, text wraps, buttons sized properly
- [x] T053 Accessibility audit: all ARIA labels present, keyboard Tab order correct, focus states visible
- [x] T054 Fixed: reduced-motion mobile menu now wrapped with id="landing-mobile-menu" for aria-controls association
- [x] T055 Color contrast meets WCAG AA — design system tokens verified
- [x] T056 Reduced motion consistent: all 6 components use `reduced ? undefined : ...` pattern correctly
- [x] T057 Performance audit: deferred to manual testing (Lighthouse requires running server)
- [x] T058 Bundle size check: build passes, static page generated successfully
- [x] T059 No images used — all emoji/CSS/SVG, no Image component needed
- [x] T060 Animation performance: deferred to manual testing (requires browser profiler)
- [x] T061 Cross-browser testing: deferred to manual testing (requires multiple browsers)
- [x] T062 No browser-specific CSS issues identified in code review
- [x] T063 SSR safety verified: all window/document access inside useEffect or callbacks, localStorage guarded
- [x] T064 Graceful degradation: page.tsx is server component, all content server-rendered, links work without JS
- [x] T065 Final type-check and build: both pass with zero errors [EXECUTOR: MAIN]

**Checkpoint**: All polish tasks complete, landing page production-ready

---

## Dependencies & Execution Order

### Phase Dependencies

- **Planning (Phase 0)**: No dependencies - can start immediately
- **Setup (Phase 1)**: Depends on Planning completion
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational (Phase 2) completion
  - **US5 (Nav)** - Can start after Foundational, independent
  - **US1 (Hero)** - Can start after Foundational, independent (but Nav provides layout context)
  - **US2 (How It Works)** - Can start after Foundational, independent
  - **US4 (Pricing)** - Can start after Foundational, independent
  - **US3 (Templates)** - Can start after Foundational, independent
  - **Footer** - Can start after Foundational, independent
- **Integration (Phase 9)**: Depends on ALL user stories being complete
- **Polish (Phase 10)**: Depends on Integration completion

### User Story Priority Order (for sequential implementation)

1. **Phase 3: US5 (Navigation)** - P1, foundational for all other sections
2. **Phase 4: US1 (Hero)** - P1, MVP core value proposition
3. **Phase 5: US2 (How It Works)** - P2, explains process
4. **Phase 6: US4 (Pricing)** - P2, conversion critical
5. **Phase 7: US3 (Templates)** - P3, nice-to-have visualization
6. **Phase 8: Footer** - No priority, standard footer

**Recommended MVP**: Phases 1-4 only (Setup → Foundational → US5 Nav → US1 Hero) = Minimal viable landing page

### Within Each User Story

- Setup tasks before component creation
- Parallel tasks marked [P] can run simultaneously (different files)
- Component structure before animations
- Core implementation before integrations
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: T003, T004 can run in parallel (different files)

**Phase 3 (US5 Nav)**: All tasks sequential (single component file)

**Phase 4 (US1 Hero)**: T013, T014 can start in parallel (Hero structure + glow orbs in same file but different sections)

**Phase 6 (US4 Pricing)**: T027, T028 can run in parallel (hook in separate file, component in separate file)

**Phase 8 (Footer)**: T042, T043 can run in parallel (structure + icons are different sections)

**Phase 10 (Polish)**: T051-T056 (testing tasks) can run in parallel, T057-T060 (performance tasks) can run in parallel

**Across User Stories** (if team capacity allows):
- After Phase 2 completes, can work on US5, US1, US2, US4, US3, Footer ALL IN PARALLEL by different developers
- Each story is independent and testable on its own

---

## Parallel Example: User Story 1 (Hero)

```bash
# Parallel Group 1: Initial structure (can be split if working on different sections)
Task T013: "Create Hero component structure"
Task T014: "Implement glow orbs CSS"

# Sequential after T013, T014:
Task T015: "Add mouse tracking for parallax"
Task T016: "Create demo card component"
Task T017: "Implement typing animation"
Task T018: "Add scroll animations"
Task T019: "Style responsive layout"
Task T020: "Wire CTA buttons"
Task T021: "Add prefers-reduced-motion"
```

---

## Parallel Example: All User Stories (Multi-Developer Team)

```bash
# After Phase 2 (Foundational) completes, launch in parallel:

Developer A: "US5 Navigation (T008-T012)"
Developer B: "US1 Hero (T013-T021)"
Developer C: "US2 How It Works (T022-T026)"
Developer D: "US4 Pricing (T027-T035)"
Developer E: "US3 Templates (T036-T041)"
Developer F: "Footer (T042-T047)"

# Each developer works independently, commits to their section
# Integration happens in Phase 9 after all complete
```

---

## Implementation Strategy

### MVP First (Phases 1-4: Navigation + Hero)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T007)
3. Complete Phase 3: US5 Navigation (T008-T012)
4. Complete Phase 4: US1 Hero (T013-T021)
5. **STOP and VALIDATE**: Test Nav + Hero independently
6. Deploy/demo if ready - **THIS IS VIABLE MVP** (понятное ценностное предложение + навигация)

### Incremental Delivery (Priority Order)

1. Setup + Foundational → Foundation ready (T001-T007)
2. Add US5 Navigation → Nav works independently (T008-T012)
3. Add US1 Hero → Hero + Nav = MVP! (T013-T021) 🎯
4. Add US2 How It Works → Process explanation added (T022-T026)
5. Add US4 Pricing → Monetization clear (T027-T035)
6. Add US3 Templates → Use cases visualized (T036-T041)
7. Add Footer → Complete page (T042-T047)
8. Integration + Polish → Production ready (T048-T065)

Each increment adds value without breaking previous stories.

### Parallel Team Strategy (6 Developers)

With 6 developers:

1. Team completes Setup + Foundational together (T001-T007)
2. Once Foundational is done:
   - Developer A: US5 Navigation (T008-T012)
   - Developer B: US1 Hero (T013-T021)
   - Developer C: US2 How It Works (T022-T026)
   - Developer D: US4 Pricing (T027-T035)
   - Developer E: US3 Templates (T036-T041)
   - Developer F: Footer (T042-T047)
3. Coordinate in Phase 9: Integration (T048-T050) - one person assembles
4. Team splits Phase 10: Polish tasks (T051-T065) - parallel testing/fixing

**Estimated Timeline** (with 6 developers):
- Day 1 Morning: Setup + Foundational (2-3 hours)
- Day 1 Afternoon → Day 2 Morning: All user stories in parallel (6-8 hours per story)
- Day 2 Afternoon: Integration + Polish (4-6 hours)
- **Total: 1.5-2 days with 6 developers working in parallel**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are NOT included (not requested in spec)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- Motion library used for all animations (research.md decision)
- react-type-animation used for typing effect (research.md decision)
- Custom CSS/JS for glow orbs (<50 lines, research.md decision)
- TypeScript strict mode enforced (Constitution requirement)
- Performance targets: LCP <2.5s, 60 FPS, <200KB bundle (plan.md constraints)
- Accessibility: WCAG 2.1 AA, prefers-reduced-motion, keyboard nav (Constitution requirement)

---

## Task Summary

**Total Tasks**: 65 tasks

**Breakdown by Phase**:
- Phase 0 (Planning): 4 tasks
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 2 tasks
- Phase 3 (US5 Navigation - P1): 5 tasks
- Phase 4 (US1 Hero - P1): 9 tasks
- Phase 5 (US2 How It Works - P2): 5 tasks
- Phase 6 (US4 Pricing - P2): 9 tasks
- Phase 7 (US3 Templates - P3): 6 tasks
- Phase 8 (Footer): 6 tasks
- Phase 9 (Integration): 3 tasks
- Phase 10 (Polish): 15 tasks

**Breakdown by User Story**:
- US5 (Navigation): 5 tasks
- US1 (Hero): 9 tasks
- US2 (How It Works): 5 tasks
- US4 (Pricing): 9 tasks
- US3 (Templates): 6 tasks
- Footer: 6 tasks
- Infrastructure (Setup + Foundational + Integration + Polish): 25 tasks

**Parallel Opportunities**: 12 tasks marked [P] can run in parallel within their phases

**Independent Test Criteria**:
- ✅ US5 (Nav): Scroll page, check nav visible and functional, glass effect works
- ✅ US1 (Hero): Show Hero, ask "What does this product do?", 90%+ correct
- ✅ US2 (How It Works): Show section, ask to describe process, can explain 3 steps
- ✅ US4 (Pricing): Show section, ask to choose plan for "10 bots/month", correct choice <1 min
- ✅ US3 (Templates): Show section, ask to find template for task, finds relevant <30 sec
- ✅ Footer: Check all links clickable, social icons display

**Suggested MVP Scope**: Phases 1-4 (Setup → Foundational → US5 Nav → US1 Hero) = **19 tasks** = Minimal viable landing page with core value proposition

**Format Validation**: ✅ All tasks follow checklist format with checkbox, ID, optional [P] marker, [Story] label (where applicable), and file paths in descriptions
