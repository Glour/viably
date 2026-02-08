# Implementation Plan: E2E Testing & Polish

**Branch**: `018-testing-polish` | **Date**: 2026-02-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-testing-polish/spec.md`

## Summary

End-to-end testing infrastructure (Playwright), responsive UI polish across 5 breakpoints, performance optimization (bundle analysis, mobile animation disable), SEO metadata for all pages (Next.js Metadata API + robots.ts + sitemap.ts), and final QA bug fixes to prepare for pre-launch.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Node.js 18+
**Primary Dependencies**: Next.js 16.1.6, Tailwind CSS v4, shadcn/ui (radix-ui), motion 12.33, zustand 5.x, @tanstack/react-query 5.90, ky 1.14, @monaco-editor/react 4.7.0, react-use-websocket 4.13
**New Dependencies**: `@playwright/test` (dev), `@next/bundle-analyzer` (dev)
**Storage**: N/A (client-side only, no DB changes)
**Testing**: Playwright (E2E), `npx playwright test`
**Target Platform**: Web (desktop + mobile), browsers: Chromium (MVP), Firefox/WebKit (future)
**Project Type**: Web application (frontend-only scope for this feature)
**Performance Goals**: Lighthouse mobile score 90+, no horizontal scroll at any breakpoint, code editor lazy-loaded
**Constraints**: No backend changes, no new runtime dependencies, E2E tests must work with mocked API
**Scale/Scope**: 5 E2E test suites, ~15 pages to add metadata, 5 breakpoints to verify, 1 config file update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First | PASS | Full codebase exploration completed — reviewed all pages, components, stores, hooks, current responsive patterns, font config, animation patterns, existing metadata |
| II. Single Source of Truth | PASS | Test fixtures centralized in `e2e/fixtures/`, metadata follows Next.js convention (per-page exports) |
| III. Library-First | PASS | Playwright (official Next.js recommendation), @next/bundle-analyzer (official Next.js package). No custom test framework. |
| IV. Code Reuse & DRY | PASS | Test helpers and mock data shared via fixtures. Existing patterns (Tailwind responsive, useReducedMotion) reused. |
| V. Strict Type Safety | PASS | All test files in TypeScript. Mock data typed. Playwright has full TS support. |
| VI. Atomic Task Execution | PASS | Each task is independently completable and committable. |
| VII. Quality Gates | PASS | Type-check must pass before each commit. E2E tests run as validation. |
| VIII. Progressive Specification | PASS | Spec → Plan → Tasks → Implement flow followed. |
| IX. Error Handling | PASS | FR-017 requires all error states show informative messages |
| X. Observability | N/A | No server-side changes |
| XI. Accessibility | PASS | Existing patterns (aria-label, sr-only, useReducedMotion) maintained. Lazy-loaded components must remain accessible. |

**Post-Phase 1 re-check**: All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/018-testing-polish/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output - research decisions
├── data-model.md        # Phase 1 output - data model (test fixtures + metadata)
├── quickstart.md        # Phase 1 output - setup guide
├── contracts/           # Phase 1 output
│   └── mock-api-contracts.md  # Mock API response contracts for E2E tests
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── e2e/                              # NEW: Playwright E2E tests
│   ├── auth.spec.ts                  # Auth flow (register, login, logout)
│   ├── generation.spec.ts            # Template → Project → Generate flow
│   ├── deploy.spec.ts                # Deploy flow
│   ├── credits.spec.ts               # Credits flow (balance, bonus)
│   ├── responsive.spec.ts            # Responsive behavior (375px)
│   └── fixtures/                     # Shared test data & helpers
│       ├── mock-data.ts              # Typed mock API responses
│       └── test-helpers.ts           # Auth setup, route mocking utils
├── playwright.config.ts              # NEW: Playwright configuration
├── app/
│   ├── robots.ts                     # NEW: SEO robots.txt handler
│   ├── sitemap.ts                    # NEW: SEO sitemap.xml handler
│   ├── layout.tsx                    # MODIFIED: enhanced metadata template
│   ├── page.tsx                      # MODIFIED: add OG tags
│   ├── (auth)/
│   │   ├── login/page.tsx            # MODIFIED: add metadata export
│   │   ├── register/page.tsx         # MODIFIED: add metadata export
│   │   └── forgot-password/page.tsx  # MODIFIED: add metadata export
│   ├── dashboard/page.tsx            # MODIFIED: add metadata export
│   ├── templates/
│   │   ├── page.tsx                  # MODIFIED: add metadata export
│   │   └── [slug]/page.tsx           # MODIFIED: add generateMetadata
│   ├── projects/
│   │   ├── page.tsx                  # MODIFIED: add metadata export
│   │   ├── [id]/page.tsx             # MODIFIED: add metadata export
│   │   └── [id]/generate/page.tsx    # MODIFIED: add metadata export
│   └── (main)/settings/
│       ├── profile/page.tsx          # MODIFIED: add metadata export
│       ├── theme/page.tsx            # MODIFIED: add metadata export
│       ├── billing/page.tsx          # MODIFIED: add metadata export
│       └── plan/page.tsx             # MODIFIED: add metadata export
├── components/ui/
│   └── glow-orbs.tsx                 # MODIFIED: mobile disable wrapper
└── next.config.ts                    # MODIFIED: bundle analyzer wrapper
```

