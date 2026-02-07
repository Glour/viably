# Data Model: Data Hooks (React Query Integration)

**Feature Branch**: `016-data-hooks`
**Date**: 2026-02-07

---

## Query Keys Convention

Иерархическая структура ключей для дедупликации и гранулярной инвалидации:

```
user
├── user.me          → GET /api/users/me
└── user.credits     → GET /api/users/me/credits (или /api/credits/balance)

templates
├── templates.all    → GET /api/templates
└── templates.detail → GET /api/templates/{slug}

projects
├── projects.all     → GET /api/projects
├── projects.detail  → GET /api/projects/{id}
└── projects.recent  → GET /api/projects?per_page=3&page=1 (sorted by updated)

credits
├── credits.balance     → GET /api/credits/balance
├── credits.transactions → GET /api/credits/transactions
└── credits.dailyBonus  → GET /api/credits/daily-bonus
```

---

## Entities (Frontend Types)

### AuthUser (existing — `types/index.ts`)

```
AuthUser
├── id: string (UUID)
├── email: string
├── fullName: string | null
├── avatarUrl: string | null
├── plan: PlanType ("free" | "starter" | "pro" | "business")
├── credits: number
├── referralCode: string
├── isVerified: boolean
├── createdAt: string (ISO 8601)
└── lastLoginAt: string | null
```

Backend mapping: `full_name` → `fullName`, `avatar_url` → `avatarUrl`, etc.

### CreditBalance (new)

```
CreditBalance
├── credits: number
├── plan: string
└── dailyBonus: DailyBonusInfo | null
    ├── amount: number
    ├── claimedToday: boolean
    ├── nextAvailableAt: string | null
    └── streakDays: number
```

Backend mapping: `daily_bonus.claimed_today` → `dailyBonus.claimedToday`, etc.

### CreditTransaction (existing — needs update)

```
CreditTransaction
├── id: string (UUID)
├── amount: number
├── balanceAfter: number
├── transactionType: TransactionType
├── description: string | null
├── projectId: string | null
├── relatedUserId: string | null
├── extraData: Record<string, unknown>
└── createdAt: string (ISO 8601)
```

TransactionType: `"signup"` | `"daily_bonus"` | `"referral_bonus"` | `"purchase"` | `"refund"` | `"generation"` | `"rollover"` | `"admin_adjustment"`

Backend mapping: `balance_after` → `balanceAfter`, `transaction_type` → `transactionType`, etc.

### TransactionsPaginated (new)

```
TransactionsPaginated
├── transactions: CreditTransaction[]
└── meta: PaginationMeta
    ├── total: number
    ├── limit: number
    └── offset: number
```

### DailyBonusClaim (new)

```
DailyBonusClaim
├── claimed: boolean
├── amount: number
├── newBalance: number
└── nextAvailableAt: string
```

Backend mapping: `new_balance` → `newBalance`, `next_available_at` → `nextAvailableAt`

### Template (existing — needs update for backend fields)

```
Template (from API)
├── id: string (UUID)
├── name: string
├── slug: string
├── description: string
├── category: string
├── creditCost: number
├── previewImageUrl: string | null
├── features: string[]
├── tags: string[]
├── usageCount: number
├── configSchema: object | null        ← only in detail
├── exampleConfig: object | null       ← only in detail
└── createdAt: string (ISO 8601)
```

Backend mapping: `credit_cost` → `creditCost`, `preview_image_url` → `previewImageUrl`, `config_schema` → `configSchema`, `usage_count` → `usageCount`

**Note**: Frontend Template type has `configFields`, `isPopular`, `emoji` which don't exist in backend API. These were mock-only fields. Need adapter to bridge or update frontend types.

### Project (existing — needs update for backend fields)

```
Project (from API)
├── id: string (UUID)
├── userId: string (UUID)
├── name: string
├── description: string | null
├── templateId: string (UUID)
├── config: Record<string, unknown>
├── status: ProjectStatus
├── isPublic: boolean
├── createdAt: string (ISO 8601)
├── updatedAt: string | null
├── generatedCode: GeneratedCodeData | null  ← only in detail
│   ├── files: Record<string, string>
│   ├── entryPoint: string
│   └── runtime: string
├── generationLogs: string | null
├── aiModelUsed: string | null
├── errorMessage: string | null
├── deployedUrl: string | null
├── deployPlatform: string | null
├── generatedAt: string | null
└── deployedAt: string | null
```

ProjectStatus (backend): `"draft"` | `"generating"` | `"ready"` | `"deploying"` | `"deployed"` | `"error"`
ProjectStatus (frontend mapped): `"draft"` | `"generating"` | `"generated"` | `"deployed"` | `"failed"`

Backend mapping: `user_id` → `userId`, `template_id` → `templateId`, `is_public` → `isPublic`, `generated_code` → `generatedCode`, `generation_logs` → `generationLogs`, `ai_model_used` → `aiModelUsed`, `error_message` → `errorMessage`, `deployed_url` → `deployedUrl`, `deploy_platform` → `deployPlatform`, `generated_at` → `generatedAt`, `deployed_at` → `deployedAt`

Status mapping: `ready` → `generated`, `error` → `failed`

### ProjectsPaginated (new)

```
ProjectsPaginated
├── items: Project[]
├── total: number
├── page: number
├── perPage: number
└── pages: number
```

Backend mapping: `per_page` → `perPage`

### UpdateProfilePayload (new)

```
UpdateProfilePayload
├── fullName: string | null  → backend: full_name
└── avatarUrl: string | null → backend: avatar_url
```

### CreateProjectPayload (new)

```
CreateProjectPayload
├── name: string            → backend: name
├── description: string     → backend: description
├── templateId: string      → backend: template_id
└── config: Record<string, unknown> → backend: config
```

---

## Cache Configuration

| Query Group | staleTime | gcTime | retry |
|-------------|-----------|--------|-------|
| Default | 5 min | 10 min | 1 |
| Templates | 30 min | 60 min | 1 |
| Mutations | N/A | N/A | 0 |

---

## Invalidation Matrix

| Mutation | Invalidates |
|----------|-------------|
| updateProfile | `user.me` |
| claimDailyBonus | `credits.balance`, `credits.dailyBonus` |
| createProject | `projects.all`, `projects.recent` |
| deleteProject | `projects.all`, `projects.recent` |
| updateProject | `projects.detail(id)`, `projects.all` |
