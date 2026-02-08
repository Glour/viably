# PostHog Analytics Setup Guide

## 1. Create Account

1. Go to [posthog.com](https://posthog.com)
2. Sign up for PostHog Cloud
3. Select **EU region** (Frankfurt) for GDPR compliance
4. Create organization "viably"

## 2. Create Project

1. Click "New Project"
2. Name: `viably-production`
3. Platform: **Web**
4. Copy the **API Key** → set as `NEXT_PUBLIC_POSTHOG_KEY` in Vercel env vars
5. Note the **Host URL** (e.g., `https://eu.i.posthog.com`) → set as `NEXT_PUBLIC_POSTHOG_HOST`

## 3. Environment Configuration

| Variable | Where | Value |
|----------|-------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Vercel (frontend) | Project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Vercel (frontend) | `https://eu.i.posthog.com` |

**Note**: PostHog is disabled in development mode (when no API key is set). No backend configuration needed.

## 4. Tracked Events

The following events are tracked automatically via `frontend/lib/analytics.ts`:

| Event | Trigger | Properties |
|-------|---------|------------|
| `user_signed_up` | Successful registration | `method` (email/google/github) |
| `project_created` | New project created | `projectId`, `templateId` |
| `generation_started` | AI generation initiated | `projectId`, `templateId` |
| `generation_completed` | AI generation finished | `projectId`, `durationMs` |
| `project_deployed` | Deployment completed | `projectId`, `platform` |
| `credits_purchased` | Credits purchased | `packageId`, `amount`, `credits` |

## 5. Configure Funnel

1. Go to PostHog → Insights → New Insight → Funnel
2. Add steps in order:
   - Step 1: `user_signed_up`
   - Step 2: `project_created`
   - Step 3: `generation_started`
   - Step 4: `generation_completed`
   - Step 5: `project_deployed`
3. Set conversion window: **7 days**
4. Save as "Core User Funnel"

## 6. Create Dashboard

1. Go to Dashboards → New Dashboard
2. Name: "Viably Key Metrics"
3. Add insights:
   - **Daily Active Users**: Unique users performing any event (last 30 days)
   - **Signups**: `user_signed_up` count (last 30 days, daily trend)
   - **Generations**: `generation_started` count (last 30 days, daily trend)
   - **Deployments**: `project_deployed` count (last 30 days, daily trend)
   - **Core Funnel**: The funnel from step 5
   - **Revenue Events**: `credits_purchased` count and sum of `amount`

## 7. Privacy Configuration

1. Go to Project Settings → Autocapture
2. Verify autocapture is **disabled** (configured in code)
3. Go to Project Settings → Session Recording
4. Enable session recording (optional, for UX analysis)
5. Set sampling rate to 10% to manage costs

## 8. Verify Setup

1. Deploy frontend with PostHog env vars set
2. Perform a signup on the live site
3. Go to PostHog → Activity → Live Events
4. Verify `user_signed_up` event appears with correct properties
5. Create a project and verify `project_created` event
