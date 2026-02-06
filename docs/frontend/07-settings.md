# Frontend Module: Settings

## Описание
Настройки пользователя: Profile, Billing/Credits, Plan, Theme. Sidebar navigation.

## Зависимости
- 01-design-system
- 02-auth-screens (user data)

## Сложность: Низкая
## Приоритет: P1 (Should)
## Estimated: 1 день

---

## Задачи

### Task 1: Settings Layout
**Файл:** `app/(main)/settings/layout.tsx`
**Описание:** Settings page с sidebar навигацией

**Layout:**
```
┌──────────────┬──────────────────────────────────┐
│  Settings    │  [Content area]                   │
│  sidebar     │                                   │
│  (220px)     │                                   │
│              │                                   │
│  [Profile]   │                                   │
│  [Billing]   │                                   │
│  [Plan]      │                                   │
│  [Theme]     │                                   │
└──────────────┴──────────────────────────────────┘
```

- Sidebar: nav links, active = primary bg subtle + primary text
- Mobile: horizontal tabs at top instead of sidebar

**Acceptance Criteria:**
- [ ] Sidebar navigation
- [ ] Active state
- [ ] Mobile horizontal tabs

### Task 2: Profile Settings
**Файл:** `app/(main)/settings/profile/page.tsx`

**Sections:**

**Profile Info:**
- Avatar upload (circle, click to change, drag-drop)
- Name input
- Email (readonly, grayed out)
- [Save Changes] button

**Change Password:**
- Current password
- New password (strength indicator)
- Confirm new password
- [Update Password] button

**Acceptance Criteria:**
- [ ] Avatar upload preview
- [ ] Form validation
- [ ] Password strength indicator
- [ ] Save/update states (loading, success toast, error)

### Task 3: Billing & Credits
**Файл:** `app/(main)/settings/billing/page.tsx`

**Sections:**

**Current Balance:**
- Large number: "💎 47 credits" (JetBrains Mono, 36px, gradient text)
- Plan badge: "STARTER"
- Daily bonus info: "+5 today (streak: 3 days)"
- [Купить кредиты →] gradient button

**Buy Credits Modal:**
- Packages: 
  - 50 credits — 490₽
  - 100 credits — 890₽ (popular badge)
  - 250 credits — 1990₽ (best value badge)
- Custom amount input
- Payment method (placeholder for MVP)

**Transaction History:**
- Table/list:
  - Amount (+/-), color coded (green +, red -)
  - Description (e.g., "Shop Bot generation", "Daily bonus", "Purchase")
  - Date/time (relative)
- Pagination or infinite scroll
- Filter: All / Earned / Spent / Purchased

**Acceptance Criteria:**
- [ ] Credit balance display
- [ ] Buy credits modal with packages
- [ ] Transaction history list
- [ ] Filters work

### Task 4: Plan Settings
**Файл:** `app/(main)/settings/plan/page.tsx`

**Current Plan Card:**
- Plan name + badge (gradient for paid)
- Features included
- Usage: X/Y projects, Z credits remaining
- Renewal date (if paid)

**Plan Comparison (pricing cards):**
- Same as landing page pricing
- Current plan highlighted
- Upgrade/downgrade buttons
- "Contact us" for Enterprise

**Acceptance Criteria:**
- [ ] Current plan highlighted
- [ ] Upgrade button (link to Stripe checkout for MVP)
- [ ] Plan features comparison

### Task 5: Theme Settings
**Файл:** `app/(main)/settings/theme/page.tsx`

**Options (radio cards):**
- ☀️ Light — "Clean and bright" (default)
- 🌙 Dark — "Easy on the eyes"
- 💻 System — "Match your OS preference"

**Preview:** Small preview card showing how each theme looks

**Implementation:** next-themes `setTheme()` call

**Acceptance Criteria:**
- [ ] Three theme options
- [ ] Preview cards
- [ ] Theme persists across sessions (localStorage via next-themes)
- [ ] Smooth transition (0.5s) when switching
