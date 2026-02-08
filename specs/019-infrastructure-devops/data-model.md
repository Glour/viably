# Data Model: Infrastructure & DevOps

**Feature Branch**: `019-infrastructure-devops`
**Date**: 2026-02-08

## Overview

This module does NOT introduce new database tables. Infrastructure entities are managed by external services (Railway, Vercel, Sentry, PostHog, UptimeRobot). This document defines the conceptual entities and their mapping to external services.

## Entity Definitions

### Environment (External — Railway/Vercel)

Managed by hosting platforms, not stored in application database.

| Attribute | Type | Source |
|-----------|------|--------|
| name | string | Railway environment name ("production") |
| domain | string | DNS configuration (viably.dev, api.viably.dev) |
| variables | key-value | Railway/Vercel environment variables dashboard |
| status | enum | Railway/Vercel status API |

### Deployment (External — Railway/Vercel)

Tracked by hosting platforms via GitHub integration.

| Attribute | Type | Source |
|-----------|------|--------|
| id | string | Railway/Vercel deployment ID |
| commit_sha | string | GitHub commit triggering the deploy |
| status | enum(building, deploying, ready, failed) | Platform API |
| created_at | timestamp | Platform timestamp |
| url | string | Deployment preview URL |

### Backup (External — Railway Managed PostgreSQL)

Automated by Railway's managed PostgreSQL service.

| Attribute | Type | Source |
|-----------|------|--------|
| snapshot_id | string | Railway backup ID |
| created_at | timestamp | Railway automatic schedule (daily) |
| retention_days | integer | Railway configuration (7 days) |
| size_bytes | integer | Railway dashboard |
| restorable | boolean | Railway backup status |

### Alert (External — UptimeRobot + Sentry)

| Attribute | Type | Source |
|-----------|------|--------|
| type | enum(downtime, error_spike, backup_failure) | UptimeRobot/Sentry |
| severity | enum(info, warning, critical) | Service configuration |
| recipients | string[] | Email addresses, Telegram webhook |
| channel | enum(email, telegram, webhook) | Service configuration |
| triggered_at | timestamp | Service event time |

### Analytics Event (External — PostHog)

Events sent from frontend via posthog-js, stored in PostHog Cloud.

| Event Name | Properties | Trigger Point |
|------------|-----------|---------------|
| signup | timestamp, method | After successful registration |
| project_created | project_id, template_id | After project save |
| generation_started | project_id, template_type | On generation button click |
| generation_complete | project_id, duration_ms, tokens_used | On WebSocket completion |
| deployed | project_id, platform | After successful deployment |
| purchased_credits | amount, package_id | After payment confirmation |

## Configuration Entities (Application Code)

### Backend Settings (app/core/config.py)

New fields to add to existing `Settings` class:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| SENTRY_DSN | str | "" | Sentry error tracking DSN |
| ENVIRONMENT | str | "development" | Environment name for Sentry/logging |
| LOG_LEVEL | str | "INFO" | Structured logging level |
| LOG_FORMAT | str | "json" | Log format: "json" (production) or "console" (development) |

### Frontend Environment (lib/env.ts)

New validated environment variables:

| Variable | Type | Required | Purpose |
|----------|------|----------|---------|
| NEXT_PUBLIC_API_URL | string/url | Yes | Backend API base URL |
| NEXT_PUBLIC_WS_URL | string/url | Yes | WebSocket base URL |
| NEXT_PUBLIC_ENVIRONMENT | enum | Yes | development/staging/production |
| NEXT_PUBLIC_SENTRY_DSN | string | No | Sentry DSN (empty = disabled) |
| NEXT_PUBLIC_POSTHOG_KEY | string | No | PostHog project key (empty = disabled) |
| NEXT_PUBLIC_POSTHOG_HOST | string/url | No | PostHog instance URL |
| NEXT_PUBLIC_SITE_URL | string/url | No | Canonical site URL |
| SENTRY_AUTH_TOKEN | string | No | Sentry source map upload (build-time only) |

## Relationships

```
GitHub Push → GitHub Actions CI → [Pass] → Railway Deploy (backend)
                                         → Vercel Deploy (frontend)
                                → [Fail] → Block + Notify

Production App → Sentry (errors)
              → PostHog (analytics events)
              → structlog → Railway Logs (structured JSON)

UptimeRobot → viably.dev (ping)
            → api.viably.dev/health (HTTP check)
            → [Down] → Alert (email/telegram)

Railway PostgreSQL → Daily Backup → 7-day retention
```
