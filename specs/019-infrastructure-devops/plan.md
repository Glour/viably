# Implementation Plan: Infrastructure & DevOps

**Branch**: `019-infrastructure-devops` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/019-infrastructure-devops/spec.md`

## Summary

Production deployment infrastructure for viably.dev: Docker containerization of the FastAPI backend, CI/CD pipeline via GitHub Actions, Vercel deployment for the Next.js frontend, Railway deployment for the backend/workers, Sentry error tracking, PostHog analytics, UptimeRobot monitoring, structured logging with structlog, environment validation, and database backup configuration. The approach prioritizes free-tier services for MVP launch with a clear upgrade path.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x (frontend)
**Primary Dependencies**: FastAPI 0.109+, Next.js 16.1.6, Sentry SDK, PostHog, structlog, @t3-oss/env-nextjs
**Storage**: PostgreSQL 16 (Railway managed), Redis (Railway managed)
**Testing**: pytest + pytest-asyncio (backend), Playwright (frontend), GitHub Actions CI
**Target Platform**: Railway (backend), Vercel (frontend), Linux containers
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Page load <3s, API health <500ms, deploy <10min
**Constraints**: Free-tier services for MVP, zero secrets in code, 99.5% uptime target
**Scale/Scope**: <5 team members, single production environment + preview deploys

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First | PASS | Full codebase exploration completed (backend, frontend, CI/CD) |
| II. Single Source of Truth | PASS | Environment config centralized in Settings (backend) and env.ts (frontend) |
| III. Library-First | PASS | All major components use established libraries (Sentry, PostHog, structlog, @t3-oss/env) |
| IV. Code Reuse & DRY | PASS | Reusing existing middleware (CORS, security headers, request ID), existing health endpoint |
| V. Strict Type Safety | PASS | TypeScript strict mode (frontend), mypy strict (backend), @t3-oss/env provides typed env |
| VI. Atomic Task Execution | PASS | Each task independently deployable and testable |
| VII. Quality Gates | PASS | CI pipeline enforces lint + type-check + test + build |
| VIII. Progressive Specification | PASS | Spec → Plan → Tasks → Implement flow followed |
| IX. Error Handling | PASS | Sentry captures all unhandled errors, structlog for structured error context |
| X. Observability | PASS | Sentry (errors), PostHog (events), structlog (logs), UptimeRobot (uptime), request ID correlation |
| XI. Accessibility | N/A | Infrastructure module, no UI components |

## Project Structure

### Documentation (this feature)

```text
specs/019-infrastructure-devops/
├── plan.md              # This file
├── research.md          # Phase 0: library & service research
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: setup & deploy guide
├── contracts/           # Phase 1: API contracts
│   └── health-api.yaml  # Health check endpoint contract
└── tasks.md             # Phase 2: task breakdown (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # MODIFY: add Sentry DSN, environment name
│   │   └── logging_config.py  # NEW: structlog configuration
│   └── main.py                # MODIFY: Sentry init, structured logging setup
├── Dockerfile                 # NEW: multi-stage production Docker image
├── Dockerfile.worker          # NEW: Celery worker Docker image
├── .dockerignore              # NEW: Docker build exclusions
└── pyproject.toml             # MODIFY: add sentry-sdk, structlog

frontend/
├── app/
│   ├── layout.tsx             # MODIFY: wrap with PostHogProvider
│   ├── error.tsx              # NEW: global error boundary
│   ├── global-error.tsx       # NEW: root error boundary
│   └── instrumentation.ts     # NEW: Sentry server instrumentation
├── lib/
│   ├── env.ts                 # NEW: @t3-oss/env-nextjs validation
│   ├── posthog.ts             # NEW: PostHog client init
│   └── analytics.ts           # NEW: analytics event helpers
├── components/
│   └── providers/
│       └── posthog-provider.tsx  # NEW: PostHog React provider
├── sentry.client.config.ts    # NEW: Sentry client config
├── sentry.server.config.ts    # NEW: Sentry server config
├── sentry.edge.config.ts      # NEW: Sentry edge config
├── next.config.ts             # MODIFY: withSentryConfig wrapper
├── package.json               # MODIFY: add @sentry/nextjs, posthog-js, @t3-oss/env-nextjs
└── .env.example               # MODIFY: add Sentry DSN, PostHog key

