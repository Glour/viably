# Quickstart: E2E Testing & Polish

**Branch**: `018-testing-polish`
**Date**: 2026-02-08

## Prerequisites

- Node.js 18+
- Frontend dev server running (`cd frontend && npm run dev`)
- All previous modules (001-017) completed and merged

## Quick Setup

### 1. Install Dependencies

```bash
cd frontend

# Playwright (E2E testing)
npm init playwright@latest
# Choose: TypeScript, e2e/ directory, NO GitHub Actions, install browsers

# Bundle analyzer
npm install -D @next/bundle-analyzer
```

### 2. Run E2E Tests

```bash
cd frontend

# Run all tests
npx playwright test

# Run specific suite
npx playwright test e2e/auth.spec.ts

# Run with UI mode (visual debugging)
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed

# View HTML report
npx playwright show-report
```

### 3. Bundle Analysis

```bash
cd frontend

# Generate bundle report (opens in browser)
ANALYZE=true npm run build
```

### 4. Type Check

```bash
cd frontend
npm run type-check
```

### 5. Production Build Test

```bash
cd frontend
npm run build
npm run start
# Then run Lighthouse in Chrome DevTools
```

## Project Structure (new files)

```
frontend/
├── e2e/                          # Playwright E2E tests
│   ├── auth.spec.ts              # Auth flow tests
│   ├── generation.spec.ts        # Template → Generate flow tests
│   ├── deploy.spec.ts            # Deploy flow tests
│   ├── credits.spec.ts           # Credits flow tests
│   ├── responsive.spec.ts        # Responsive behavior tests
│   └── fixtures/                 # Test data and helpers
│       ├── mock-data.ts          # Mock API responses
│       └── test-helpers.ts       # Common test utilities
├── playwright.config.ts          # Playwright configuration
├── app/
│   ├── robots.ts                 # SEO: robots.txt handler
│   ├── sitemap.ts                # SEO: sitemap.xml handler
│   ├── layout.tsx                # Updated: enhanced metadata
│   ├── (auth)/
│   │   ├── login/page.tsx        # Updated: added metadata
│   │   ├── register/page.tsx     # Updated: added metadata
│   │   └── forgot-password/page.tsx # Updated: added metadata
│   ├── dashboard/page.tsx        # Updated: added metadata
│   ├── templates/
│   │   ├── page.tsx              # Updated: added metadata
│   │   └── [slug]/page.tsx       # Updated: generateMetadata
│   ├── projects/
│   │   ├── page.tsx              # Updated: added metadata
│   │   ├── [id]/page.tsx         # Updated: added metadata
│   │   └── [id]/generate/page.tsx # Updated: added metadata
│   └── (main)/settings/
│       ├── profile/page.tsx      # Updated: added metadata
│       ├── theme/page.tsx        # Updated: added metadata
│       ├── billing/page.tsx      # Updated: added metadata
│       └── plan/page.tsx         # Updated: added metadata
├── components/
│   └── ui/
│       └── glow-orbs.tsx         # Updated: mobile disable
└── next.config.ts                # Updated: bundle analyzer wrapper
```

## Key Decisions

1. **Playwright** for E2E (not Cypress) — WebSocket mocking, multi-browser, Next.js official recommendation
2. **robots.ts + sitemap.ts** (not static files) — Next.js 16 built-in support
3. **Chromium-only** for MVP E2E — faster, sufficient for regression detection
4. **Dev server** for tests — faster startup than production build
5. **API mocking via Playwright** (not MSW) — simpler, no additional dependency
