# Implementation Plan: Auth Screens

**Branch**: `009-auth-screens` | **Date**: 2026-02-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-auth-screens/spec.md`

## Summary

Implement Login, Register, and Forgot Password pages with a shared split-screen auth layout. The layout features a decorative branding panel (gradient, animated glow orbs, tagline, social proof) on the left and form content on the right. Forms use react-hook-form + Zod for validation, sonner for toast notifications, and mock API functions for MVP. Next.js 16 proxy handles auth redirects.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Node.js 18+
**Primary Dependencies**: Next.js 16.1.6, Tailwind CSS v4, shadcn/ui (new-york style), motion 12.33, react-hook-form 7.66+, zod 3.25.x, @hookform/resolvers 5.2+, sonner, zustand 5
**Storage**: N/A (client-side only, mock API for MVP)
**Testing**: Type-check (`tsc --noEmit`), build (`next build`), manual visual testing
**Target Platform**: Web (desktop + mobile, 320px-2560px viewports)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Validation feedback <200ms, page transitions <1s, strength indicator <200ms per keystroke
**Constraints**: Mobile-first responsive, WCAG 2.1 AA, prefers-reduced-motion support
**Scale/Scope**: 4 pages (layout + 3 forms), ~10 new files, ~5 new shadcn/ui components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First | PASS | Explored full codebase: components, design tokens, globals.css, package.json, layout patterns |
| II. Single Source of Truth | PASS | Zod schemas in `lib/validations/auth.ts`, types inferred from schemas, mock API contracts in `lib/api/auth.ts` |
| III. Library-First | PASS | react-hook-form (forms), zod (validation), sonner (toasts) — all >70% coverage, actively maintained. Custom password strength <20 lines. |
| IV. Code Reuse & DRY | PASS | Reuse existing GlowOrbs, Button (loading), Input (aria-invalid), Badge components. Shared auth layout for all 3 pages. Social buttons extracted as reusable component. |
| V. Strict Type Safety | PASS | TypeScript strict mode. Zod schemas provide runtime + compile-time validation. Explicit return types. No `any`. |
| VI. Atomic Task Execution | PASS | Each task = 1 file or closely related set. Independent, testable, committable. |
| VII. Quality Gates | PASS | type-check + build before each commit. No hardcoded credentials. |
| VIII. Progressive Spec | PASS | Spec → Plan → Tasks → Implement flow followed. |
| IX. Error Handling | PASS | Typed form errors via Zod. User-facing: clear validation messages. Server errors: toast notifications. |
| X. Observability | N/A | Frontend-only, no logging infrastructure needed for MVP auth screens. |
| XI. Accessibility | PASS | WCAG 2.1 AA: keyboard nav, screen reader labels, aria-invalid on inputs, focus-visible states, reduced motion, contrast requirements. |

**Post-Phase 1 Re-check**: All gates still pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/009-auth-screens/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Library decisions
├── data-model.md        # Phase 1: Form data models
├── quickstart.md        # Phase 1: Setup guide
├── contracts/
│   └── auth-api.md      # Phase 1: Mock API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                 # Auth split layout
│   │   ├── login/
│   │   │   └── page.tsx               # Login page
│   │   ├── register/
│   │   │   └── page.tsx               # Register page
│   │   └── forgot-password/
│   │       └── page.tsx               # Forgot password page
│   └── layout.tsx                     # Root layout (+ Toaster)
├── components/
│   ├── auth/
│   │   ├── auth-decorative-panel.tsx  # Decorative left panel
│   │   ├── social-login-buttons.tsx   # Google + GitHub buttons
│   │   └── password-strength.tsx      # Password strength indicator
│   └── ui/
│       ├── label.tsx                  # shadcn/ui (new)
│       ├── form.tsx                   # shadcn/ui (new)
│       ├── checkbox.tsx               # shadcn/ui (new)
│       ├── separator.tsx              # shadcn/ui (new)
│       └── sonner.tsx                 # shadcn/ui (new)
├── lib/
│   ├── api/
│   │   └── auth.ts                    # Mock auth API
│   └── validations/
│       └── auth.ts                    # Zod schemas
└── proxy.ts                           # Auth redirect proxy
```

**Structure Decision**: Uses existing Next.js App Router structure with route group `(auth)` for auth pages. Auth-specific components in `components/auth/`. Validation schemas in `lib/validations/`. Mock API in `lib/api/`. This follows the established project patterns (components in `components/`, utilities in `lib/`).

## Component Architecture

### Auth Layout (`app/(auth)/layout.tsx`)
```
┌──────────────────────────────┬───────────────────────────────────────┐
│  AuthDecorativePanel         │  Form Area (children)                 │
│  (45% width, hidden <768px)  │  (55% width, 100% on mobile)         │
│                              │                                       │
│  - GlowOrbs (reuse)         │  - Logo (Viably icon + text)          │
│  - Tagline (Space Grotesk)  │  - {children} (page content)          │
│  - Social proof badge        │                                       │
│  - Gradient background       │  - Vertically centered                │
│                              │  - Max-width constrained              │
└──────────────────────────────┴───────────────────────────────────────┘
```

### Form Pages (login, register, forgot-password)
Each page follows the pattern:
1. Heading + subtitle
2. Form fields with react-hook-form
3. Submit button (gradient, full-width, loading state)
4. Separator + social buttons (login/register only)
5. Navigation link (to other auth pages)

### Shared Components
- **AuthDecorativePanel**: Left panel with glow orbs, tagline, stats
- **SocialLoginButtons**: Google + GitHub buttons with icons
- **PasswordStrength**: 4-segment bar + rules text

## Key Design Decisions

### D-001: Route Group for Auth
Use Next.js `(auth)` route group. Auth pages share a layout but don't add `/auth/` to URL paths. Routes: `/login`, `/register`, `/forgot-password`.

### D-002: Mock API Pattern
Create `lib/api/auth.ts` with typed async functions that simulate backend behavior (1s delay, success/error scenarios). Same interface as future real API — enables clean migration.

### D-003: GlowOrbs Reuse Strategy
Existing `GlowOrbs` component uses `fixed inset-0`. For the auth decorative panel, override positioning via className prop to `absolute inset-0` within the panel container.

### D-004: Proxy.ts for Auth Guards
Next.js 16 `proxy.ts` (renamed from middleware.ts) handles:
- Authenticated users on auth pages → redirect to `/dashboard`
- Unauthenticated users on protected pages → redirect to `/login`
- For MVP: check cookie existence only (no JWT validation)

### D-005: React 19 + react-hook-form
Use `useWatch()` instead of `watch()` for React 19 compatibility. This applies to password strength indicator (watching password field value in real-time).

### D-006: Form Validation Strategy
- Client-side: Zod schemas via `zodResolver` in react-hook-form
- Field-level errors: displayed below inputs using shadcn/ui Form components
- Server-side errors: displayed via sonner toast
- Shake animation: CSS animation on form container triggered by submission failure

## Complexity Tracking

> No violations. All implementations follow constitution principles.

| Aspect | Complexity | Justification |
|--------|-----------|---------------|
| Dependencies | Low | 3 new libraries (react-hook-form, zod, sonner) — all established standards |
| Components | Medium | 3 new auth components + 5 shadcn/ui components + 3 pages + 1 layout |
| State | Low | Form state managed by react-hook-form, no global state needed |
| Routing | Low | Standard Next.js route group with proxy.ts |