**Structure Decision**: Frontend-only changes. No backend modifications. Test infrastructure lives in `frontend/e2e/`. Config files at `frontend/` root. All page metadata changes are minimal additions to existing page files.

## Implementation Phases

### Phase A: Testing Infrastructure Setup (Sequential — foundation for all E2E tests)

| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| T001 | Install Playwright + @next/bundle-analyzer, create playwright.config.ts, add npm scripts (`test:e2e`, `analyze`) | fullstack-nextjs-specialist | None |
| T002 | Create test fixtures: `e2e/fixtures/mock-data.ts` (typed mock responses), `e2e/fixtures/test-helpers.ts` (auth setup, route mocking utilities) | test-writer | T001 |

### Phase B: E2E Test Suites (Parallel — independent test files)

| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| T003 | E2E: Auth flow — register, login, dashboard redirect, navbar user display, logout, re-login | test-writer | T002 |
| T004 | E2E: Template → Project → Generate flow — browse templates, select, create project, config form, trigger generation (mock WS), view code | test-writer | T002 |
| T005 | E2E: Deploy flow — navigate to generated project, enter bot token, deploy, verify deployment info | test-writer | T002 |
| T006 | E2E: Credits flow — check balance, generate to deduct, claim daily bonus, verify updated balance | test-writer | T002 |
| T007 | E2E: Responsive — run critical flows at 375px viewport, verify hamburger menu, single-column templates, tabbed generation | test-writer | T002 |

### Phase C: SEO & Metadata (Parallel — independent page changes)

| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| T008 | Update root layout metadata: add title template `%s | Viably`, keywords, enhanced description. Add OG tags to landing page. | fullstack-nextjs-specialist | None |
| T009 | Add static metadata exports to all auth pages (login, register, forgot-password), dashboard, projects, settings pages | fullstack-nextjs-specialist | T008 |
| T010 | Add generateMetadata to templates/[slug] page (dynamic title from template name). Add static metadata to templates list page. | fullstack-nextjs-specialist | T008 |
| T011 | Create `app/robots.ts` and `app/sitemap.ts` using Next.js 16 file-based route handlers | fullstack-nextjs-specialist | None |

### Phase D: Performance Optimization (Parallel — independent changes)

| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| T012 | Integrate @next/bundle-analyzer into next.config.ts, add `analyze` script, run initial analysis, document findings | fullstack-nextjs-specialist | T001 |
| T013 | Add mobile GlowOrbs disable: wrap GlowOrbs usage with useMediaQuery check to prevent render on viewports < 768px | fullstack-nextjs-specialist | None |

### Phase E: Responsive Polish (Sequential — requires visual verification)

| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| T014 | Responsive audit: systematically check all pages at 375px, 390px, 768px, 1024px, 1440px. Document issues found. | mobile-responsiveness-tester | None |
| T015 | Fix responsive issues found in T014: horizontal scroll, touch targets, text truncation, form widths, modal sheets | mobile-fixes-implementer | T014 |

### Phase F: Final QA (Sequential — depends on all fixes)

| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| T016 | QA pass: verify all flows (auth, templates, generation, deploy, credits, settings), dark mode, error states, empty states, loading states, toasts, navigation. Document bugs. | fullstack-nextjs-specialist | T009, T010, T013, T015 |
| T017 | Fix bugs found in T016 QA pass. Verify production build has no console errors. | fullstack-nextjs-specialist | T016 |

## Task Dependency Graph

```
T001 (Playwright setup)
  └─→ T002 (Test fixtures)
        ├─→ T003 (E2E: Auth)        ─┐
        ├─→ T004 (E2E: Generation)   │ Parallel
        ├─→ T005 (E2E: Deploy)       │
        ├─→ T006 (E2E: Credits)      │
        └─→ T007 (E2E: Responsive)  ─┘

T008 (Root metadata)
  ├─→ T009 (Page metadata)    ─┐ Parallel
  └─→ T010 (Dynamic metadata) ─┘

T011 (robots.ts + sitemap.ts)     # Independent

T001 ─→ T012 (Bundle analyzer)    # After setup
T013 (GlowOrbs mobile)            # Independent

T014 (Responsive audit) ─→ T015 (Responsive fixes)

T009, T010, T013, T015 ─→ T016 (QA pass) ─→ T017 (Bug fixes)
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| E2E tests flaky due to timing | Medium | Medium | Use Playwright auto-waiting, explicit waitFor, avoid arbitrary timeouts |
| WebSocket mocking doesn't match real API | Low | Medium | Mock contracts mirror real API (see contracts/mock-api-contracts.md) |
| Responsive fixes cause regressions | Low | Medium | E2E responsive test suite catches regressions |
| Bundle analyzer reveals large unexpected dependencies | Low | Low | Document findings, defer optimization to future sprint if non-critical |
| Lighthouse 90+ not achievable on all pages | Medium | Low | Focus on primary pages (landing, dashboard), defer secondary pages |

## Complexity Tracking

No constitution violations. No complexity justifications needed.
