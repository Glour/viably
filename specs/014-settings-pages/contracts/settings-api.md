# API Contracts: Settings Pages

**Feature**: 014-settings-pages
**Date**: 2026-02-06
**Note**: For MVP, all APIs are mock implementations with simulated delays. Contracts define the interface for future backend integration.

---

## Mock API Functions (`lib/api/settings.ts`)

### getProfile

Fetches the current user's profile data.

```typescript
export async function getProfile(): Promise<UserProfileResponse>
```

**Mock behavior**: Returns mock `UserProfile` from dashboard data after 300ms delay.

---

### updateProfile

Updates user's display name and/or avatar.

```typescript
export async function updateProfile(data: {
  name: string
  avatarFile: File | null
}): Promise<UpdateProfileResponse>
```

**Mock behavior**: Returns `{ success: true, user: updatedUser }` after 500ms delay.

**Error cases**:
- Empty name: `{ success: false, error: "Name is required" }`

---

### changePassword

Changes user's password.

```typescript
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<ChangePasswordResponse>
```

**Mock behavior**: Returns `{ success: true }` after 500ms delay if currentPassword is not empty.

**Error cases**:
- Wrong current password: `{ success: false, error: "Current password is incorrect" }`
- Same as current: `{ success: false, error: "New password must be different from current password" }`

---

### getTransactions

Fetches credit transaction history with pagination.

```typescript
export async function getTransactions(params: {
  filter: TransactionFilter
  offset: number
  limit: number
}): Promise<TransactionsResponse>
```

**Mock behavior**: Returns sliced mock transactions array after 300ms delay. `hasMore` is `true` if more data available.

---

### getUserPlan

Fetches user's current plan and available plans.

```typescript
export async function getUserPlan(): Promise<UserPlanResponse>
```

**Mock behavior**: Returns mock plan info + all available plans after 300ms delay.

---

## Store Interface (`stores/settings.ts`)

See `data-model.md` for full `SettingsStoreState` interface.

Store is a state container with async actions for data fetching and mutations. No separate custom hook needed — store actions are sufficient for settings page complexity.

---

## Mock Data (`lib/data/settings.ts`)

### MOCK_TRANSACTIONS

```typescript
export const MOCK_TRANSACTIONS: CreditTransaction[] = [
  // 20-30 mock transactions spanning earned, spent, purchased types
  // Examples:
  { id: "tx-1", amount: 5, type: "earned", description: "Daily bonus", createdAt: "2026-02-06T09:00:00Z" },
  { id: "tx-2", amount: -15, type: "spent", description: "Shop Bot generation", createdAt: "2026-02-05T14:30:00Z" },
  { id: "tx-3", amount: 100, type: "purchased", description: "Credit purchase (100 pack)", createdAt: "2026-02-04T11:00:00Z" },
  // ... more entries
]
```

### MOCK_USER_PLAN

```typescript
export const MOCK_USER_PLAN: UserPlanInfo = {
  plan: AVAILABLE_PLANS[1], // Starter
  usage: {
    projectsUsed: 4,
    creditsRemaining: 47,
  },
  renewalDate: "2026-03-06",
}
```

### CREDIT_PACKAGES

```typescript
export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "pkg-50", credits: 50, price: 490, badge: null },
  { id: "pkg-100", credits: 100, price: 890, badge: "popular" },
  { id: "pkg-250", credits: 250, price: 1990, badge: "best value" },
]
```
