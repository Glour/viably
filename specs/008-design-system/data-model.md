# Data Model: Design System & Foundation

**Feature Branch**: `008-design-system`
**Date**: 2026-02-06

## Overview

Frontend design system не имеет БД-сущностей. Вместо database entities описываются:
- Design Token Schema (CSS custom properties)
- Component Interface Contracts (TypeScript props)
- Theme Configuration
- State Shape

---

## Design Token Schema

### Color Tokens (CSS Custom Properties)

Используем oklch color space для совместимости с shadcn/ui + дополнительные brand-специфичные токены.

#### shadcn/ui Standard Tokens (oklch)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | oklch(1 0 0) | oklch(0.141 0.005 285.82) | Page background |
| `--foreground` | oklch(0.141 0.005 285.82) | oklch(0.985 0 0) | Primary text |
| `--card` | oklch(1 0 0) | oklch(0.212 0.007 285.82) | Card background |
| `--card-foreground` | oklch(0.141 0.005 285.82) | oklch(0.985 0 0) | Card text |
| `--popover` | oklch(1 0 0) | oklch(0.212 0.007 285.82) | Popover bg |
| `--popover-foreground` | oklch(0.141 0.005 285.82) | oklch(0.985 0 0) | Popover text |
| `--primary` | oklch(0.541 0.281 293.009) | oklch(0.541 0.281 293.009) | Brand purple #7C3AED |
| `--primary-foreground` | oklch(0.985 0 0) | oklch(0.985 0 0) | Text on primary |
| `--secondary` | oklch(0.967 0.001 286.38) | oklch(0.274 0.006 286.03) | Secondary surfaces |
| `--secondary-foreground` | oklch(0.205 0.006 286) | oklch(0.985 0 0) | Secondary text |
| `--muted` | oklch(0.967 0.001 286.38) | oklch(0.274 0.006 286.03) | Muted surfaces |
| `--muted-foreground` | oklch(0.553 0.013 286) | oklch(0.705 0.015 286) | Muted text |
| `--accent` | oklch(0.967 0.001 286.38) | oklch(0.274 0.006 286.03) | Accent surfaces |
| `--accent-foreground` | oklch(0.205 0.006 286) | oklch(0.985 0 0) | Accent text |
| `--destructive` | oklch(0.577 0.245 27.325) | oklch(0.704 0.191 22.216) | Error/danger |
| `--border` | oklch(0.92 0.004 286) | oklch(0.274 0.006 286.03) | Borders |
| `--input` | oklch(0.92 0.004 286) | oklch(0.274 0.006 286.03) | Input borders |
| `--ring` | oklch(0.541 0.281 293.009) | oklch(0.541 0.281 293.009) | Focus rings |

