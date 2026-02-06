# Tasks: Auth Screens

**Input**: Design documents from `/specs/009-auth-screens/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api.md, quickstart.md

**Tests**: Not requested in feature specification. No test tasks included.

**Organization**: Tasks are grouped by user story. US4 (Auth Layout) is placed in Foundational phase as it blocks all other stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app frontend**: `frontend/` at repository root
- Components: `frontend/components/`
- Pages: `frontend/app/`
- Utilities: `frontend/lib/`

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

## Phase 1: Setup (Dependencies & shadcn/ui Components)

**Purpose**: Install all new dependencies and generate shadcn/ui components needed across all user stories.

- [x] T001 Install form handling dependencies: `npm install react-hook-form @hookform/resolvers zod` in `frontend/`
- [x] T002 Install toast dependency: `npm install sonner` in `frontend/`
- [x] T003 Install shadcn/ui label component: `npx shadcn@latest add label` in `frontend/`
- [x] T004 Install shadcn/ui form component: `npx shadcn@latest add form` in `frontend/`
- [x] T005 [P] Install shadcn/ui checkbox component: `npx shadcn@latest add checkbox` in `frontend/`
- [x] T006 [P] Install shadcn/ui separator component: `npx shadcn@latest add separator` in `frontend/`
- [x] T007 [P] Install shadcn/ui sonner component: `npx shadcn@latest add sonner` in `frontend/`
- [x] T008 Add `<Toaster />` from sonner to root layout in `frontend/app/layout.tsx`
  → Artifacts: [label.tsx](frontend/components/ui/label.tsx), [form.tsx](frontend/components/ui/form.tsx), [checkbox.tsx](frontend/components/ui/checkbox.tsx), [separator.tsx](frontend/components/ui/separator.tsx), [sonner.tsx](frontend/components/ui/sonner.tsx), [layout.tsx](frontend/app/layout.tsx)

**Note**: T001-T002 install npm packages. T003-T007 generate shadcn/ui component files. T004 depends on T003 (form component imports label). T005-T007 are independent. T008 depends on T007.

---

## Phase 2: Foundational (Auth Layout + Shared Code)

**Purpose**: Core infrastructure that MUST be complete before ANY user story page can be implemented. Includes User Story 4 (Auth Layout - P1) and shared utilities.

**Covers**: User Story 4 - Brand Experience via Auth Layout (P1)

**Goal**: All auth pages share a consistent split-screen layout with decorative panel.

**Independent Test**: Visit any auth page path on desktop — see split layout. Visit on mobile (<768px) — only form visible.

### Shared Utilities

- [x] T009 [P] Create Zod validation schemas for all auth forms in `frontend/lib/validations/auth.ts`
- [x] T010 [P] Create mock auth API functions in `frontend/lib/api/auth.ts`
- [x] T011 [P] Add CSS `@keyframes shake` animation to `frontend/app/globals.css` for form error shake effect

### Auth Layout Components

- [x] T012 Create `AuthDecorativePanel` component in `frontend/components/auth/auth-decorative-panel.tsx`
- [x] T013 Create auth split layout in `frontend/app/(auth)/layout.tsx`
  → Artifacts: [auth.ts](frontend/lib/validations/auth.ts), [auth.ts](frontend/lib/api/auth.ts), [globals.css](frontend/app/globals.css), [auth-decorative-panel.tsx](frontend/components/auth/auth-decorative-panel.tsx), [layout.tsx](frontend/app/(auth)/layout.tsx)

**Checkpoint**: Auth layout structure complete. Any page placed inside `(auth)/` route group renders with split layout. Type-check and build must pass.

---

## Phase 3: User Story 1 - Existing User Signs In (Priority: P1) MVP

**Goal**: Returning user can sign in with email/password and reach dashboard.

**Independent Test**: Navigate to `/login`, enter credentials, verify validation, submit, verify redirect to `/dashboard`.

**Covers**: FR-005, FR-006, FR-007, FR-008, FR-015, FR-016, FR-017, FR-019, FR-021

### Implementation for User Story 1

- [x] T014 [US1] Create Login page in `frontend/app/(auth)/login/page.tsx`
  → Artifacts: [page.tsx](frontend/app/(auth)/login/page.tsx)

**Checkpoint**: Login page fully functional. Validation works, loading state shows, errors display as toast + field errors, password toggle works, navigation links work. Type-check and build pass.

---

## Phase 4: User Story 2 - New User Creates Account (Priority: P2)

**Goal**: New user can register with name, email, password (with strength feedback), confirm password, and terms agreement.

**Independent Test**: Navigate to `/register`, fill all fields, verify real-time password strength, submit, verify redirect to `/dashboard`.

**Covers**: FR-009, FR-010, FR-011, FR-015, FR-016, FR-017, FR-019, FR-021

### Implementation for User Story 2

- [x] T015 [P] [US2] Create `PasswordStrength` component in `frontend/components/auth/password-strength.tsx`
- [x] T016 [US2] Create Register page in `frontend/app/(auth)/register/page.tsx`
  → Artifacts: [password-strength.tsx](frontend/components/auth/password-strength.tsx), [page.tsx](frontend/app/(auth)/register/page.tsx)

**Checkpoint**: Register page fully functional. All 5 fields validate, password strength indicator updates per keystroke, confirm password match works, terms required, navigation links work. Type-check and build pass.

---

## Phase 5: User Story 3 - User Resets Forgotten Password (Priority: P3)

**Goal**: User can request a password reset link by entering their email.

**Independent Test**: Navigate to `/forgot-password`, enter email, submit, verify success message or error state.

**Covers**: FR-012, FR-013, FR-014, FR-015, FR-016, FR-019

### Implementation for User Story 3

- [x] T017 [US3] Create Forgot Password page in `frontend/app/(auth)/forgot-password/page.tsx`
  → Artifacts: [page.tsx](frontend/app/(auth)/forgot-password/page.tsx)

**Checkpoint**: Forgot password page functional. Email validates, success state shows confirmation with email address, error state shows toast, back link works. Type-check and build pass.

---

## Phase 6: User Story 5 - Social Login Buttons (Priority: P3)

**Goal**: Login and register pages display Google/GitHub social login buttons as visual placeholders.

**Independent Test**: Visit `/login` and `/register`, verify social buttons appear below a divider, verify hover states.

**Covers**: FR-018, FR-019

### Implementation for User Story 5

- [x] T018 [US5] Create `SocialLoginButtons` component in `frontend/components/auth/social-login-buttons.tsx`
  - Separator with text "or" in the middle (using shadcn/ui `Separator` + centered text overlay)
  - Two buttons in a row: Google, GitHub
  - Button style: `variant="secondary"` (outline with border), full width each, gap between
  - Google button: Google icon (SVG inline or from lucide) + "Continue with Google"
  - GitHub button: GitHub icon (from lucide-react) + "Continue with GitHub"
  - onClick: no action (MVP), buttons are visual-only
  - Hover/active states via existing button component styling
  - Accessible: `aria-label` on each button
- [x] T019 [US5] Add `SocialLoginButtons` to Login page in `frontend/app/(auth)/login/page.tsx`
  - Place below the "Sign In" button and "Forgot password" link
  - Import and render `<SocialLoginButtons />` component
- [x] T020 [US5] Add `SocialLoginButtons` to Register page in `frontend/app/(auth)/register/page.tsx`
  - Place below the "Create Account" button
  - Import and render `<SocialLoginButtons />` component
  → Artifacts: [page.tsx](frontend/app/(auth)/register/page.tsx)

**Checkpoint**: Social buttons visible on both login and register pages with divider. Hover states work. No action on click. Type-check and build pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Auth redirect proxy, edge cases, final validation.

- [ ] T021 Create auth redirect proxy in `frontend/proxy.ts`
  - Export named `proxy()` function (Next.js 16 convention, NOT `middleware`)
  - Check for `session` cookie existence (lightweight, no JWT validation)
  - Auth routes (`/login`, `/register`, `/forgot-password`): if session cookie exists → redirect to `/dashboard`
  - Protected routes (`/dashboard`): if no session cookie → redirect to `/login`
  - Export `config.matcher` excluding `_next/static`, `_next/image`, API routes, public assets
- [ ] T022 Run type-check and build validation: `npm run type-check && npm run build` in `frontend/`
- [ ] T023 Visual smoke test: verify all pages render correctly on desktop and mobile viewports
  - `/login` — form + decorative panel on desktop, form only on mobile
  - `/register` — same layout, password strength indicator, terms checkbox
  - `/forgot-password` — same layout, success/error states
  - Navigation between all pages works
  - Theme toggle works on auth pages (light/dark)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (needs shadcn/ui form, zod, etc.)
- **US1 Login (Phase 3)**: Depends on Phase 2 (needs auth layout, validation schemas, mock API)
- **US2 Register (Phase 4)**: Depends on Phase 2. Independent from US1.
- **US3 Forgot Password (Phase 5)**: Depends on Phase 2. Independent from US1/US2.
- **US5 Social Buttons (Phase 6)**: Depends on Phase 3 and Phase 4 (modifies login and register pages)
- **Polish (Phase 7)**: Depends on all story phases

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (Auth Layout + Schemas + Mock API)
    ↓ ↓ ↓
    │ │ └── Phase 5: US3 - Forgot Password (P3)
    │ └──── Phase 4: US2 - Register (P2)
    └────── Phase 3: US1 - Login (P1) ← MVP
                ↓           ↓
                └─────┬─────┘
                      ↓
              Phase 6: US5 - Social Buttons (P3)
                      ↓
              Phase 7: Polish
```

