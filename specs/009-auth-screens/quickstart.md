# Quickstart: Auth Screens (009)

**Date**: 2026-02-06
**Feature**: 009-auth-screens

---

## Prerequisites

- Node.js 18+
- Design system (008-design-system) implemented
- `frontend/` project with Next.js 16, React 19, Tailwind CSS v4, shadcn/ui

## Setup

### 1. Install Dependencies

```bash
cd frontend

# Form handling + validation
npm install react-hook-form @hookform/resolvers zod

# Toast notifications
npm install sonner
```

### 2. Install shadcn/ui Components

```bash
cd frontend

npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add checkbox
npx shadcn@latest add separator
npx shadcn@latest add sonner
```

### 3. File Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Split layout (decorative + form)
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   ├── register/
│   │   │   └── page.tsx            # Registration page
│   │   └── forgot-password/
│   │       └── page.tsx            # Forgot password page
│   └── layout.tsx                  # Root layout (add Toaster)
├── components/
│   ├── auth/
│   │   ├── auth-decorative-panel.tsx  # Left panel with glow orbs + tagline
│   │   ├── social-login-buttons.tsx   # Google + GitHub buttons
│   │   └── password-strength.tsx      # Password strength indicator
│   └── ui/
│       ├── label.tsx               # shadcn/ui (new)
│       ├── form.tsx                # shadcn/ui (new)
│       ├── checkbox.tsx            # shadcn/ui (new)
│       ├── separator.tsx           # shadcn/ui (new)
│       └── sonner.tsx              # shadcn/ui (new)
├── lib/
│   ├── api/
│   │   └── auth.ts                 # Mock auth API functions
│   └── validations/
│       └── auth.ts                 # Zod schemas for auth forms
└── proxy.ts                        # Auth redirect proxy (Next.js 16)
```

### 4. Verification

```bash
cd frontend
npm run type-check    # TypeScript compilation
npm run build         # Next.js build
npm run dev           # Dev server → visit /login, /register, /forgot-password
```

## Key Patterns

### Form with react-hook-form + Zod
```typescript
// Use useWatch() instead of watch() for React 19 compatibility
const password = useWatch({ control: form.control, name: 'password' })
```

### Toast Notifications
```typescript
import { toast } from 'sonner'
toast.success('Account created!')
toast.error('Invalid credentials')
```

### Auth Redirect (proxy.ts)
```typescript
export function proxy(req: NextRequest) { /* ... */ }
export const config = { matcher: [...] }
```
