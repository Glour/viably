# Data Model: Landing Page

**Feature**: 001-landing-page
**Date**: 2026-02-06
**Status**: Complete

## Overview

Landing page требует минимальную data model для отображения статичного контента. Все entities являются read-only конфигурацией и не требуют database persistence. Данные будут храниться как TypeScript constants или загружаться через простые API endpoints.

## Entities

### 1. Template Card

**Purpose**: Представление шаблона бота в секции Templates Preview.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique identifier | UUID or slug format |
| emoji | string | Yes | Emoji icon for visual representation | Single emoji character |
| name | string | Yes | Display name of template | 2-50 characters |
| costInCredits | number | Yes | Cost to use template in credits | Positive integer |
| category | string | No | Category for grouping (future use) | Enum or free text |

**Example**:
```typescript
{
  id: "greeting-bot",
  emoji: "👋",
  name: "Greeting Bot",
  costInCredits: 5,
  category: "utility"
}
```

**Relationships**: None (standalone entity)

**State**: Immutable (read-only configuration)

**Source**:
- Phase 1: Static TypeScript array in `lib/data/templates.ts`
- Phase 2+: API endpoint `/api/templates` (если нужна динамическая загрузка)

---

### 2. Pricing Plan

**Purpose**: Тарифный план для отображения в секции Pricing.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique identifier | Enum: "free", "starter", "pro" |
| name | string | Yes | Display name | e.g., "Free", "Starter", "Pro" |
| monthlyPrice | number | Yes | Price in rubles per month | Non-negative integer, 0 for free |
| yearlyPrice | number | Yes | Price in rubles per year | Non-negative integer, should be ~monthlyPrice * 12 * 0.8 |
| creditsPerMonth | number \| "unlimited" | Yes | Credits allocated per month | Positive integer or "unlimited" string |
| maxProjects | number \| "unlimited" | Yes | Maximum number of projects | Positive integer or "unlimited" string |
| features | string[] | Yes | List of features included | Array of feature descriptions |
| supportLevel | string | Yes | Support tier | e.g., "community", "priority", "custom" |
| popular | boolean | Yes | Whether to show "Popular" badge | Boolean flag |
| ctaLabel | string | Yes | Call-to-action button text | e.g., "Начать бесплатно", "Выбрать план" |
| ctaLink | string | Yes | URL for CTA button | e.g., "/register", "/pricing/starter" |

**Example**:
```typescript
{
  id: "pro",
  name: "Pro",
  monthlyPrice: 2990,
  yearlyPrice: 28704, // 2990 * 12 * 0.8
  creditsPerMonth: "unlimited",
  maxProjects: "unlimited",
  features: [
    "Unlimited credits",
    "Unlimited projects",
    "Custom deploy",
    "Priority support",
    "Advanced analytics"
  ],
  supportLevel: "priority",
  popular: true,
  ctaLabel: "Выбрать план",
  ctaLink: "/pricing/pro"
}
```

**Relationships**: None

**State**: Immutable (read-only configuration)

**Validation Rules**:
- `yearlyPrice` should be approximately `monthlyPrice * 12 * 0.8` (20% discount)
- If `popular === true`, plan should have visual distinction (gradient border, badge)
- `ctaLink` should be valid relative or absolute URL

**Source**: Static TypeScript array in `lib/data/pricing.ts`

---

### 3. Navigation Item

