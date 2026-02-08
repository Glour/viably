# Tasks: Infrastructure & DevOps

**Input**: Design documents from `/specs/019-infrastructure-devops/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested in this feature specification. Test tasks omitted.

**Organization**: Tasks grouped by user story to enable independent implementation. No new database models — all entities are external services.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` (Python/FastAPI), `frontend/` (Next.js/TypeScript)

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements, creating necessary agents, and assigning executors.

- [ ] P001 Analyze all tasks and identify required agent types and capabilities
- [ ] P002 Create missing agents using meta-agent-v3 (launch N calls in single message, 1 per agent), then ask user restart
- [ ] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names
- [ ] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/)

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports, single npm install)
- **Existing agents**: ONLY if 100% capability match after thorough examination
- **Agent creation**: Launch all meta-agent-v3 calls in single message for parallel execution
- **After P002**: Must restart claude-code before proceeding to P003

**Artifacts**:
- Updated tasks.md with [EXECUTOR: name], [SEQUENTIAL]/[PARALLEL-GROUP-X] annotations
- .claude/agents/{domain}/{type}/{name}.md (if new agents created)
- research/*.md (if complex research identified)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create environment templates and validation — foundation for all subsequent phases.

- [x] T001 [P] Create backend environment template in `backend/.env.example` with all required vars from `backend/app/core/config.py` (DATABASE_URL, JWT_SECRET_KEY, ANTHROPIC_API_KEY, CELERY_BROKER_URL, CELERY_RESULT_BACKEND, CORS_ORIGINS, SENTRY_DSN, ENVIRONMENT, LOG_LEVEL, LOG_FORMAT, RAILWAY_API_TOKEN)
- [x] T002 [P] Add SENTRY_DSN, ENVIRONMENT, LOG_LEVEL, LOG_FORMAT fields to backend Settings class in `backend/app/core/config.py`
- [x] T003 [P] Install @t3-oss/env-nextjs and zod (if not present) in `frontend/package.json`, create environment validation in `frontend/lib/env.ts` with createEnv() for NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL, NEXT_PUBLIC_ENVIRONMENT, NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, NEXT_PUBLIC_SITE_URL, SENTRY_AUTH_TOKEN
- [x] T004 Update `frontend/.env.example` with all new production vars (NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, NEXT_PUBLIC_SITE_URL, SENTRY_AUTH_TOKEN)
- [x] T005 Replace direct `process.env` access with `env.*` imports throughout frontend: `frontend/lib/api/client.ts` (API_BASE_URL), `frontend/lib/hooks/use-generation.ts` (WS_URL), `frontend/app/sitemap.ts`, `frontend/app/robots.ts`

**Checkpoint**: Environment configuration is centralized and validated. All subsequent tasks can reference typed env vars.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Docker containerization and CI/CD — MUST be complete before production deployment stories.

- [x] T006 [P] Create multi-stage backend Dockerfile in `backend/Dockerfile` using python:3.12-slim (builder stage: install poetry + deps, runtime stage: copy wheels + app, CMD uvicorn, expose 8000)
- [x] T007 [P] Create Celery worker Dockerfile in `backend/Dockerfile.worker` (same base as T006, CMD celery -A app.ai.worker worker --loglevel=info)
- [x] T008 [P] Create `backend/.dockerignore` (exclude .git, __pycache__, .env, tests/, .venv, *.pyc, .mypy_cache, .ruff_cache)
- [x] T009 Update `docker-compose.yml` to add Redis service (redis:7-alpine, port 6379, healthcheck), backend service (build from backend/Dockerfile, depends_on postgres+redis, env_file backend/.env), worker service (build from backend/Dockerfile.worker, depends_on postgres+redis, env_file backend/.env)
- [x] T010 Create `.github/workflows/ci.yml` with: trigger on push/PR to main, jobs: backend (ruff check, mypy, pytest with SQLite), frontend (eslint, tsc --noEmit, next build), use matrix strategy, cache pip and node_modules, fail-fast on any check failure

**Checkpoint**: Docker builds work locally (`docker compose up`), CI pipeline runs on push. Foundation ready for production deployment.

---

## Phase 3: User Story 1 — Access Application via Production Domain (Priority: P1)

**Goal**: viably.dev serves frontend, api.viably.dev serves backend API, HTTPS everywhere, www redirect.

**Independent Test**: Open `https://viably.dev` — app loads. Call `https://api.viably.dev/health` — returns `{"status": "healthy"}`. HTTP redirects to HTTPS. www redirects to apex domain.

### Implementation for User Story 1

- [x] T011 [US1] Enhance health check in `backend/app/main.py`: add database connectivity check (async session test query), add Redis connectivity check, return `{"status": "healthy", "database": "ok", "redis": "ok"}` or 503 with failure details
- [x] T012 [US1] Add production CORS configuration: update `backend/app/core/config.py` to validate CORS_ORIGINS in production mode (must not contain localhost), ensure `backend/app/main.py` CORS middleware reads from settings
- [x] T013 [US1] Create `specs/019-infrastructure-devops/docs/railway-setup.md`: step-by-step Railway setup guide (create project, add PostgreSQL service, add Redis service, add backend from GitHub with Dockerfile path, add worker service, configure custom domain api.viably.dev, set env vars, enable auto-deploy from main)
- [x] T014 [US1] Create `specs/019-infrastructure-devops/docs/vercel-setup.md`: step-by-step Vercel setup guide (import repo, set root directory frontend/, configure domains viably.dev + www redirect, set env vars, verify preview deploys for PRs)
- [x] T015 [US1] Create `specs/019-infrastructure-devops/docs/dns-setup.md`: DNS configuration guide (viably.dev CNAME to cname.vercel-dns.com, www.viably.dev CNAME to cname.vercel-dns.com, api.viably.dev CNAME to Railway domain)

**Checkpoint**: Backend and frontend can be deployed to production. Health check validates database and Redis connectivity. Domain routing documented.

---

## Phase 4: User Story 2 — Automatic Deployment on Code Push (Priority: P2)

**Goal**: Push to main triggers CI checks; if all pass, auto-deploy to Railway (backend) and Vercel (frontend). PRs get preview deploys.

**Independent Test**: Push a commit to main — verify CI runs, check Railway deployment updates, verify Vercel deploys. Push a failing test — verify deploy is blocked.

### Implementation for User Story 2

- [x] T016 [US2] Extend `.github/workflows/ci.yml`: add deployment status badges, add Slack/email notification on CI failure (via GitHub Actions built-in notifications), document branch protection rules for main (require CI pass before merge)
- [x] T017 [US2] Create `specs/019-infrastructure-devops/docs/branch-protection.md`: guide for configuring GitHub branch protection rules (require status checks, require PR reviews, auto-delete head branches)
- [x] T018 [US2] Create `specs/019-infrastructure-devops/docs/deployment-flow.md`: document full deployment flow (push → CI → Railway auto-deploy for backend, Vercel auto-deploy for frontend, preview deploys for PRs, rollback procedures)

**Checkpoint**: CI/CD pipeline fully documented. Push to main results in automated, gated deployment.

---

## Phase 5: User Story 3 — Error Monitoring and Alerting (Priority: P3)

**Goal**: All production errors captured by Sentry. Uptime monitored. Team alerted on downtime and error spikes.

**Independent Test**: Trigger a test error in frontend/backend — verify it appears in Sentry dashboard. Simulate downtime — verify UptimeRobot alert fires.

### Implementation for User Story 3

- [x] T019 [P] [US3] Install sentry-sdk[fastapi] in `backend/pyproject.toml`, initialize Sentry in `backend/app/main.py` lifespan (sentry_sdk.init with dsn from settings, environment, traces_sample_rate=0.1, profiles_sample_rate=0.1, enable_tracing=True)
- [x] T020 [P] [US3] Install @sentry/nextjs in `frontend/package.json`, create `frontend/sentry.client.config.ts` (Sentry.init with dsn from env, environment, replaysSessionSampleRate, replaysOnErrorSampleRate, tracesSampleRate), create `frontend/sentry.server.config.ts`, create `frontend/sentry.edge.config.ts`
- [x] T021 [US3] Create `frontend/app/instrumentation.ts` with Sentry server-side instrumentation (import sentry.server.config on nodejs runtime, import sentry.edge.config on edge runtime)
- [x] T022 [US3] Wrap Next.js config with withSentryConfig in `frontend/next.config.ts` (add @sentry/nextjs withSentryConfig wrapper, configure source map upload with SENTRY_AUTH_TOKEN, set silenceSourceMapWarning)
- [x] T023 [P] [US3] Create global error boundary `frontend/app/error.tsx` (client component, capture error with Sentry.captureException, show user-friendly error UI with retry button)
- [x] T024 [P] [US3] Create root error boundary `frontend/app/global-error.tsx` (catches errors in root layout, imports sentry.client.config, shows minimal recovery UI)
- [x] T025 [US3] Install structlog in `backend/pyproject.toml`, create `backend/app/core/logging_config.py` (configure structlog with JSON processor for production, console renderer for development, bind request_id from contextvars, integrate with stdlib logging)
- [x] T026 [US3] Update `backend/app/main.py`: call logging_config.setup_logging() in lifespan startup, update request ID middleware to use structlog context binding (structlog.contextvars.bind_contextvars), replace logger = logging.getLogger with structlog.get_logger throughout
- [x] T027 [US3] Create `specs/019-infrastructure-devops/docs/uptimerobot-setup.md`: setup guide (create account, add HTTPS monitor for viably.dev at 5-min interval, add HTTP keyword monitor for api.viably.dev/health expecting "healthy", configure email alerts, optional Telegram webhook)
- [x] T028 [US3] Create `specs/019-infrastructure-devops/docs/sentry-setup.md`: setup guide (create org, create Next.js project, create Python project, get DSNs, create auth token for source maps, configure alert rules: email on new error, email on error frequency >10/hr)

**Checkpoint**: Sentry captures errors from both frontend and backend. structlog produces JSON logs. UptimeRobot monitoring documented and ready to activate.

---

## Phase 6: User Story 4 — Database Backup and Recovery (Priority: P4)

**Goal**: Daily automatic PostgreSQL backups with 7-day retention. Team can restore from any backup.

**Independent Test**: Verify backup exists in Railway dashboard. Perform test restore to verify procedure.

### Implementation for User Story 4

- [x] T029 [US4] Create `specs/019-infrastructure-devops/docs/backup-recovery.md`: comprehensive guide covering Railway managed PostgreSQL automatic daily backups, 7-day retention verification, step-by-step restore procedure, pre-deployment manual backup checklist, backup failure alerting (Railway dashboard notifications)
  → Artifacts: [backup-recovery.md](specs/019-infrastructure-devops/docs/backup-recovery.md)

**Checkpoint**: Database backup and recovery fully documented. Railway handles automated backups; team knows how to restore.

---

## Phase 7: User Story 5 — Usage Analytics and Funnel Tracking (Priority: P5)

**Goal**: Key user actions tracked via PostHog. Funnel from Landing to Deploy visible in PostHog dashboard.

**Independent Test**: Perform signup, create project, start generation — verify events appear in PostHog dashboard with correct properties.

### Implementation for User Story 5

- [x] T030 [P] [US5] Install posthog-js in `frontend/package.json`, create PostHog client initialization in `frontend/lib/posthog.ts` (init with NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST from env, disable in development, configure autocapture: false for privacy)
  → Artifacts: [posthog.ts](frontend/lib/posthog.ts)
- [x] T031 [P] [US5] Create PostHog React provider in `frontend/components/providers/posthog-provider.tsx` (client component, wraps children with PostHogProvider from posthog-js/react, initializes on mount)
  → Artifacts: [posthog-provider.tsx](frontend/components/providers/posthog-provider.tsx)
- [x] T032 [US5] Wrap app with PostHogProvider in `frontend/app/layout.tsx` (import PostHogProvider, wrap {children} inside Providers component)
  → Artifacts: [providers.tsx](frontend/app/providers.tsx)
- [x] T033 [US5] Create analytics event helpers in `frontend/lib/analytics.ts` (typed functions: trackSignup, trackProjectCreated, trackGenerationStarted, trackGenerationComplete, trackDeployed, trackPurchasedCredits — each calls posthog.capture with typed event name and properties per data-model.md)
  → Artifacts: [analytics.ts](frontend/lib/analytics.ts)
- [x] T034 [US5] Add analytics tracking calls to existing user flows: `frontend/components/auth/register-form.tsx` (trackSignup on success), `frontend/lib/hooks/use-projects.ts` or project creation flow (trackProjectCreated), `frontend/lib/hooks/use-generation.ts` (trackGenerationStarted on start, trackGenerationComplete on WS completion)
  → Artifacts: [register/page.tsx](frontend/app/(auth)/register/page.tsx), [use-projects.ts](frontend/lib/hooks/use-projects.ts), [use-generation.ts](frontend/lib/hooks/use-generation.ts)
- [ ] T035 [US5] Create `specs/019-infrastructure-devops/docs/posthog-setup.md`: setup guide (create PostHog Cloud account in EU region, create project, get API key, configure funnel: Landing → Signup → First Project → Generation → Deploy, set up dashboard with key metrics)

**Checkpoint**: All 6 key events tracked. PostHog funnel documented.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Security verification, documentation finalization, cross-cutting improvements.

- [ ] T036 Verify production security configuration: audit `backend/app/main.py` security headers middleware (X-Content-Type-Options, X-Frame-Options, HSTS, CSP), verify rate limiting configuration matches spec (60 req/min auth, 30 req/min generation), verify secure cookie flags in auth endpoints, verify CORS only allows viably.dev in production
- [ ] T037 Add production-ready cookie configuration: update auth token handling in `backend/app/auth/routes.py` to set httpOnly=True, secure=True, sameSite="lax" flags when ENVIRONMENT=production
- [ ] T038 Update project README.md with infrastructure overview: add deployment architecture section (Railway backend, Vercel frontend, PostgreSQL, Redis), link to setup guides in specs/019-infrastructure-devops/docs/, add environment variable reference
- [ ] T039 Run quickstart.md verification: walk through `specs/019-infrastructure-devops/quickstart.md` step by step, verify all commands and configurations are accurate, update any outdated references

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: T006-T008 depend on T001-T002 (env vars for Docker). T009 depends on T006-T007. T010 depends on T001, T004 (env examples for CI secrets)
- **US1 (Phase 3)**: Depends on Phase 2 (Docker + CI ready)
- **US2 (Phase 4)**: Depends on T010 (CI workflow exists)
- **US3 (Phase 5)**: Depends on T002 (backend config fields), T003 (frontend env validation)
- **US4 (Phase 6)**: Depends on T013 (Railway setup documented)
- **US5 (Phase 7)**: Depends on T003 (frontend env validation)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

- **US1 (Production Domain)**: No dependency on other stories
- **US2 (Auto Deployment)**: No dependency on other stories (needs CI from Phase 2)
- **US3 (Error Monitoring)**: No dependency on other stories
- **US4 (Backup/Recovery)**: No dependency on other stories
- **US5 (Analytics)**: No dependency on other stories

All user stories are independently implementable after Phase 2 completion.

### Within Each Phase

- Tasks marked [P] can run in parallel
- Sequential tasks depend on the previous task in the phase
- Backend (T019, T025-T026) and frontend (T020-T024) error tracking tasks can run in parallel

### Parallel Opportunities

**Phase 1** (all parallel):
```
T001 (backend .env.example) || T002 (config.py fields) || T003 (env.ts validation)
```

**Phase 2** (Docker parallel, then CI):
```
T006 (Dockerfile) || T007 (Dockerfile.worker) || T008 (.dockerignore)
→ T009 (docker-compose)
→ T010 (ci.yml)
```

**Phase 5** (backend + frontend parallel):
```
T019 (backend Sentry) || T020 (frontend Sentry configs)
→ T021 (instrumentation) → T022 (next.config)
T023 (error.tsx) || T024 (global-error.tsx) — parallel with each other
T025 (structlog) → T026 (integrate logging)
T027 (UptimeRobot docs) || T028 (Sentry docs) — parallel with everything
```

**Phase 7** (PostHog parallel start):
```
T030 (posthog init) || T031 (provider component)
→ T032 (wrap layout) → T033 (analytics helpers) → T034 (add tracking calls)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T010)
3. Complete Phase 3: US1 — Production Domain (T011-T015)
4. **STOP and VALIDATE**: Deploy to Railway + Vercel, verify viably.dev and api.viably.dev work
5. Production accessible — MVP achieved

### Incremental Delivery

1. Setup + Foundational → Docker + CI ready
2. US1 → Production domain live (MVP!)
3. US2 → Automated deployments documented
4. US3 → Error tracking + monitoring active
5. US4 → Backup procedures documented
6. US5 → Analytics tracking live
7. Polish → Security verified, docs updated

### Parallel Team Strategy

With 2+ developers after Phase 2:
- Developer A: US1 (production deploy) + US2 (CI/CD docs)
- Developer B: US3 (Sentry + structlog) + US5 (PostHog)
- Either: US4 (backup docs) + Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No new database models — all entities managed by external services
- Documentation tasks (T013-T015, T017-T018, T027-T029, T035) create guides in `specs/019-infrastructure-devops/docs/`
- External service configuration (Railway, Vercel, UptimeRobot, PostHog, Sentry) is manual setup documented in guides
- Commit after each task or logical group
