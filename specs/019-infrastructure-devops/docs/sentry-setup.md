# Sentry Setup Guide

## 1. Create Organization

1. Go to [sentry.io](https://sentry.io)
2. Sign up or log in
3. Create organization "viably"

## 2. Create Frontend Project

1. Click "Create Project"
2. Platform: **Next.js**
3. Name: `viably-frontend`
4. Copy the **DSN** → set as `NEXT_PUBLIC_SENTRY_DSN` in Vercel env vars

## 3. Create Backend Project

1. Click "Create Project"
2. Platform: **Python** → **FastAPI**
3. Name: `viably-backend`
4. Copy the **DSN** → set as `SENTRY_DSN` in Railway env vars

## 4. Generate Auth Token (Source Maps)

1. Go to Settings → Auth Tokens
2. Create new token with scopes:
   - `project:releases`
   - `org:read`
3. Copy token → set as `SENTRY_AUTH_TOKEN` in Vercel env vars (build-time only)
4. Also set `SENTRY_ORG=viably` and `SENTRY_PROJECT=viably-frontend` in CI

## 5. Configure Alert Rules

### Rule 1: New Issue Alert
1. Go to Alerts → Create Alert Rule
2. **Conditions**: A new issue is created
3. **Action**: Send email to team
4. **Frequency**: At most once every 30 minutes
5. Apply to both projects

### Rule 2: Error Spike Alert
1. Go to Alerts → Create Alert Rule
2. **Conditions**: Number of events in an issue exceeds 10 in 1 hour
3. **Action**: Send email to team
4. **Priority**: High
5. Apply to both projects

## 6. Environment Configuration

| Variable | Where | Value |
|----------|-------|-------|
| `SENTRY_DSN` | Railway (backend) | Backend project DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel (frontend) | Frontend project DSN |
| `SENTRY_AUTH_TOKEN` | Vercel (build) | Auth token for source maps |
| `SENTRY_ORG` | CI/Vercel | `viably` |
| `SENTRY_PROJECT` | CI/Vercel | `viably-frontend` |

## 7. Verify Setup

### Backend
```bash
# Trigger a test error
curl -X POST https://api.viably.dev/sentry-debug
# Check Sentry dashboard for the error
```

### Frontend
```javascript
// In browser console on viably.dev
throw new Error("Sentry test error from frontend")
// Check Sentry dashboard for the error
```

Both errors should appear in their respective Sentry projects within seconds.
