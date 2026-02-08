# Viably Infrastructure Module Research Report

**Date**: 2026-02-08
**Researcher**: research-specialist
**Status**: Complete

## Executive Summary

This research evaluates infrastructure libraries and services for the Viably project across 7 key areas: error tracking (frontend/backend), structured logging, analytics, uptime monitoring, environment validation, and Docker base images. Recommendations prioritize compatibility with Next.js 16 + React 19 + TypeScript 5 (frontend) and Python 3.12 + FastAPI (backend), along with Railway/Vercel hosting constraints.

**Key Recommendations**:
- **Error Tracking**: Sentry for both frontend and backend (industry standard, excellent compatibility)
- **Logging**: structlog for FastAPI (production-grade, flexible, integrates with Sentry)
- **Analytics**: PostHog (privacy-first, feature-rich, generous free tier)
- **Uptime**: UptimeRobot free tier (50 monitors, 5-min checks, best value)
- **Env Validation**: @t3-oss/env-nextjs (Next.js-optimized, built on Zod)
- **Docker**: python:3.12-slim (fast builds, wheel compatibility)

---

## 1. Error Tracking (Frontend)

### Decision: @sentry/nextjs v10.38.0

**Rationale**:
- **Next.js 16 + React 19 compatibility**: Official Sentry SDK with active Next.js 16 testing (e2e metrics tests added in latest releases)
- **Industry standard**: 2.5M+ weekly downloads, actively maintained (published 6 days ago)
- **Deep integration**: App Router support, automatic error boundaries, source maps, performance tracing
- **Production-ready**: Official SDK with comprehensive Next.js-specific features

**Alternatives Considered**:
1. **Rollbar** (rollbar/rollbar.js)
   - Pros: Good UI, real-time feed, 4.5/5 stars on G2
   - Cons: Less Next.js-specific integration, smaller ecosystem
   - Verdict: Good alternative but Sentry has better Next.js ecosystem

2. **PostHog** (posthog-js)
   - Pros: Combines analytics + error tracking + session replay
   - Cons: Error tracking is secondary feature (analytics-first)
   - Verdict: Better for analytics (see section 4)

3. **Better Stack**
   - Pros: All-in-one observability, cost-effective
   - Cons: Newer product, less mature Next.js integration
   - Verdict: Watch for future adoption

