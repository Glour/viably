# Quickstart: Design System & Foundation

**Feature Branch**: `008-design-system`
**Date**: 2026-02-06

## Prerequisites

- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Git

## Setup

### 1. Clone and checkout branch

```bash
git checkout 008-design-system
cd frontend/
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Component preview

Open [http://localhost:3000/dev/components](http://localhost:3000/dev/components) to view all design system components in both themes.

## Environment

Create `frontend/.env.local`:

```bash
# API (not used in design system, but prepared for future modules)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
```

## Available Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run type-check   # TypeScript strict check (tsc --noEmit)
```

## File Structure

```
frontend/
├── app/
│   ├── globals.css          # Design tokens + Tailwind imports
│   ├── layout.tsx           # Root layout (ThemeProvider, fonts)
│   ├── page.tsx             # Home page
│   ├── fonts.ts             # Font declarations
│   └── dev/
│       └── components/
│           └── page.tsx     # Component preview (/dev/components)
├── components/
│   ├── ui/                  # Base components
│   │   ├── button.tsx       # Button (5 variants, 4 sizes)
│   │   ├── card.tsx         # Card (hover animation)
│   │   ├── input.tsx        # Input (focus ring)
│   │   ├── badge.tsx        # Badge (5 variants)
│   │   ├── glow-orbs.tsx    # Animated background
│   │   └── shimmer.tsx      # Loading skeleton
│   ├── layout/
│   │   ├── navbar.tsx       # Sticky glass navbar
│   │   ├── main-layout.tsx  # Page wrapper
│   │   └── sidebar.tsx      # Collapsible sidebar
│   └── motion/
│       └── fade-in-up.tsx   # Scroll animation
├── lib/
│   ├── utils.ts             # cn() helper
│   └── animations.ts        # Animation configs
├── stores/
│   └── theme.ts             # Sidebar state (zustand)
├── types/
│   └── index.ts             # Shared types
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── components.json          # shadcn/ui config
└── .env.example
```

## Usage Examples

### Using Button

```tsx
import { Button } from "@/components/ui/button"

// Primary (gradient)
<Button>Create Project</Button>

// Secondary
<Button variant="secondary">Cancel</Button>

// Ghost
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>

// Destructive
<Button variant="destructive">Delete</Button>
```

### Using Card with Hover Effect

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Template Name</CardTitle>
    <CardDescription>Brief description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content here</p>
  </CardContent>
</Card>
```

### Using Badge

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```

### Using Theme Toggle

```tsx
"use client"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}
```

### Using Layout

```tsx
import { MainLayout } from "@/components/layout/main-layout"

export default function DashboardPage() {
  return (
    <MainLayout>
      <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
      {/* page content */}
    </MainLayout>
  )
}
```

### Using Animations

```tsx
import { FadeInUp } from "@/components/motion/fade-in-up"
import { GlowOrbs } from "@/components/ui/glow-orbs"

function Page() {
  return (
    <>
      <GlowOrbs />
      <FadeInUp>
        <h2>This fades in on scroll</h2>
      </FadeInUp>
      <FadeInUp delay={0.2}>
        <p>This fades in 0.2s later</p>
      </FadeInUp>
    </>
  )
}
```

## Testing Checklist

After setup, verify:

- [ ] `npm run dev` starts without errors
- [ ] `/dev/components` page renders all components
- [ ] Theme toggle switches between light and dark
- [ ] OS dark mode preference is respected on first visit
- [ ] All components render correctly in both themes
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Glow orbs follow mouse with delay
- [ ] "Reduce motion" OS setting disables all animations
- [ ] Mobile view (<768px) shows hamburger menu
- [ ] `npm run build` succeeds
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes

## Common Issues

### Theme flicker on page load
Ensure `suppressHydrationWarning` is on `<html>` element in `layout.tsx`. next-themes injects a script to prevent this.

### Fonts not loading
Check `fonts.ts` imports and CSS variable references in `globals.css`. Verify `next/font/google` imports match the font names exactly.

### Tailwind classes not working
Ensure `postcss.config.mjs` has `@tailwindcss/postcss` plugin and `globals.css` starts with `@import "tailwindcss"`.

### shadcn/ui components not styled
Run `npx shadcn@latest init` if components.json is missing. Verify CSS variables are defined in globals.css.