.github/
└── workflows/
    └── ci.yml                 # NEW: CI pipeline (lint, type-check, test, build)

docker-compose.yml             # MODIFY: add Redis service, backend service
backend/.env.example           # NEW: backend env var template
```

**Structure Decision**: Web application structure (backend + frontend) matching existing project layout. No new directories — only new files within existing structure and `.github/workflows/`.

## Complexity Tracking

No constitution violations. All decisions follow existing patterns and use established libraries.

## Task Breakdown (High-Level)

### Phase A: Docker & Environment (P1 — Production Deployment Foundation)

| # | Task | FR Coverage | Dependencies |
|---|------|-------------|--------------|
| T1 | Create backend Dockerfile (multi-stage, python:3.12-slim) | FR-001, FR-002 | None |
| T2 | Create Celery worker Dockerfile | FR-023 | T1 |
| T3 | Create .dockerignore for backend | — | T1 |
| T4 | Update docker-compose.yml (add Redis, backend, worker services) | FR-024 | T1, T2 |
| T5 | Create backend/.env.example with all required vars | FR-018 | None |
| T6 | Add environment validation (@t3-oss/env-nextjs) to frontend | FR-018 | None |
| T7 | Update frontend/.env.example with production vars | FR-018 | T6 |

### Phase B: CI/CD Pipeline (P2 — Automated Deployment)

| # | Task | FR Coverage | Dependencies |
|---|------|-------------|--------------|
| T8 | Create .github/workflows/ci.yml (lint, type-check, test, build) | FR-006, FR-008 | T5, T7 |
| T9 | Configure Vercel GitHub integration settings (documented) | FR-007, FR-009 | T8 |
| T10 | Configure Railway GitHub integration settings (documented) | FR-007 | T8 |

### Phase C: Error Tracking & Monitoring (P3)

| # | Task | FR Coverage | Dependencies |
|---|------|-------------|--------------|
| T11 | Add Sentry to backend (sentry-sdk[fastapi], init in main.py) | FR-010 | T5 |
| T12 | Add Sentry to frontend (@sentry/nextjs, config files, instrumentation) | FR-010 | T6 |
| T13 | Add global error boundaries (app/error.tsx, app/global-error.tsx) | FR-010 | T12 |
| T14 | Add structlog to backend (logging_config.py, replace basic logging) | FR-022 | T11 |
| T15 | Configure UptimeRobot monitors (documented) | FR-011, FR-012 | None |

### Phase D: Analytics (P5)

| # | Task | FR Coverage | Dependencies |
|---|------|-------------|--------------|
| T16 | Add PostHog to frontend (posthog-js, provider, analytics helpers) | FR-016 | T6 |
| T17 | Add event tracking to key user flows | FR-016, FR-017 | T16 |

### Phase E: Security Hardening & Documentation (P4)

| # | Task | FR Coverage | Dependencies |
|---|------|-------------|--------------|
| T18 | Verify security headers, rate limiting, cookie flags in production config | FR-019, FR-020, FR-021 | T5 |
| T19 | Document database backup configuration (Railway managed) | FR-013, FR-014, FR-015 | T10 |
| T20 | Create quickstart deployment guide | All | T8-T19 |

### Execution Model

- **T1, T5, T6**: Parallel (no dependencies)
- **T2, T3**: After T1
- **T4**: After T1, T2
- **T7**: After T6
- **T8**: After T5, T7 (needs env examples for CI)
- **T11, T12**: Parallel after respective env setup
- **T14**: After T11 (structlog + Sentry integration)
- **T16**: After T6
- **T17**: After T16

### Agent Assignment

| Task | Agent Type | Reason |
|------|-----------|--------|
| T1-T3 | deployment-engineer | Docker expertise |
| T4 | deployment-engineer | Docker Compose |
| T5, T7 | MAIN | Simple file creation |
| T6 | fullstack-nextjs-specialist | Next.js env validation |
| T8 | deployment-engineer | GitHub Actions CI/CD |
| T9-T10 | MAIN | Documentation only |
| T11, T14 | infrastructure-specialist | Backend Sentry + logging |
| T12-T13 | fullstack-nextjs-specialist | Frontend Sentry + error boundaries |
| T15 | MAIN | External service documentation |
| T16-T17 | fullstack-nextjs-specialist | PostHog integration |
| T18 | security-scanner | Security verification |
| T19-T20 | MAIN | Documentation |