**Library Details**:
- **Package**: `@sentry/nextjs`
- **Version**: 10.38.0 (latest)
- **Weekly Downloads**: 2,546,799
- **Last Commit**: 6 days ago (Feb 2026)
- **Compatibility**: Next.js 16, React 19.2, TypeScript 5
- **Docs**: [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

## 2. Error Tracking (Backend)

### Decision: sentry-sdk[fastapi] v2.49.0+

**Rationale**:
- **FastAPI native support**: Official integration with `sentry-sdk[fastapi]` extras
- **Massive adoption**: 15.4M+ weekly downloads, "key ecosystem project" status
- **Unified platform**: Frontend + backend errors in single dashboard (same Sentry account)
- **Healthy maintenance**: New release in past 3 months, active development

**Alternatives Considered**:
1. **Rollbar** (pyrollbar)
   - Pros: Supports FastAPI, real-time error feed
   - Cons: Less popular than Sentry (smaller community)
   - Verdict: Viable but Sentry's ecosystem advantage wins

2. **Better Stack**
   - Pros: All-in-one observability, cost savings vs Sentry
   - Cons: Requires separate Python SDK integration
   - Verdict: Good for full observability but Sentry better for error-focused

3. **SigNoz** (open-source)
   - Pros: Self-hosted, open-source, unified observability
   - Cons: Requires self-hosting (adds ops burden)
   - Verdict: Excellent for self-hosted but adds complexity

**Library Details**:
- **Package**: `sentry-sdk[fastapi]`
- **Version**: 2.49.0+ (latest)
- **Weekly Downloads**: 15,438,275 (PyPI stats), 18,129,849 (recent week)
- **Last Commit**: Active (healthy maintenance)
- **Compatibility**: Python 3.12, FastAPI 0.109+, async SQLAlchemy
- **Docs**: [Sentry FastAPI Guide](https://sentry.io/for/fastapi/)

**Integration Notes**:
- Use `sentry-sdk[fastapi]` extras for automatic FastAPI middleware
- Integrates with Celery for async task error tracking
- Works with structlog for structured error context

---

## 3. Structured Logging (Backend)

### Decision: structlog v25.5.0

**Rationale**:
- **Production-grade**: Used in production "at every scale since 2013"
- **Flexibility**: JSON/Logfmt output, colorized console for dev, fully customizable
- **Async support**: Native async logging (`await logger.ainfo()`)
- **Sentry integration**: Works seamlessly with sentry-sdk for enriched error context
- **FastAPI patterns**: Multiple integration guides available (wazaari.dev, pawamoy.github.io)

**Alternatives Considered**:
1. **loguru** (v0.7.3)
   - Pros: Simplest config (6.3M weekly downloads), ready-to-go logger, faster than stdlib
   - Cons: **Cannot work with sentry-sdk out of the box** (writes to stdout directly, breaks default logging handlers)
   - Cons: Crashes without useful info if formatter errors occur
   - Verdict: Simpler but incompatible with Sentry (dealbreaker)

2. **python-json-logger** (v4.0.0)
   - Pros: Highest downloads (9.1M/week), simple JSON output
   - Cons: Less active maintenance, fragmented docs, less flexible than structlog
   - Verdict: Good for basic JSON but structlog more production-ready

**Library Details**:
- **Package**: `structlog`
- **Version**: 25.5.0 (latest)
- **Weekly Downloads**: 3,664,308
- **Last Commit**: Jan 6, 2026 (active maintenance)
- **Compatibility**: Python 3.12, asyncio, FastAPI, Uvicorn/Gunicorn
- **Docs**: [structlog.org](https://www.structlog.org/)

**Integration Pattern**:
```python
# FastAPI + structlog + JSON for production
# Colorized console for development
# Correlation IDs via middleware
# Sentry context enrichment
```

**Why NOT loguru**: Despite easier config, loguru's inability to work with sentry-sdk default handlers is a critical flaw for production error tracking.

---

## 4. Analytics (Frontend)

### Decision: PostHog (posthog-js v1.342.1)

**Rationale**:
- **Privacy-first + feature-rich**: GDPR-compliant (EU hosting in Frankfurt), no PII collection
- **All-in-one**: Web analytics + session replay + A/B testing + feature flags + surveys + error tracking
- **Generous free tier**: 1M events/month (vs Plausible $9/month for 10K pageviews)
- **Active development**: Published 9 hours ago, 2.6M weekly downloads
- **Next.js integration**: Official guide for Next.js 16 + Vercel deployment

**Alternatives Considered**:
1. **Plausible Analytics** (next-plausible)
   - Pros: Simplest UI, privacy-first, fast loading, EU-hosted
   - Cons: **Limited free tier** (30-day trial only, then $9/month for 10K pageviews)
   - Cons: Web analytics ONLY (no session replay, A/B testing, feature flags)
   - Weekly downloads: 36,271 (next-plausible)
   - Verdict: Great for basic analytics but PostHog offers more value

2. **Vercel Analytics**
   - Pros: Native Vercel integration, no PII, free tier
   - Cons: Basic analytics only (no funnels, session replay, A/B tests)
   - Cons: Data not EU-hostable (Vercel servers only)
   - Verdict: Good for basic Vercel metrics but limited features

3. **Fathom Analytics**
   - Pros: Privacy-first, simple UI
   - Cons: Paid only (no free tier), limited feature set
   - Verdict: Too expensive for early-stage startup

**Library Details**:
- **Package**: `posthog-js` (frontend), `posthog-node` (backend)
- **Version**: posthog-js v1.342.1, posthog-node v5.24.11
- **Weekly Downloads**: 2,587,769 (posthog-js), 1,487,308 (posthog-node)
- **Last Commit**: 9 hours ago (posthog-js), 17 hours ago (posthog-node)
- **Compatibility**: Next.js 16, React 19, TypeScript 5
- **Hosting**: PostHog Cloud EU (Frankfurt) for GDPR compliance
- **Docs**: [PostHog Next.js Guide](https://posthog.com/docs/libraries/next-js)

**Free Tier Comparison**:
| Service | Free Tier | Privacy | Features |
|---------|-----------|---------|----------|
| **PostHog** | 1M events/month | GDPR (EU hosting) | Analytics, session replay, A/B tests, feature flags, surveys |
| **Plausible** | 30-day trial only | GDPR (EU hosting) | Analytics only |
| **Vercel Analytics** | Basic metrics | GDPR (no PII) | Basic analytics only |

**Why PostHog**: Best value (generous free tier + most features) while maintaining privacy compliance.

---

## 5. Uptime Monitoring

### Decision: UptimeRobot (Free Tier)

**Rationale**:
- **Best free tier**: 50 monitors for life (vs BetterStack 10, Checkly limited)
- **Adequate check intervals**: 5-minute checks (free tier) sufficient for MVP
- **Cost-effective scaling**: $8/month for 10 monitors with 60-second intervals (90% cheaper than BetterStack)
- **Simple & reliable**: Popular for small businesses, transparent pricing

**Alternatives Considered**:
1. **BetterStack Uptime** (formerly Better Uptime)
   - Pros: Modern UI, incident management, status pages, unlimited phone/SMS alerts
   - Cons: **Only 10 monitors free** (vs UptimeRobot 50)
   - Cons: 3-minute check intervals (vs UptimeRobot 5-minute)
   - Free tier: 10 monitors, 10 heartbeats, 3-minute checks
   - Verdict: Great for paid tier but free tier too limited

2. **Checkly**
   - Pros: Playwright script support (advanced monitoring)
   - Cons: Limited free tier details (not specified in research)
   - Cons: More complex setup (overkill for basic uptime)
   - Verdict: Overkill for basic HTTP/ping monitoring

**Service Details**:
- **Service**: UptimeRobot
- **Free Tier**: 50 monitors, 5-minute checks, 3-month log retention, 1 status page monitor
- **Alerts**: Email, Slack, MS Teams (no SMS/voice in free tier)
- **Paid Tier**: $8/month for 10 monitors with 60-second intervals
- **Docs**: [UptimeRobot Knowledge Hub](https://uptimerobot.com/knowledge-hub/)

**Why UptimeRobot**: 50 free monitors covers all critical endpoints (API routes, frontend, Celery workers, Redis, PostgreSQL health checks) with room to grow.

**Migration Path**: If advanced features needed later (Playwright monitoring, 1-minute checks), upgrade to BetterStack paid tier ($18/month for unlimited monitors).

---

## 6. Environment Validation (Frontend)

### Decision: @t3-oss/env-nextjs v0.13.10

**Rationale**:
- **Next.js-optimized**: Handles Next.js bundling quirks (client/server variable separation)
- **Built on Zod**: Uses Standard Schema (Zod by default), familiar to existing codebase
- **Type-safe**: TypeScript autocomplete for `process.env` variables
- **Build + runtime validation**: Fails fast on missing/invalid env vars
- **Widely adopted**: 576,728 weekly downloads, used in Create T3 App

**Alternatives Considered**:
1. **Manual Zod validation**
   - Pros: No extra dependency, full control
   - Cons: Must manually handle Next.js bundling rules (server vars shipped to client if accessed)
   - Cons: No automatic TypeScript types for `process.env`
   - Verdict: Reinventing the wheel, @t3-oss/env-nextjs solves this

2. **envalid**
   - Pros: Simple validation library
   - Cons: Not Next.js-specific (no bundling awareness)
   - Cons: Less TypeScript-friendly than Zod
   - Verdict: Generic solution, not Next.js-optimized

**Library Details**:
- **Package**: `@t3-oss/env-nextjs`
- **Version**: 0.13.10 (latest)
- **Weekly Downloads**: 576,728
- **Last Commit**: Active maintenance
- **Compatibility**: Next.js 16, Zod 4.3.6, TypeScript 5
- **Docs**: [T3 Env Next.js](https://env.t3.gg/docs/nextjs)

**Integration Pattern**:
```typescript
// src/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    API_KEY: process.env.API_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});
```

**Why @t3-oss/env-nextjs**: Next.js bundling rules are complex (server vars leak to client if referenced). This library automates safe handling + TypeScript types.

---

## 7. Docker Base Images (Backend)

### Decision: python:3.12-slim

**Rationale**:
- **Fast builds**: 30-second builds vs 1500+ seconds for Alpine (50x faster)
- **Wheel compatibility**: Standard Linux wheels work (glibc-based), no recompilation needed
- **Fewer edge cases**: No musl libc quirks (DNS over TCP failures, stack size crashes)
- **FastAPI creator recommendation**: Sebastián Ramírez recommends `-slim` for Python projects
- **Reasonable size**: 130MB base (vs Alpine 51MB), but final image size similar after deps

**Alternatives Considered**:
1. **python:3.12-alpine**
   - Pros: Smaller base image (51MB vs 130MB)
   - Cons: **50x slower builds** (downloads source, compiles everything - no wheel support)
   - Cons: musl libc breaks prebuilt wheels (NumPy, cryptography, etc.)
   - Cons: DNS over TCP issues in Kubernetes
   - Cons: Smaller stack size causes Python crashes
   - Verdict: Avoid for Python (FastAPI creator explicitly warns against Alpine)

2. **python:3.12** (full Debian)
   - Pros: All dev tools included
   - Cons: Larger image (~900MB), includes unnecessary packages
   - Verdict: Too large for production, use slim

**Image Details**:
- **Image**: `python:3.12-slim`
- **Base OS**: Debian (glibc-based)
- **Size**: ~130MB (base), ~200-300MB (with FastAPI + SQLAlchemy + deps)
- **Build Time**: ~30 seconds (with cached wheels)
- **Compatibility**: All standard PyPI wheels work (NumPy, cryptography, FastAPI, etc.)

**Why python:3.12-slim**: Alpine's musl libc incompatibility causes 50x slower builds and runtime failures. Slim is the industry standard for Python production containers.

**Multi-stage Build Pattern**:
```dockerfile
# Stage 1: Build dependencies
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Production image
FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Implementation Checklist

### Frontend (Next.js 16)

- [ ] Install `@sentry/nextjs@^10.38.0`
  - [ ] Configure `sentry.client.config.ts` and `sentry.server.config.ts`
  - [ ] Add `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` to env vars
  - [ ] Set up source maps upload in `next.config.ts`

- [ ] Install `posthog-js@^1.342.1`
  - [ ] Configure PostHog provider in `app/layout.tsx`
  - [ ] Add `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` to env vars
  - [ ] Set up EU hosting (Frankfurt) for GDPR compliance
  - [ ] Configure custom events and funnels

- [ ] Install `@t3-oss/env-nextjs@^0.13.10`
  - [ ] Create `src/env.ts` with Zod schemas
  - [ ] Separate server/client env vars
  - [ ] Import env in `next.config.ts` for build-time validation

### Backend (Python 3.12 + FastAPI)

- [ ] Install `sentry-sdk[fastapi]@^2.49.0`
  - [ ] Configure Sentry middleware in `main.py`
  - [ ] Add `SENTRY_DSN`, `SENTRY_ENVIRONMENT` to env vars
  - [ ] Integrate with Celery for async task error tracking

- [ ] Install `structlog@^25.5.0`
  - [ ] Configure JSON logging for production
  - [ ] Configure colorized console for development
  - [ ] Add correlation ID middleware
  - [ ] Integrate with Sentry for enriched error context

- [ ] Update Dockerfile to `python:3.12-slim`
  - [ ] Implement multi-stage build
  - [ ] Add non-root user for security
  - [ ] Configure layer caching for faster rebuilds

### DevOps & Monitoring

- [ ] Set up UptimeRobot (free tier)
  - [ ] Monitor API health endpoints (`/health`, `/ready`)
  - [ ] Monitor frontend (Vercel deployment URL)
  - [ ] Monitor Celery worker (heartbeat endpoint)
  - [ ] Monitor Redis/PostgreSQL (if exposed)
  - [ ] Configure Slack alerts

- [ ] Configure Sentry environments
  - [ ] Development: Local Sentry or no tracking
  - [ ] Staging: Sentry with staging environment tag
  - [ ] Production: Sentry with production environment tag

- [ ] Configure PostHog environments
  - [ ] Development: Disable PostHog or separate project
  - [ ] Staging: PostHog staging project
  - [ ] Production: PostHog production project (EU hosting)

---

## Cost Analysis

### Free Tier Limits (MVP Phase)

| Service | Free Tier | Upgrade Trigger |
|---------|-----------|-----------------|
| **Sentry** | 5K errors/month, 10K transactions/month | >5K errors or >10K transactions |
| **PostHog** | 1M events/month | >1M events (unlikely for MVP) |
| **UptimeRobot** | 50 monitors, 5-min checks | Need <5-min checks or >50 monitors |
| **Vercel** | 100GB bandwidth, unlimited deployments | >100GB traffic |
| **Railway** | $5/month free trial credit | After trial, ~$10-20/month estimated |

### Paid Tier Costs (Post-MVP)

| Service | Paid Plan | Monthly Cost |
|---------|-----------|--------------|
| **Sentry** | Team ($26/month) | $26 (50K errors, 100K transactions) |
| **PostHog** | Scale ($0 for 1M events, $0.00045/event after) | ~$0-50 (depends on usage) |
| **UptimeRobot** | Pro ($8/month) | $8 (10 monitors, 60-sec checks) |
| **BetterStack** | Pro ($18/month) | $18 (unlimited monitors, 3-min checks) |
| **Railway** | Usage-based | $20-50/month (estimated for FastAPI + Celery + Redis) |
| **Vercel** | Pro ($20/month) | $20 (team features, advanced analytics) |

**Estimated Monthly Cost (Post-MVP)**: $72-122 ($26 Sentry + $8 UptimeRobot + $20 Vercel + $20-50 Railway + $0-18 PostHog/BetterStack optional upgrades)

---

## Sources

### Error Tracking (Frontend)
- [@sentry/nextjs - npm](https://www.npmjs.com/package/@sentry/nextjs)
- [Next.js | Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Releases · getsentry/sentry-javascript](https://github.com/getsentry/sentry-javascript/releases)

### Error Tracking (Backend)
- [sentry-sdk · PyPI](https://pypi.org/project/sentry-sdk/)
- [FastAPI Error & Performance Monitoring | Sentry](https://sentry.io/for/fastapi/)
- [Top 8 Sentry Alternatives for Error Tracking in 2026 | SigNoz](https://signoz.io/comparisons/sentry-alternatives/)
- [Sentry, But Better: These 6 Sentry Alternatives Keep Your Code Error-Free | Rollbar](https://rollbar.com/blog/sentry-alternatives-for-error-tracking/)

### Structured Logging (Backend)
- [Logging in Python: A Comparison of the Top 6 Libraries | Better Stack Community](https://betterstack.com/community/guides/logging/best-python-logging-libraries/)
- [Integrating FastAPI with Structlog | Yet Another Techblog](https://wazaari.dev/blog/fastapi-structlog-integration)
- [Unify Python logging for a Gunicorn/Uvicorn/FastAPI application - pawamoy's website](https://pawamoy.github.io/posts/unify-logging-for-a-gunicorn-uvicorn-app/)
- [structlog · PyPI](https://pypi.org/project/structlog/)
- [loguru · PyPI](https://pypi.org/project/loguru/)
- [python-json-logger · PyPI](https://pypi.org/project/python-json-logger/)

### Analytics (Frontend)
- [PostHog vs Plausible in-depth tool comparison](https://posthog.com/blog/posthog-vs-plausible)
- [The 9 best GDPR-compliant analytics tools](https://posthog.com/blog/best-gdpr-compliant-analytics-tools)
- [Using PostHog with the Next.js App Router and Vercel | Vercel Knowledge Base](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics)
- [posthog-js - npm](https://www.npmjs.com/package/posthog-js)

### Uptime Monitoring
- [Cost-effective alternative to BetterStack | UptimeRobot](https://uptimerobot.com/alternative-to-betterstack/)
- [Top 10 Checkly Alternatives 2026 | Better Stack Community](https://betterstack.com/community/comparisons/checkly-alternative/)
- [7 Best Uptime Robot Alternatives in 2026 | Better Stack Community](https://betterstack.com/community/comparisons/uptime-robot-alternatives/)
- [Pricing | Better Stack](https://betterstack.com/pricing)

### Environment Validation (Frontend)
- [Next.js ⋅ T3 Env](https://env.t3.gg/docs/nextjs)
- [GitHub - t3-oss/t3-env](https://github.com/t3-oss/t3-env)
- [@t3-oss/env-nextjs - npm](https://www.npmjs.com/package/@t3-oss/env-nextjs)

### Docker Base Images (Backend)
- [Build Production-Ready Docker Images with Python, Poetry & FastAPI](https://amplify.security/blog/how-to-build-production-ready-docker-images-with-python-poetry-and-fastapi)
- [Using Alpine can make Python Docker builds 50× slower](https://pythonspeed.com/articles/alpine-docker-python/)
- [The best Docker base image for your Python application (February 2026)](https://pythonspeed.com/articles/base-image-python-docker-images/)
- [Docker Best Practices for Python Developers | TestDriven.io](https://testdriven.io/blog/docker-best-practices/)

---

## Conclusion

This research provides production-ready recommendations for all 7 infrastructure areas, prioritizing:

1. **Ecosystem compatibility**: All choices work seamlessly with Next.js 16, React 19, Python 3.12, FastAPI
2. **Cost efficiency**: Generous free tiers for MVP phase ($0-5/month), reasonable scaling costs ($72-122/month post-MVP)
3. **Privacy compliance**: GDPR-friendly options (PostHog EU hosting, Sentry EU region, Plausible EU-hosted)
4. **Developer experience**: Modern tooling with excellent TypeScript/Python support, active maintenance
5. **Production readiness**: Battle-tested libraries with millions of weekly downloads, used at scale

**Next Steps**:
1. Create infrastructure module specification document
2. Set up Sentry projects (frontend + backend)
3. Configure PostHog EU hosting
4. Implement structlog with correlation IDs
5. Set up UptimeRobot monitors
6. Create Dockerfile with python:3.12-slim multi-stage build
