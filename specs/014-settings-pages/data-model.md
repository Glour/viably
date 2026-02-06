# Data Model: Settings Pages

**Feature**: 014-settings-pages
**Date**: 2026-02-06

---

## New Types (add to `types/index.ts`)

### Settings Navigation

```typescript
// Settings section identifiers
export type SettingsSection = "profile" | "billing" | "plan" | "theme"
```

### Profile Settings

```typescript
// Profile update form data
export interface ProfileFormData {
  name: string
  avatarFile: File | null
  avatarPreview: string | null // data URL for preview
}

// Password change form data
export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
```

### Billing & Credits

```typescript
// Transaction type for history
export type TransactionType = "earned" | "spent" | "purchased"

// Transaction filter options
export type TransactionFilter = "all" | "earned" | "spent" | "purchased"

// Single credit transaction
export interface CreditTransaction {
  id: string
  amount: number // positive for credit, negative for debit
  type: TransactionType
  description: string
  createdAt: string // ISO timestamp
}

// Credit purchase package
export interface CreditPackage {
  id: string
  credits: number
  price: number // in rubles
  badge: string | null // "popular" | "best value" | null
}
```

### Plan Settings

```typescript
// Subscription plan tier
export type PlanTier = "free" | "starter" | "pro" | "business" | "enterprise"

// Subscription plan definition
export interface SubscriptionPlan {
  id: string
  name: string
  tier: PlanTier
  price: number | null // null for enterprise (contact us)
  period: "month" | "year" | null
  features: string[]
  projectLimit: number | null // null for unlimited
  creditsPerMonth: number | null // null for unlimited
  isPopular: boolean
}

// User's current plan info
export interface UserPlanInfo {
  plan: SubscriptionPlan
  usage: {
    projectsUsed: number
    creditsRemaining: number
  }
  renewalDate: string | null // ISO date, null for free plan
}
```

### Theme Settings

```typescript
// Theme mode options
export type ThemeMode = "light" | "dark" | "system"
```

### Settings Store

```typescript
export interface SettingsStoreState {
  // Profile
  profile: UserProfile | null
  isLoadingProfile: boolean
  isSavingProfile: boolean

  // Billing
  transactions: CreditTransaction[]
  transactionFilter: TransactionFilter
  isLoadingTransactions: boolean
  hasMoreTransactions: boolean

  // Plan
  currentPlan: UserPlanInfo | null
  availablePlans: SubscriptionPlan[]
  isLoadingPlan: boolean

  // Actions - Profile
  loadProfile: () => Promise<void>
  updateProfile: (data: { name: string; avatarFile: File | null }) => Promise<boolean>
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<boolean>

  // Actions - Billing
  loadTransactions: () => Promise<void>
  loadMoreTransactions: () => Promise<void>
  setTransactionFilter: (filter: TransactionFilter) => void

  // Actions - Plan
  loadPlan: () => Promise<void>

  // Computed
  getFilteredTransactions: () => CreditTransaction[]
}
```

### API Response Types

```typescript
export type UpdateProfileResponse =
  | { success: true; user: UserProfile }
  | { success: false; error: string }

export type ChangePasswordResponse =
  | { success: true }
  | { success: false; error: string }

export type TransactionsResponse =
  | { success: true; transactions: CreditTransaction[]; hasMore: boolean }
  | { success: false; error: string }

export type UserPlanResponse =
  | { success: true; planInfo: UserPlanInfo; availablePlans: SubscriptionPlan[] }
  | { success: false; error: string }
```

---

## Existing Types Reused (no changes)

| Type | Location | Reused For |
|------|----------|------------|
| `UserProfile` | `types/index.ts` | Profile data (name, email, plan, credits) |
| `NavItem` | `types/index.ts` | Settings sidebar navigation items |
| `DailyBonusState` | `types/index.ts` | Daily bonus info on billing page |

---

## State Transitions

### Profile Save Flow

```
IDLE ──[updateProfile]──> SAVING ──[success]──> IDLE (toast: success)
                                  │
                                  └──[error]──> IDLE (toast: error)
```

