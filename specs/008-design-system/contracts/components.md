# Component API Contracts: Design System

**Feature Branch**: `008-design-system`
**Date**: 2026-02-06

## Overview

Контракты описывают публичный API каждого компонента дизайн-системы: props, variants, states, accessibility requirements.

---

## Base Components

### Button

**File**: `frontend/components/ui/button.tsx`
**Base**: shadcn/ui Button (Radix Slot pattern)

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| variant | `"default" \| "secondary" \| "ghost" \| "destructive" \| "outline"` | `"default"` | No | Visual variant |
| size | `"default" \| "sm" \| "lg" \| "icon"` | `"default"` | No | Size preset |
| asChild | `boolean` | `false` | No | Render as child element (Slot) |
| disabled | `boolean` | `false` | No | Disabled state |
| className | `string` | - | No | Additional CSS classes |
| children | `ReactNode` | - | Yes | Button content |

#### Visual Specifications

| Variant | Background | Text | Border | Hover | Active |
|---------|-----------|------|--------|-------|--------|
| default | gradient-main | white | none | translateY(-2px) + glow shadow | translateY(0) |
| secondary | surface | foreground | 1px border | border-primary + primary-subtle bg | - |
| ghost | transparent | foreground | none | muted bg | - |
| destructive | destructive | white | none | destructive/90 | - |
| outline | transparent | foreground | 1px border | accent bg | - |

| Size | Height | Padding | Font Size | Icon Size |
|------|--------|---------|-----------|-----------|
| sm | 32px | 12px 16px | 13px | 16px |
| default | 40px | 16px 24px | 14px | 18px |
| lg | 48px | 20px 32px | 16px | 20px |
| icon | 40px | 0 (centered) | - | 18px |

#### Accessibility

- `role="button"` (native)
- `aria-disabled` when disabled
- Focus visible ring: 2px offset, ring color
- Keyboard: Enter/Space to activate
- Min touch target: 44x44px on mobile

---

### Card

**File**: `frontend/components/ui/card.tsx`
**Base**: shadcn/ui Card

#### Components

| Component | Element | Default Classes |
|-----------|---------|----------------|
| Card | `<div>` | rounded-[16px], border, bg-card |
| CardHeader | `<div>` | flex flex-col, p-6 |
| CardTitle | `<h3>` | font-heading, font-semibold |
| CardDescription | `<p>` | text-muted-foreground, text-sm |
| CardContent | `<div>` | p-6, pt-0 |
| CardFooter | `<div>` | flex, p-6, pt-0 |

#### Hover Animation

```
transition: 400ms cubic-bezier(0.4, 0, 0.2, 1)
hover:
  transform: translateY(-4px)
  box-shadow: lg -> xl
  border-color: primary-subtle
  &::before (gradient top line):
    opacity: 0 -> 1
    background: gradient-main
    height: 2px
    border-radius: 16px 16px 0 0
```

#### Accessibility

- Semantic grouping (no role needed for non-interactive cards)
- If clickable: `role="link"` or wrap in `<a>`, keyboard navigable

---

### Input

**File**: `frontend/components/ui/input.tsx`
**Base**: shadcn/ui Input

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| type | `string` | `"text"` | No | Input type |
| placeholder | `string` | - | No | Placeholder text |
| disabled | `boolean` | `false` | No | Disabled state |
| className | `string` | - | No | Additional CSS classes |

#### Visual Specifications

| State | Border | Background | Shadow |
|-------|--------|-----------|--------|
| default | 1.5px border | background | none |
| hover | border-muted-foreground/30 | background | none |
| focus | border-primary | background | 0 0 0 4px primary-subtle |
| disabled | border opacity 50% | muted | none |
| error | border-destructive | background | 0 0 0 4px destructive/10 |

| Property | Value |
|----------|-------|
| Height | 40px (default), 32px (sm), 48px (lg) |
| Border radius | 12px |
| Padding | 12px 16px |
| Font size | 14px |
| Transition | 300ms ease |

#### Accessibility

- `<input>` native element
- Associated `<label>` via htmlFor/id
- `aria-invalid` for error state
- `aria-describedby` for error message
- Focus ring visible

---

### Badge

**File**: `frontend/components/ui/badge.tsx`
**Base**: shadcn/ui Badge

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| variant | `"default" \| "secondary" \| "success" \| "warning" \| "outline"` | `"default"` | No | Visual variant |
| className | `string` | - | No | Additional CSS classes |
| children | `ReactNode` | - | Yes | Badge content |

