# Research: Settings Pages

**Feature**: 014-settings-pages
**Date**: 2026-02-06

---

## Library Decisions

### R-001: No New Libraries Required

**Decision**: No new npm packages needed. All required UI components and libraries already exist in the project.
**Rationale**: Settings pages are standard CRUD forms, lists, and static cards. The existing stack fully covers all requirements:
- `react-hook-form` + `zod` — for profile and password forms (already used in auth screens)
- `sonner` — for toast notifications (already configured)
- `next-themes` — for theme switching (already installed and configured with `useTheme`)
- `shadcn/ui` components — Dialog, Form, Tabs, Button, Badge, Input, Card (all available)
- `motion` — for animations and transitions (already installed)
- `lucide-react` — for icons (already installed)

**Alternatives considered**:
- `react-dropzone` for avatar upload — rejected: native HTML5 drag-and-drop API + `<input type="file">` is sufficient for a single file avatar upload (<20 lines of code)
- `react-avatar-editor` — rejected: cropping is not in scope for MVP; simple preview is sufficient
- `zxcvbn` for password strength — rejected: existing `PasswordStrength` component already has a working 4-level strength meter; no need for a heavyweight library

---

## Existing Codebase Reuse

### Components to Reuse (as-is)

| Component | Path | Usage in Settings |
|-----------|------|-------------------|
| `MainLayout` | `components/layout/main-layout.tsx` | Settings page wrapper (Navbar + content container) |
| `Navbar` | `components/layout/navbar.tsx` | Main navigation (already has credits badge, theme toggle) |
| `Dialog` | `components/ui/dialog.tsx` | Buy Credits modal |
| `Form` / `FormField` | `components/ui/form.tsx` | Profile form, password form |
| `Button` | `components/ui/button.tsx` | Save, Update, Buy, Upgrade buttons |
| `Badge` | `components/ui/badge.tsx` | Plan badge, credit package badges (popular, best value) |
| `Input` | `components/ui/input.tsx` | Name, password fields, custom credits amount |
| `Card` | `components/ui/card.tsx` | Plan cards, theme cards, current plan info |
| `Tabs` | `components/ui/tabs.tsx` | Mobile horizontal tabs for settings navigation |
| `Label` | `components/ui/label.tsx` | Form field labels |
| `Separator` | `components/ui/separator.tsx` | Section dividers |
| `PasswordStrength` | `components/auth/password-strength.tsx` | Reuse in change password form |
| `FadeInUp` | `components/motion/fade-in-up.tsx` | Entry animations on page/section load |
| `Shimmer` | `components/ui/shimmer.tsx` | Loading states |

### Hooks to Reuse

| Hook | Path | Usage |
|------|------|-------|
| `useMounted` | `hooks/use-mounted.ts` | Client-side rendering checks (theme settings) |
| `useReducedMotion` | `hooks/use-reduced-motion.ts` | Respect animation preferences for theme transition |
| `useDebounce` | `hooks/use-debounce.ts` | Transaction history search debouncing (if search added later) |

### Data Patterns to Follow

| Pattern | Path | Usage |
|---------|------|-------|
| Mock API functions | `lib/api/projects.ts` | Settings mock APIs (profile update, password change, credits) |
| Mock data arrays | `lib/data/projects.ts` | Mock transaction history, plan data |
| Zustand store | `stores/dashboard.ts` | Settings store pattern |
| Types barrel export | `types/index.ts` | All new settings types go here |
| Validation schemas | `lib/validations/auth.ts` | Profile and password validation schemas |

### Types to Reuse

| Type | Path | Usage |
|------|------|-------|
| `UserProfile` | `types/index.ts` | Profile data (name, email, plan, credits) |
| `NavItem` | `types/index.ts` | Settings sidebar navigation items |

---

## Technical Decisions

### Settings Navigation: Sidebar vs Tabs

**Decision**: Sidebar navigation with URL-based routing (Next.js nested layouts)
**Rationale**: Settings layout uses `app/(main)/settings/layout.tsx` with a sidebar component. Each section is a nested page (`/settings/profile`, `/settings/billing`, etc.). Mobile uses horizontal tabs at top via `Tabs` component. This is standard for settings pages and matches the project's App Router pattern.

### Profile Form: Single Form vs Separate Sections

**Decision**: Two separate forms — Profile Info (name + avatar) and Change Password
**Rationale**: These are logically separate operations with different validation rules, different API endpoints, and different success/failure states. Splitting prevents accidental password changes when just updating a name.

### Transaction History: Pagination vs Infinite Scroll

**Decision**: Infinite scroll (load more on scroll)
**Rationale**: For MVP with mock data, simple "load more" pattern is sufficient. Transaction lists are typically chronological and continuous, making infinite scroll more natural than pagination.

### Avatar Upload: Library vs Native

**Decision**: Native HTML5 file input + drag-and-drop events
**Rationale**: Only need single file upload with preview. No cropping, rotation, or advanced editing. Native approach is <20 lines and requires no additional dependency.

### Theme Settings Page: Radio Cards

**Decision**: Custom radio card components (not a separate library)
**Rationale**: Three radio cards with preview is a simple layout. shadcn/ui `Card` + custom radio selection state is sufficient. No library needed for 3 static options.

### Plan Comparison: Pricing Cards

**Decision**: Static pricing cards with hardcoded plan data
**Rationale**: For MVP, plan data is static. No need for dynamic plan fetching. Cards follow existing `Card` component pattern with gradient badges for paid plans.

---

## New Dependencies Summary

| Package | Version | Purpose | Bundle Size |
|---------|---------|---------|-------------|
| — | — | No new packages required | — |

All functionality is covered by existing dependencies.