#### Brand-Specific Tokens (hex, custom)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary-hover` | #6D28D9 | #6D28D9 | Primary hover state |
| `--primary-light` | #8B5CF6 | #8B5CF6 | Primary light variant |
| `--primary-subtle` | rgba(124,58,237,0.08) | rgba(124,58,237,0.15) | Primary subtle bg |
| `--primary-glow` | rgba(124,58,237,0.4) | rgba(124,58,237,0.5) | Glow effect |
| `--gradient-main` | linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%) | same | Main gradient |
| `--gradient-warm` | linear-gradient(135deg, #7C3AED 0%, #EC4899 100%) | same | Warm gradient |
| `--gradient-cool` | linear-gradient(135deg, #2563EB 0%, #06B6D4 100%) | same | Cool gradient |
| `--success` | #10B981 | #34D399 | Success states |
| `--warning` | #F59E0B | #FBBF24 | Warning states |
| `--info` | #2563EB | #3B82F6 | Info states |

---

### Spacing Scale

Tailwind CSS v4 default spacing (rem-based):

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 0.25rem (4px) | Minimal gaps |
| 2 | 0.5rem (8px) | Tight spacing |
| 3 | 0.75rem (12px) | Compact spacing |
| 4 | 1rem (16px) | Default spacing |
| 6 | 1.5rem (24px) | Section padding |
| 8 | 2rem (32px) | Large gaps |
| 12 | 3rem (48px) | Section margins |
| 16 | 4rem (64px) | Page sections |

---

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | 0.625rem (10px) | Base radius (shadcn/ui) |
| sm | calc(var(--radius) - 4px) | Small elements |
| md | calc(var(--radius) - 2px) | Medium elements |
| lg | var(--radius) | Default (cards, inputs) |
| xl | calc(var(--radius) + 4px) | Large elements |
| Component buttons | 12px | Button border-radius |
| Component cards | 16px | Card border-radius |
| Component badges | 100px | Pill shape |

---

### Shadow Scale

| Token | Light | Dark |
|-------|-------|------|
| sm | 0 1px 2px rgba(0,0,0,0.05) | 0 1px 2px rgba(0,0,0,0.3) |
| md | 0 4px 6px rgba(0,0,0,0.07) | 0 4px 6px rgba(0,0,0,0.4) |
| lg | 0 10px 15px rgba(0,0,0,0.1) | 0 10px 15px rgba(0,0,0,0.5) |
| glow | 0 0 40px var(--primary-glow) | 0 0 40px var(--primary-glow) |

---

### Transition Tokens

| Token | Value | Usage |
|-------|-------|-------|
| fast | 150ms ease | Hover states |
| default | 300ms ease | Button/input transitions |
| slow | 400ms cubic-bezier(0.4, 0, 0.2, 1) | Card hover, layout changes |
| spring | { type: "spring", stiffness: 300, damping: 30 } | motion spring |

---

## Component Interfaces

### Button

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
  loading?: boolean
}
```

**Variants mapping**:
- `default` = primary (gradient bg, white text)
- `secondary` = surface bg, border
- `ghost` = transparent, hover subtle bg
- `destructive` = danger (red bg)
- `outline` = bordered, transparent bg

**States**: default, hover, focus, disabled, loading

---

### Card

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
```

**Hover behavior**: translateY(-4px) + shadow increase + gradient top border (opacity 0->1)

---

### Input

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

**Focus behavior**: border-color primary + box-shadow 0 0 0 4px primary-subtle

---

### Badge

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "outline"
}
```

**Custom variants**: success (#10B981 bg), warning (#F59E0B bg)

---

## Theme Configuration

### ThemeProvider Config

```typescript
{
  attribute: "class",
  defaultTheme: "system",
  enableSystem: true,
  storageKey: "viably-theme",
  themes: ["light", "dark"],
  disableTransitionOnChange: false
}
```

### Theme State (next-themes)

```typescript
interface ThemeState {
  theme: "light" | "dark" | "system"   // User selection
  systemTheme: "light" | "dark"        // OS preference
  resolvedTheme: "light" | "dark"      // Actual rendered theme
  setTheme: (theme: string) => void
}
```

---

## Layout State

### Sidebar Store (zustand)

```typescript
interface SidebarState {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}
```

### Navbar State

```typescript
interface NavItem {
  label: string       // Russian label
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
  { label: "Шаблоны", href: "/templates", icon: FileTemplate },
  { label: "Проекты", href: "/projects", icon: FolderKanban },
]
```

---

## Animation Configuration

### Glow Orbs

```typescript
interface GlowOrb {
  size: number        // 200-400px
  color: string       // primary / blue / cyan
  opacity: number     // 0.08 (light) / 0.15 (dark)
  blur: number        // 80px
  delay: number       // 0.8s lag behind mouse
}
```

### Motion Variants

```typescript
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
  }
}
```

---

## Validation Rules

1. **Design tokens**: Все цвета через CSS variables, hardcoded values запрещены
2. **Theme completeness**: Каждый light token должен иметь dark counterpart
3. **Accessibility**: Contrast ratio >= 4.5:1 для normal text, >= 3:1 для large text
4. **Touch targets**: Minimum 44x44px для mobile interactive elements
5. **Reduced motion**: prefers-reduced-motion отключает ВСЕ анимации
6. **Font fallbacks**: system-ui для body, monospace для code при отсутствии custom fonts