#### Visual Specifications

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| default | primary | primary-foreground | none |
| secondary | secondary | secondary-foreground | none |
| success | emerald-500/10 | emerald-600 (light) / emerald-400 (dark) | none |
| warning | amber-500/10 | amber-600 (light) / amber-400 (dark) | none |
| outline | transparent | foreground | 1px border |

| Property | Value |
|----------|-------|
| Border radius | 100px (pill) |
| Padding | 2px 10px |
| Font size | 13px |
| Font weight | 600 |
| Height | auto (inline) |

---

## Layout Components

### Navbar

**File**: `frontend/components/layout/navbar.tsx`

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| className | `string` | - | No | Additional CSS classes |

#### Structure

```
<nav> (sticky top-0, z-50)
├── Glass backdrop (blur(24px) saturate(180%), semi-transparent bg)
├── Container (max-w-[1280px], mx-auto, px-6)
│   ├── Left: Logo
│   │   ├── Icon "V" (gradient text)
│   │   └── "Viably" (Space Grotesk 700)
│   ├── Center: Nav Tabs (desktop only, hidden <768px)
│   │   ├── Tab: "Дашборд" (/dashboard)
│   │   ├── Tab: "Шаблоны" (/templates)
│   │   └── Tab: "Проекты" (/projects)
│   └── Right: Actions
│       ├── Credits Badge (gem icon + number, gradient bg)
│       ├── Theme Toggle (sun/moon icon)
│       ├── User Avatar + Dropdown
│       └── Hamburger Menu (mobile only, visible <768px)
```

#### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| >= 768px | Full navbar: logo + tabs + credits + avatar |
| < 768px | Logo + hamburger. Tabs in mobile menu overlay |

#### Accessibility

- `<nav>` with `aria-label="Main navigation"`
- Active tab: `aria-current="page"`
- Keyboard: Tab through items, Enter to activate
- Mobile menu: `aria-expanded`, `aria-controls`, focus trap

---

### MainLayout

**File**: `frontend/components/layout/main-layout.tsx`

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| children | `ReactNode` | - | Yes | Page content |
| sidebar | `ReactNode` | - | No | Optional sidebar content |

#### Structure

```
<div> (min-h-screen)
├── <Navbar />
├── <main> (flex)
│   ├── [<Sidebar />] (optional, 280-360px)
│   └── <div> (flex-1, max-w-[1280px], mx-auto, px-6, py-8)
│       └── {children}
```

---

### Sidebar

**File**: `frontend/components/layout/sidebar.tsx`

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| children | `ReactNode` | - | Yes | Sidebar content |
| className | `string` | - | No | Additional CSS classes |

#### Specifications

| Property | Value |
|----------|-------|
| Width | 280px (collapsed: 0) |
| Max width | 360px |
| Background | surface |
| Border | right 1px border |
| Transition | 300ms ease (width) |
| Mobile | Full-width overlay with backdrop |

#### State

- Uses zustand SidebarState store
- Collapse button toggles `isOpen`
- Mobile: auto-close on navigation

---

## Animation Components

### GlowOrbs

**File**: `frontend/components/ui/glow-orbs.tsx`

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| className | `string` | - | No | Additional CSS classes |
| count | `number` | `3` | No | Number of orbs |

#### Behavior

- Fixed position, z-index: -1 (behind content)
- 3 orbs: primary (#7C3AED), blue (#2563EB), cyan (#06B6D4)
- Each: blur(80px), size 200-400px
- Float animation: 8s ease-in-out infinite (translateY +/-10px)
- Mouse tracking: follow cursor with 0.8s spring delay (motion useSpring)
- Opacity: 0.08 (light) / 0.15 (dark)
- **prefers-reduced-motion**: static position, no animation

---

### Shimmer

**File**: `frontend/components/ui/shimmer.tsx`

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| className | `string` | - | No | Additional CSS classes |
| width | `string` | `"100%"` | No | Element width |
| height | `string` | `"1rem"` | No | Element height |

#### Behavior

- Muted background with gradient sweep animation
- Gradient: transparent -> muted-foreground/10 -> transparent
- Animation: 1.5s linear infinite
- **prefers-reduced-motion**: static muted background, no sweep

---

### FadeInUp

**File**: `frontend/components/motion/fade-in-up.tsx`

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| children | `ReactNode` | - | Yes | Content to animate |
| className | `string` | - | No | Additional CSS classes |
| delay | `number` | `0` | No | Animation delay (seconds) |

#### Behavior

- Uses motion `useInView` hook
- Initial: opacity 0, translateY 20px
- Animate: opacity 1, translateY 0
- Duration: 0.5s, once (no repeat)
- **prefers-reduced-motion**: instant render, no animation