### Within Each User Story

- Schemas & mock API created in Foundational phase (shared)
- Component tasks marked [P] can run in parallel with page tasks
- Page tasks are self-contained (1 page = 1 task)

### Parallel Opportunities

**Phase 1**: T005, T006, T007 can run in parallel (independent shadcn/ui installs)
**Phase 2**: T009, T010, T011 can run in parallel (different files: validations, api, css)
**Phase 2**: T012 must complete before T013 (layout uses decorative panel)
**Phase 3-5**: US1, US2, US3 can run in parallel after Phase 2 (independent pages)
**Phase 4**: T015 (PasswordStrength) can run in parallel with other prep work

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch in parallel (different files, no dependencies):
Task: "Create Zod validation schemas in frontend/lib/validations/auth.ts"
Task: "Create mock auth API in frontend/lib/api/auth.ts"
Task: "Add shake animation to frontend/app/globals.css"

# Then sequential:
Task: "Create AuthDecorativePanel in frontend/components/auth/auth-decorative-panel.tsx"
Task: "Create auth layout in frontend/app/(auth)/layout.tsx" # depends on panel
```

## Parallel Example: User Stories (after Phase 2)

```bash
# US1, US2, US3 can all start in parallel after Phase 2:
Agent A: "Create Login page in frontend/app/(auth)/login/page.tsx"
Agent B: "Create Register page + PasswordStrength component"
Agent C: "Create Forgot Password page"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install deps + shadcn/ui)
2. Complete Phase 2: Foundational (layout + schemas + mock API)
3. Complete Phase 3: US1 - Login page
4. **STOP and VALIDATE**: Login page works independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Auth layout visible
2. Add US1 (Login) → Test login flow → Deploy (MVP!)
3. Add US2 (Register) → Test register flow → Deploy
4. Add US3 (Forgot Password) → Test reset flow → Deploy
5. Add US5 (Social Buttons) → Test presence on login/register → Deploy
6. Polish (proxy.ts, visual QA) → Final deploy

---

## Summary

| Metric | Value |
|--------|-------|
| **Total tasks** | 23 (T001-T023) |
| **Phase 0 (Planning)** | 4 tasks (P001-P004) |
| **Phase 1 (Setup)** | 8 tasks (T001-T008) |
| **Phase 2 (Foundational + US4)** | 5 tasks (T009-T013) |
| **Phase 3 (US1 - Login)** | 1 task (T014) |
| **Phase 4 (US2 - Register)** | 2 tasks (T015-T016) |
| **Phase 5 (US3 - Forgot Password)** | 1 task (T017) |
| **Phase 6 (US5 - Social Buttons)** | 3 tasks (T018-T020) |
| **Phase 7 (Polish)** | 3 tasks (T021-T023) |
| **Parallel opportunities** | 8 (T005/T006/T007, T009/T010/T011, T015/T016, US1/US2/US3) |
| **MVP scope** | Phase 1 + Phase 2 + Phase 3 (US1 Login) |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after Phase 2
- Use `useWatch()` instead of `watch()` everywhere (React 19 compatibility)
- All form pages follow same pattern: react-hook-form + zodResolver + mock API + toast
- Commit after each task or logical group
- Type-check + build must pass before each commit
