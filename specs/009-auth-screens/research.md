# Research: Auth Screens (009)

**Date**: 2026-02-06
**Feature**: 009-auth-screens
**Status**: Complete

---

## R-001: Form Handling Library

**Decision**: react-hook-form v7.66+
**Rationale**: De-facto standard for React forms. Uncontrolled approach minimizes re-renders. Native shadcn/ui integration via `<Form>` component. 9KB gzipped.
**React 19 Note**: `watch()` broken in React 19 — use `useWatch()` hook instead. This is a known issue. All other APIs work.
**Alternatives considered**:
- **Formik**: Heavier (~13KB), controlled approach causes more re-renders, less shadcn/ui integration
- **React 19 native actions**: Too low-level for complex multi-field validation with real-time feedback
- **Conform**: Good Next.js integration but smaller ecosystem, less documentation

---

## R-002: Validation Library

**Decision**: zod v3.25.x (NOT v4.x — ecosystem not ready)
**Rationale**: TypeScript-first schema validation. Static type inference via `z.infer<>`. Framework-agnostic. Integrated with react-hook-form via `@hookform/resolvers`.
**Integration**: `@hookform/resolvers` v5.2+ provides `zodResolver()` adapter.
**Alternatives considered**:
- **Yup**: Less TypeScript-native, slightly larger bundle
- **Valibot**: Smaller bundle but less ecosystem support, fewer examples
- **ArkType**: Very new, insufficient community adoption

---

## R-003: Toast Notifications

**Decision**: sonner (latest)
**Rationale**: Official shadcn/ui recommendation (replaced @radix-ui/react-toast). Promise-based API ideal for async form submissions. Simple `toast.success()`, `toast.error()` API. ~5KB gzipped. React 19 compatible.
**Installation**: `npx shadcn@latest add sonner` — creates `<Toaster>` component.
**Alternatives considered**:
- **@radix-ui/react-toast**: Available in radix-ui meta-package but requires more boilerplate. shadcn/ui deprecated their Toast component in favor of Sonner.
- **react-hot-toast**: Good but not the shadcn/ui standard

---

## R-004: Password Strength Calculation

**Decision**: Custom implementation (<20 lines)
**Rationale**: The spec requires exactly 4 levels based on simple rules (length, uppercase, number, special char). This is a straightforward scoring function — no need for zxcvbn's 40KB dictionary-based approach. Rules are explicitly defined: 8+ chars, uppercase, number, special char. Each rule = 1 point, 4 points = Strong.
**Alternatives considered**:
- **@zxcvbn-ts/core**: Excellent library (~40KB gzipped) but overkill for 4 explicit rules. Would be appropriate if we needed dictionary attack resistance, pattern detection, or i18n strength messages. Can be added later if requirements evolve.

---

## R-005: Auth Redirect Pattern (Next.js 16)

**Decision**: `proxy.ts` (Next.js 16's renamed middleware)
**Rationale**: Next.js 16 renamed `middleware.ts` → `proxy.ts` and the exported function from `middleware` → `proxy`. Runs on Node.js runtime (not Edge). Ideal for checking auth cookie existence before page load. Prevents flash of unauthenticated content.
**Pattern**:
- Create `frontend/proxy.ts` with exported `proxy()` function
- Check for session cookie existence (no JWT validation in proxy — keep lightweight)
- Redirect authenticated users from `/login`, `/register`, `/forgot-password` → `/dashboard`
- Redirect unauthenticated users from `/dashboard` → `/login`
- Matcher excludes `_next/static`, `_next/image`, API routes, public assets

---

## R-006: shadcn/ui Components to Install

**Decision**: Install via CLI: label, form, checkbox, separator, sonner
**Installation method**: `npx shadcn@latest add <component>` (with `--legacy-peer-deps` if npm)
**Components**:
- `label` — Form field labels, used by Form component
- `form` — React Hook Form + Zod integration wrapper (depends on label)
- `checkbox` — Terms agreement checkbox
- `separator` — Visual "or" divider between main form and social buttons
- `sonner` — Toast notifications

**Already available from design system**:
- `button` — Submit buttons (has loading state)
- `input` — Text inputs (has aria-invalid support)
- `card` — Could be used for form container
- `badge` — Social proof badge in decorative panel
- `glow-orbs` — Decorative panel animations

---

## R-007: Existing GlowOrbs Component Reuse

**Decision**: Reuse existing `GlowOrbs` component from design system with minor adaptation
**Rationale**: The decorative panel needs animated glow orbs. The existing `GlowOrbs` component at `components/ui/glow-orbs.tsx` already provides:
- 3 orbs with brand colors (#7C3AED, #2563EB, #06B6D4)
- Mouse-following parallax animation
- Float animation
- `prefers-reduced-motion` respect
**Adaptation needed**: The existing component uses `fixed inset-0` positioning. For the auth layout, we need it contained within the decorative panel (absolute positioning within the panel). Create a variant or pass className override.

---

## R-008: Package Manager

**Decision**: Use npm (project uses npm based on package-lock.json presence)
**Note**: For shadcn/ui CLI with React 19, use `--legacy-peer-deps` flag if peer dependency conflicts arise.
