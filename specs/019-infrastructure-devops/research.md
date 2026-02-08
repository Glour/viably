# Research: Infrastructure & DevOps

**Feature Branch**: `019-infrastructure-devops`
**Date**: 2026-02-08

## R1: Error Tracking — Sentry

### Frontend: @sentry/nextjs

- **Decision**: `@sentry/nextjs` v10.38+
- **Rationale**: Industry standard, 2.5M weekly downloads, full Next.js 16 App Router + React 19 support. Unified dashboard with backend.
- **Alternatives considered**:
  - Rollbar — smaller community, no unified frontend+backend dashboard
  - BugSnag — more expensive, less Next.js integration
  - LogRocket — session replay focus, not pure error tracking
- **Integration**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`

### Backend: sentry-sdk[fastapi]

- **Decision**: `sentry-sdk[fastapi]` v2.49+
- **Rationale**: 15.4M weekly downloads, native FastAPI integration, same dashboard as frontend
- **Alternatives considered**:
  - Rollbar — less ecosystem support for FastAPI
  - Custom logging to external service — more maintenance
- **Integration**: `sentry_sdk.init()` in app startup, automatic transaction/span capture

## R2: Structured Logging — structlog

- **Decision**: `structlog` v25.5+
- **Rationale**: 3.7M weekly downloads, seamless sentry-sdk integration (loguru breaks Sentry), async support, JSON output, correlation IDs via contextvars
- **Alternatives considered**:
  - loguru — easier API but incompatible with sentry-sdk log capture
  - python-json-logger — less feature-rich, no built-in context binding
- **Integration**: Configure in `app/core/logging.py`, bind `request_id` from middleware

## R3: Analytics — PostHog

- **Decision**: `posthog-js` v1.342+ (frontend) + PostHog Cloud
- **Rationale**: 2.6M weekly downloads, 1M events/month free (vs Plausible $9/month), all-in-one (analytics + session replay + feature flags), GDPR-compliant EU hosting
- **Alternatives considered**:
  - Plausible — privacy-friendly but limited custom events, no funnel builder on free tier
  - Vercel Analytics — no custom events, basic pageview tracking only
  - Mixpanel — expensive at scale, limited free tier
- **Integration**: `PostHogProvider` wrapper in layout, `posthog.capture()` for custom events

## R4: Uptime Monitoring — UptimeRobot

- **Decision**: UptimeRobot Free Tier
- **Rationale**: 50 monitors free (vs BetterStack 10), 5-min intervals adequate for MVP, email + webhook alerts
- **Alternatives considered**:
  - BetterStack (Better Uptime) — better UI but 10 monitors free, more expensive paid tier
  - Checkly — developer-focused but complex setup for simple uptime checks
- **Configuration**: Monitor `viably.dev` + `api.viably.dev/health`, alert via email + Telegram webhook

## R5: Environment Validation (Frontend) — @t3-oss/env-nextjs

- **Decision**: `@t3-oss/env-nextjs` v0.13+
- **Rationale**: 577K weekly downloads, Next.js-optimized (handles client/server bundling), built on Zod, TypeScript autocomplete
- **Alternatives considered**:
  - Manual Zod validation — doesn't handle Next.js bundling edge cases (tree-shaking server vars from client)
  - envalid — not Next.js-aware, no client/server separation
- **Integration**: `env.ts` file with `createEnv()`, import throughout app

## R6: Docker Base Image — python:3.12-slim

- **Decision**: `python:3.12-slim`
- **Rationale**: 50x faster builds than Alpine (wheel compatibility, no recompilation), recommended by FastAPI creator, ~150MB image size
- **Alternatives considered**:
  - python:3.12-alpine — musl libc breaks many Python wheels (asyncpg, bcrypt, etc.), requires build tools
  - python:3.12 — full Debian, ~900MB, unnecessarily large
- **Usage**: Multi-stage build with builder + runtime stages

## R7: Hosting Decisions

### Backend: Railway

- **Decision**: Railway for backend + Celery workers + Redis
- **Rationale**: GitHub integration for auto-deploy, managed PostgreSQL, managed Redis (Upstash alternative), Dockerfile-based deploy, $5/month hobby plan
- **Note**: Celery workers as separate Railway service sharing same codebase with different start command

### Frontend: Vercel

- **Decision**: Vercel for Next.js frontend
- **Rationale**: Zero-config Next.js 16 deployment, automatic preview deploys for PRs, edge CDN, free SSL, automatic HTTP→HTTPS redirect
- **Note**: `www` redirect configured via Vercel domain settings

## R8: CI/CD — GitHub Actions

- **Decision**: GitHub Actions with separate CI and deploy workflows
- **Rationale**: Native GitHub integration, free for public repos, generous free tier for private (2000 min/month), matrix builds
- **Workflow structure**:
  - `ci.yml`: lint + type-check + test on all PRs and pushes
  - Frontend deploy: automatic via Vercel GitHub integration
  - Backend deploy: automatic via Railway GitHub integration
- **Quality gates**: ESLint, tsc --noEmit, ruff, mypy, pytest, next build

## Cost Summary

| Service | Free Tier | Paid (post-MVP) |
|---------|-----------|-----------------|
| Sentry | 5K errors + 10K txns/mo | $26/mo (Team) |
| PostHog | 1M events/mo | Usage-based |
| UptimeRobot | 50 monitors | $8/mo (Pro) |
| Vercel | 100GB bandwidth | $20/mo (Pro) |
| Railway | $5 trial credit | ~$20-50/mo |
| GitHub Actions | 2000 min/mo | $0 (sufficient) |
| **Total** | **~$0-5/mo** | **~$74-104/mo** |
