# Research: E2E Testing & Polish

**Date**: 2026-02-08
**Branch**: `018-testing-polish`

## R1: E2E Testing Framework

**Decision**: Playwright
**Rationale**: Official recommendation from Next.js docs. Built-in WebSocket mocking (`page.routeWebSocket`), API mocking (`page.route`), multi-browser support (Chromium, Firefox, WebKit), native TypeScript support. Already integrated with Next.js via `webServer` config option.
**Alternatives considered**:
- Cypress — no built-in WebSocket mocking, heavier, Chromium-only for free tier
- Puppeteer — lower-level, no built-in test runner, no multi-browser
**Library**: `@playwright/test` (latest), devDependency

## R2: Bundle Analysis

**Decision**: `@next/bundle-analyzer`
**Rationale**: Official Next.js package. Wraps webpack-bundle-analyzer. Simple setup via `next.config.ts` wrapper. Enabled conditionally via `ANALYZE=true` env var.
**Alternatives considered**:
- `webpack-bundle-analyzer` directly — requires more configuration, `@next/bundle-analyzer` wraps it already
- `source-map-explorer` — less visual, less integrated with Next.js
**Library**: `@next/bundle-analyzer` (latest), devDependency

## R3: SEO Metadata Approach

**Decision**: Next.js built-in Metadata API + file-based route handlers
**Rationale**: Next.js 16 provides first-class support for `robots.ts` and `sitemap.ts` as file-based route handlers in the `app/` directory. These automatically generate `/robots.txt` and `/sitemap.xml` responses. Static `metadata` exports per page for titles/descriptions. `generateMetadata` for dynamic pages (templates/[slug]).
**Alternatives considered**:
- Static files in `public/` — less flexible, manual maintenance, not recommended by Next.js docs
- Third-party SEO libraries (next-seo) — unnecessary with built-in API
**Library**: None needed — built into Next.js 16

## R4: WebSocket Mocking in E2E Tests

**Decision**: Playwright native `page.routeWebSocket()`
**Rationale**: Built-in Playwright API for intercepting WebSocket connections. Supports: pattern matching (exact URL, wildcard `**`, regex), message handling, connection lifecycle (close, error), simulating server-initiated messages with setTimeout. Perfect fit for mocking generation flow WS messages.
**Alternatives considered**:
- Mock WS server (ws library) — more complex setup, harder to coordinate with tests
- Custom interceptor — reinventing the wheel
**Library**: None needed — built into Playwright

## R5: Performance Optimization Patterns

**Decision**: Leverage existing patterns + add `@next/bundle-analyzer` + conditional rendering
**Rationale**:
- Monaco Editor is **already lazy-loaded** via `next/dynamic` with `ssr: false` and Shimmer loading state
- Fonts are **already configured** with `display: "swap"` (Space Grotesk, Inter, JetBrains Mono)
- `useReducedMotion` hook **already exists** and is used by GlowOrbs and FadeInUp
- Remaining work: (1) add `useMediaQuery` check to conditionally hide GlowOrbs on mobile, (2) set up bundle analyzer, (3) run Lighthouse audit
**Library**: None needed for existing patterns

## R6: GlowOrbs Mobile Disable Pattern

**Decision**: Conditional render using Tailwind `md:` breakpoint or `useMediaQuery` hook
**Rationale**: GlowOrbs already respects `useReducedMotion()`. For mobile performance, need to not render GlowOrbs at all on viewports < 768px. Two approaches:
- CSS: `hidden md:block` wrapper — simplest, no JS, but still mounts component
- JS: `useMediaQuery('(min-width: 768px)')` — prevents component mount entirely
Prefer JS approach since GlowOrbs uses `useMotionValue`, `useSpring`, and `addEventListener` which consume resources even when hidden.
**Alternatives considered**:
- CSS-only hide — still mounts React component and JS listeners
- Remove GlowOrbs entirely — loses desktop visual effect

## R7: Existing Responsive Patterns

**Decision**: Continue existing Tailwind-based patterns
**Rationale**: Project already uses consistent responsive patterns:
- Navbar: `hidden md:flex` for desktop tabs, `md:hidden` for hamburger button
- Auth layout: `hidden md:block w-[45%]` for decorative panel
- Generation: `react-resizable-panels` for desktop, custom `MobileTabs` for mobile
- Templates: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Code viewer: JS-based `window.innerWidth < 640` check
All using Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px). Continue same patterns.

## R8: Test Data Strategy

**Decision**: API route mocking via Playwright `page.route()` + WebSocket mocking via `page.routeWebSocket()`
**Rationale**: The frontend uses `ky` HTTP client pointing to API endpoints. Playwright can intercept all HTTP requests and return mock JSON responses. WebSocket connections for generation flow can be mocked independently. No backend server required for E2E tests.
**Alternatives considered**:
- Running full backend (Python/FastAPI) — too complex for frontend E2E, adds failure modes
- MSW (Mock Service Worker) — adds another library, Playwright mocking is sufficient
- Fixture files — can be used in combination with route mocking

## R9: Playwright Project Configuration

**Decision**: Test against dev server, Chromium-only for MVP
**Rationale**: For MVP, testing on Chromium is sufficient to catch critical regressions. Multi-browser testing can be added later. Dev server (`next dev`) is faster to start than production build. `webServer` config in Playwright will auto-start the dev server.
**Alternatives considered**:
- Production build — more accurate but significantly slower build step
- Multi-browser — overkill for MVP, adds CI time
