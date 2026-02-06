# Quickstart: Settings Pages

**Feature**: 014-settings-pages
**Date**: 2026-02-06

---

## Prerequisites

- Node.js 18+
- Frontend dev server running (`npm run dev` in `/frontend`)
- Existing modules working: design system, auth screens, dashboard

## Setup

```bash
cd frontend

# No new dependencies to install!
# All required libraries are already in the project.
```

## File Structure (new files)

```
frontend/
├── app/(main)/settings/
│   ├── layout.tsx                          # Settings layout with sidebar
│   ├── page.tsx                            # Redirect to /settings/profile
│   ├── profile/
│   │   └── page.tsx                        # Profile settings page
│   ├── billing/
│   │   └── page.tsx                        # Billing & credits page
│   ├── plan/
│   │   └── page.tsx                        # Plan settings page
│   └── theme/
│       └── page.tsx                        # Theme settings page
├── components/settings/
│   ├── settings-sidebar.tsx                # Sidebar navigation
│   ├── profile-info-form.tsx               # Name + avatar form
│   ├── change-password-form.tsx            # Password change form
│   ├── credit-balance-card.tsx             # Balance display + buy button
│   ├── buy-credits-modal.tsx               # Credit packages modal
│   ├── transaction-history.tsx             # Transaction list + filters
│   ├── transaction-row.tsx                 # Single transaction entry
│   ├── current-plan-card.tsx               # Current plan info card
│   ├── plan-comparison.tsx                 # All plans grid
│   ├── plan-card.tsx                       # Single plan card
│   └── theme-selector.tsx                  # Theme radio cards with preview
├── lib/
│   ├── api/settings.ts                     # Mock API functions
│   ├── data/settings.ts                    # Mock data (transactions, plans)
│   └── validations/settings.ts             # Zod schemas for forms
├── stores/
│   └── settings.ts                         # Zustand settings store
└── types/
    └── index.ts                            # New types appended
```

## Dev Workflow

1. Navigate to the dashboard or any main page
2. Click the user avatar/profile button in the navbar
3. Settings page opens at `/settings/profile` by default
4. **Profile tab**: Change name, upload avatar, change password
5. **Billing tab**: View credit balance, buy credits modal, transaction history with filters
6. **Plan tab**: View current plan, compare plans, click upgrade
7. **Theme tab**: Select Light/Dark/System with live preview

## Routing

Settings pages use Next.js nested layouts under `app/(main)/settings/`:

| URL | Page | Description |
|-----|------|-------------|
| `/settings` | Redirect | Redirects to `/settings/profile` |
| `/settings/profile` | Profile | Name, avatar, password |
| `/settings/billing` | Billing | Credits, transactions |
| `/settings/plan` | Plan | Current plan, comparison |
| `/settings/theme` | Theme | Light/Dark/System picker |

The `(main)` route group shares `MainLayout` (Navbar + content container) with dashboard, projects, and templates.

## Key Integration Points

| Integration | Source | Usage |
|-------------|--------|-------|
| User profile | `useDashboardStore` / `lib/api/settings.ts` | Name, email, credits |
| Daily bonus | `useDailyBonusStore` | Streak, today's bonus |
| Theme | `next-themes` `useTheme()` | Current theme, setTheme |
| Password strength | `components/auth/password-strength.tsx` | Reused in change password form |
| UI components | `components/ui/*` | Form, Dialog, Card, Tabs, Button, Badge, Input |
| Animations | `components/motion/fade-in-up.tsx` | Entry animations |

## Testing

```bash
# Type check
npm run type-check

# Build
npm run build

# Dev server
npm run dev
```

Verify:
- [ ] `/settings` redirects to `/settings/profile`
- [ ] Sidebar navigation highlights active section
- [ ] Profile form saves name and shows toast
- [ ] Avatar upload shows preview
- [ ] Password strength indicator works
- [ ] Credit balance displays with gradient text
- [ ] Buy Credits modal shows packages
- [ ] Transaction history filters work
- [ ] Plan comparison highlights current plan
- [ ] Theme selector changes theme immediately
- [ ] Theme persists after page reload
- [ ] Mobile: horizontal tabs replace sidebar