**Purpose**: Элемент навигации для header и footer.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique identifier | kebab-case string |
| label | string | Yes | Display text | 3-20 characters |
| href | string | Yes | Navigation target | URL or anchor (#features) |
| type | enum | Yes | Link type | "internal" \| "external" \| "anchor" |
| icon | string | No | Icon name (footer social links) | Lucide icon name |
| external | boolean | Yes | Opens in new tab | true for external links |

**Example**:
```typescript
{
  id: "features",
  label: "Features",
  href: "#features",
  type: "anchor",
  external: false
}
```

**Relationships**: Grouped into sections (Header, Footer columns)

**State**: Immutable

**Source**: Static TypeScript configuration in components

---

### 4. Landing Page Section

**Purpose**: Metadata для секций страницы (не data entity, а TypeScript type для компонентов).

**Attributes**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Section anchor ID (e.g., "hero", "how-it-works") |
| order | number | Yes | Render order (0 = top) |
| animationConfig | object | No | Motion animation settings |

**Not a database entity** - используется только для type safety в компонентах.

---

### 5. Glow Orb Configuration

**Purpose**: Конфигурация для glow orbs визуальных эффектов.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique identifier | e.g., "orb-purple", "orb-blue" |
| color | string | Yes | RGBA color value | CSS rgba() format |
| size | number | Yes | Diameter in pixels | 300-600 recommended |
| blurAmount | number | Yes | CSS blur filter value | 40-80px recommended |
| initialX | string | Yes | Initial X position | CSS position value (%, px) |
| initialY | string | Yes | Initial Y position | CSS position value (%, px) |
| parallaxFactor | number | Yes | Mouse movement multiplier | 0.1-0.5 for subtle effect |

**Example**:
```typescript
{
  id: "orb-purple",
  color: "rgba(139, 92, 246, 0.6)", // purple-500 with opacity
  size: 500,
  blurAmount: 60,
  initialX: "10%",
  initialY: "20%",
  parallaxFactor: 0.2
}
```

**Relationships**: None (3 orbs configured in Hero component)

**State**: Immutable configuration

**Source**: Inline TypeScript constants в `Hero.tsx`

---

## Type Definitions

All entities будут определены как TypeScript types/interfaces в shared types location.

**Location**: `types/landing.ts` (или `lib/types/landing.ts` if lib directory exists)

```typescript
// types/landing.ts

export interface TemplateCard {
  id: string
  emoji: string
  name: string
  costInCredits: number
  category?: string
}

export interface PricingPlan {
  id: 'free' | 'starter' | 'pro'
  name: string
  monthlyPrice: number
  yearlyPrice: number
  creditsPerMonth: number | 'unlimited'
  maxProjects: number | 'unlimited'
  features: string[]
  supportLevel: 'community' | 'priority' | 'custom'
  popular: boolean
  ctaLabel: string
  ctaLink: string
}

export type BillingPeriod = 'monthly' | 'yearly'

export interface NavigationItem {
  id: string
  label: string
  href: string
  type: 'internal' | 'external' | 'anchor'
  icon?: string
  external: boolean
}

export interface GlowOrbConfig {
  id: string
  color: string // rgba format
  size: number
  blurAmount: number
  initialX: string
  initialY: string
  parallaxFactor: number
}

export interface AnimationConfig {
  duration?: number
  delay?: number
  staggerDelay?: number
  viewport?: {
    once?: boolean
    amount?: number
  }
}
```

---

## Data Validation

### Zod Schemas

Для runtime validation данных (если будут загружаться из API):

```typescript
// lib/validations/landing.ts
import { z } from 'zod'

export const templateCardSchema = z.object({
  id: z.string().min(1),
  emoji: z.string().length(1), // Single emoji
  name: z.string().min(2).max(50),
  costInCredits: z.number().int().positive(),
  category: z.string().optional(),
})

export const pricingPlanSchema = z.object({
  id: z.enum(['free', 'starter', 'pro']),
  name: z.string(),
  monthlyPrice: z.number().int().nonnegative(),
  yearlyPrice: z.number().int().nonnegative(),
  creditsPerMonth: z.union([z.number().int().positive(), z.literal('unlimited')]),
  maxProjects: z.union([z.number().int().positive(), z.literal('unlimited')]),
  features: z.array(z.string()),
  supportLevel: z.enum(['community', 'priority', 'custom']),
  popular: z.boolean(),
  ctaLabel: z.string(),
  ctaLink: z.string().url().or(z.string().startsWith('/')),
})

export const navigationItemSchema = z.object({
  id: z.string(),
  label: z.string().min(3).max(20),
  href: z.string(),
  type: z.enum(['internal', 'external', 'anchor']),
  icon: z.string().optional(),
  external: z.boolean(),
})
```

---

## Mock Data (для разработки)

### Templates Mock Data

**Location**: `lib/data/templates.ts`

```typescript
import { TemplateCard } from '@/types/landing'

export const MOCK_TEMPLATES: TemplateCard[] = [
  {
    id: 'greeting-bot',
    emoji: '👋',
    name: 'Greeting Bot',
    costInCredits: 5,
    category: 'utility',
  },
  {
    id: 'support-bot',
    emoji: '💬',
    name: 'Support Bot',
    costInCredits: 10,
    category: 'support',
  },
  {
    id: 'quiz-bot',
    emoji: '❓',
    name: 'Quiz Bot',
    costInCredits: 8,
    category: 'entertainment',
  },
  {
    id: 'weather-bot',
    emoji: '🌤️',
    name: 'Weather Bot',
    costInCredits: 6,
    category: 'utility',
  },
  {
    id: 'reminder-bot',
    emoji: '⏰',
    name: 'Reminder Bot',
    costInCredits: 7,
    category: 'productivity',
  },
  {
    id: 'poll-bot',
    emoji: '📊',
    name: 'Poll Bot',
    costInCredits: 9,
    category: 'engagement',
  },
]
```

### Pricing Mock Data

**Location**: `lib/data/pricing.ts`

```typescript
import { PricingPlan } from '@/types/landing'

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    creditsPerMonth: 10,
    maxProjects: 2,
    features: [
      '10 credits per month',
      '2 active projects',
      'Community support',
      'Basic templates',
    ],
    supportLevel: 'community',
    popular: false,
    ctaLabel: 'Начать бесплатно',
    ctaLink: '/register',
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 990,
    yearlyPrice: 9504, // 990 * 12 * 0.8
    creditsPerMonth: 100,
    maxProjects: 10,
    features: [
      '100 credits per month',
      '10 active projects',
      'Priority support',
      'All templates',
      'Custom branding',
    ],
    supportLevel: 'priority',
    popular: false,
    ctaLabel: 'Выбрать план',
    ctaLink: '/pricing/starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 2990,
    yearlyPrice: 28704, // 2990 * 12 * 0.8
    creditsPerMonth: 'unlimited',
    maxProjects: 'unlimited',
    features: [
      'Unlimited credits',
      'Unlimited projects',
      'Custom deploy options',
      'Priority support',
      'Advanced analytics',
      'White-label solutions',
    ],
    supportLevel: 'custom',
    popular: true,
    ctaLabel: 'Выбрать план',
    ctaLink: '/pricing/pro',
  },
]
```

---

## Entity Relationships Diagram

```
┌─────────────────┐
│  TemplateCard   │
│  (standalone)   │
└─────────────────┘

┌─────────────────┐
│  PricingPlan    │
│  (standalone)   │
└─────────────────┘

┌─────────────────┐
│ NavigationItem  │
│  (standalone)   │
└─────────────────┘

┌─────────────────┐
│ GlowOrbConfig   │
│  (standalone)   │
└─────────────────┘

Note: No relationships between entities - all are independent configuration data
```

---

## Data Sources & Loading Strategy

### Phase 1: Static Data (MVP)

**Strategy**: All data defined as TypeScript constants, imported directly into components.

**Pros**:
- Zero latency (no API calls)
- Type-safe at compile time
- Easy to test
- Perfect for landing page (static content)

**Cons**:
- Requires deployment to update
- No A/B testing flexibility

**Implementation**:
```typescript
// In component
import { MOCK_TEMPLATES } from '@/lib/data/templates'
import { PRICING_PLANS } from '@/lib/data/pricing'
```

### Phase 2+: API Endpoints (Future)

**If dynamic loading needed**:

**Endpoints**:
- `GET /api/templates` - Return all templates
- `GET /api/pricing` - Return all pricing plans

**Benefits**:
- Runtime updates without deployment
- A/B testing capability
- Personalized pricing (future)

**Not needed for MVP** - static data sufficient для landing page.

---

## Storage Requirements

**Landing Page Data**:
- No database required
- No localStorage/sessionStorage needed (except pricing toggle preference - already in assumptions)
- All data in-memory (JavaScript constants)

**Pricing Toggle State**:
- Stored in: localStorage
- Key: `viably_pricing_period`
- Value: `"monthly"` | `"yearly"`
- Purpose: Remember user preference между visits

**Implementation**:
```typescript
// Pricing.tsx
const [period, setPeriod] = useState<BillingPeriod>(() => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('viably_pricing_period') as BillingPeriod) || 'monthly'
  }
  return 'monthly'
})

useEffect(() => {
  localStorage.setItem('viably_pricing_period', period)
}, [period])
```

---

## Data Migration

**N/A** - No database, no migrations needed.

If moving to API-based data in future:
1. Keep TypeScript types unchanged
2. Replace static imports with `fetch()` calls
3. Add loading states to components
4. Implement Zod validation for API responses

---

## Summary

**Total Entities**: 5 (3 core data entities + 2 configuration types)

**Storage**: In-memory TypeScript constants (no database)

**Validation**: Zod schemas for runtime safety

**Types Location**: `types/landing.ts`

**Data Location**: `lib/data/*.ts`

**Ready for**: Contract generation (API shapes if needed) and implementation
