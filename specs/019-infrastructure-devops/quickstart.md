# Quickstart: Infrastructure & DevOps

**Feature Branch**: `019-infrastructure-devops`
**Date**: 2026-02-08

## Prerequisites

- GitHub repository with `main` branch
- Domain `viably.dev` purchased with DNS access
- Accounts: Railway, Vercel, Sentry, PostHog, UptimeRobot
- Docker installed locally (for testing builds)

## 1. Local Docker Build (Backend)

```bash
# Build backend image
cd backend
docker build -t viably-backend -f Dockerfile .

# Build worker image
docker build -t viably-worker -f Dockerfile.worker .

# Run full stack locally
cd ..
docker compose up -d
```

## 2. Environment Setup

### Backend (.env)

Copy `backend/.env.example` and fill in values:

```bash
cp backend/.env.example backend/.env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET_KEY` — 64+ character random string
- `SENTRY_DSN` — From Sentry project settings
- `ENVIRONMENT` — "production" for prod

### Frontend (.env.local)

Copy `frontend/.env.example` and fill in values:

```bash
cp frontend/.env.example frontend/.env.local
```

Required variables:
- `NEXT_PUBLIC_API_URL` — Backend API URL (https://api.viably.dev)
- `NEXT_PUBLIC_WS_URL` — WebSocket URL (wss://api.viably.dev)
- `NEXT_PUBLIC_SENTRY_DSN` — From Sentry project settings
- `NEXT_PUBLIC_POSTHOG_KEY` — From PostHog project settings

## 3. Railway Setup (Backend)

1. Create new Railway project
2. Add PostgreSQL service (managed)
3. Add Redis service (managed)
4. Add backend service from GitHub repo:
   - Root directory: `backend`
   - Dockerfile path: `backend/Dockerfile`
   - Set environment variables from `.env.example`
5. Add worker service from same repo:
   - Root directory: `backend`
   - Dockerfile path: `backend/Dockerfile.worker`
   - Same environment variables
6. Configure custom domain: `api.viably.dev`
7. Enable auto-deploy from `main` branch

## 4. Vercel Setup (Frontend)

1. Import GitHub repository to Vercel
2. Set root directory: `frontend`
3. Framework preset: Next.js (auto-detected)
4. Set environment variables from `.env.example`
5. Configure domains:
   - `viably.dev` (primary)
   - `www.viably.dev` (redirect to viably.dev)
6. Auto-deploy from `main` branch enabled by default
7. Preview deploys for PRs enabled by default

## 5. DNS Configuration

| Record | Type | Value | Purpose |
|--------|------|-------|---------|
| viably.dev | CNAME | cname.vercel-dns.com | Frontend |
| www.viably.dev | CNAME | cname.vercel-dns.com | Redirect |
| api.viably.dev | CNAME | [railway-domain] | Backend API |

## 6. Sentry Setup

1. Create Sentry organization + project (Next.js)
2. Create second project (Python/FastAPI)
3. Copy DSN values to environment variables
4. Generate auth token for source map uploads
5. Configure alert rules:
   - Email on first occurrence of new error
   - Email when error frequency >10/hour

## 7. PostHog Setup

1. Create PostHog Cloud account (EU region for GDPR)
2. Create project
3. Copy project API key to `NEXT_PUBLIC_POSTHOG_KEY`
4. Configure funnel: Landing → Signup → First Project → Generation → Deploy

## 8. UptimeRobot Setup

1. Create free account
2. Add monitors:
   - HTTP(s) monitor: `https://viably.dev` (5-min interval)
   - HTTP(s) monitor: `https://api.viably.dev/health` (5-min interval, expect "healthy")
3. Configure alerts:
   - Email to team
   - Telegram webhook (optional)

## 9. Verification Checklist

After deployment, verify:

- [ ] `https://viably.dev` loads the application
- [ ] `https://api.viably.dev/health` returns `{"status": "healthy"}`
- [ ] `http://viably.dev` redirects to `https://viably.dev`
- [ ] `https://www.viably.dev` redirects to `https://viably.dev`
- [ ] Push to `main` triggers CI pipeline
- [ ] CI failure blocks deploy
- [ ] Preview deploy created for PRs
- [ ] Sentry receives test error (frontend + backend)
- [ ] PostHog receives test event
- [ ] UptimeRobot shows green status
- [ ] Railway logs show structured JSON
- [ ] Database backup visible in Railway dashboard

## 10. Rollback Procedure

### Backend (Railway)
Railway keeps deployment history. To rollback:
1. Go to Railway dashboard → Deployments
2. Click on previous successful deployment
3. Click "Redeploy"

### Frontend (Vercel)
Vercel keeps all deployment snapshots:
1. Go to Vercel dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Database
Railway managed PostgreSQL includes point-in-time recovery:
1. Go to Railway dashboard → PostgreSQL service
2. Navigate to Backups tab
3. Select backup point → Restore