### Password Change Flow

```
IDLE ──[changePassword]──> SAVING ──[success]──> IDLE (clear fields + toast: success)
                                   │
                                   └──[error]──> IDLE (toast: error, fields preserved)
```

### Transaction Loading Flow

```
EMPTY ──[loadTransactions]──> LOADING ──[success]──> LOADED
                                                       │
                                              [loadMoreTransactions]
                                                       │
                                                    LOADING_MORE ──[success]──> LOADED (appended)
                                                                    │
                                                                    └──[no more]──> LOADED (hasMore=false)
```

---

## Default Values

```typescript
const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "pkg-50", credits: 50, price: 490, badge: null },
  { id: "pkg-100", credits: 100, price: 890, badge: "popular" },
  { id: "pkg-250", credits: 250, price: 1990, badge: "best value" },
]

const AVAILABLE_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-free",
    name: "Free",
    tier: "free",
    price: 0,
    period: "month",
    features: [
      "3 projects",
      "5 credits/day (daily bonus)",
      "Basic templates",
      "Community support",
    ],
    projectLimit: 3,
    creditsPerMonth: 50,
    isPopular: false,
  },
  {
    id: "plan-starter",
    name: "Starter",
    tier: "starter",
    price: 990,
    period: "month",
    features: [
      "10 projects",
      "100 credits/month",
      "All templates",
      "Priority support",
      "Custom branding",
    ],
    projectLimit: 10,
    creditsPerMonth: 100,
    isPopular: false,
  },
  {
    id: "plan-pro",
    name: "Pro",
    tier: "pro",
    price: 2490,
    period: "month",
    features: [
      "Unlimited projects",
      "500 credits/month",
      "All templates + early access",
      "Priority support",
      "Custom branding",
      "API access",
    ],
    projectLimit: null,
    creditsPerMonth: 500,
    isPopular: true,
  },
  {
    id: "plan-business",
    name: "Business",
    tier: "business",
    price: 7990,
    period: "month",
    features: [
      "Unlimited projects",
      "2000 credits/month",
      "All templates + early access",
      "Dedicated support",
      "Custom branding",
      "API access",
      "Team management",
      "Analytics dashboard",
    ],
    projectLimit: null,
    creditsPerMonth: 2000,
    isPopular: false,
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    tier: "enterprise",
    price: null,
    period: null,
    features: [
      "Everything in Business",
      "Unlimited credits",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
      "On-premise deployment",
    ],
    projectLimit: null,
    creditsPerMonth: null,
    isPopular: false,
  },
]

const INITIAL_SETTINGS: Partial<SettingsStoreState> = {
  profile: null,
  isLoadingProfile: false,
  isSavingProfile: false,
  transactions: [],
  transactionFilter: "all",
  isLoadingTransactions: false,
  hasMoreTransactions: true,
  currentPlan: null,
  availablePlans: AVAILABLE_PLANS,
  isLoadingPlan: false,
}
```

---

## Data Flow

```
UserProfile (from dashboard store OR settings API)
  │
  ├── name, email, avatar → Profile Form
  ├── credits → Billing page balance display
  └── plan → Plan page current plan

Settings Store
  │
  ├── profile → Profile page (name, email, avatar)
  ├── transactions → Transaction history list
  │     └── transactionFilter → Filtered list
  ├── currentPlan → Current plan card
  └── availablePlans → Plan comparison cards

DailyBonusState (from daily-bonus store)
  │
  └── streak, todayReward → Billing page daily bonus info

ThemeMode (from next-themes, NOT from settings store)
  │
  └── useTheme() → Theme settings page
```

---

## Validation Schemas (add to `lib/validations/settings.ts`)

```typescript
import { z } from "zod"

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const customCreditsSchema = z.object({
  amount: z
    .number()
    .min(10, "Minimum 10 credits")
    .max(10000, "Maximum 10000 credits"),
})

export type ProfileFormData = z.infer<typeof profileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type CustomCreditsFormData = z.infer<typeof customCreditsSchema>
```
