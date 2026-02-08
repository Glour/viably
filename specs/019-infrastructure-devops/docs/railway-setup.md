# Railway Setup Guide

## 1. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Empty Project"
3. Name the project "viably"

## 2. Add PostgreSQL

1. Click "+ New" → "Database" → "PostgreSQL"
2. Railway creates a managed PostgreSQL 16 instance
3. Copy the `DATABASE_URL` from the "Variables" tab (use the `DATABASE_PUBLIC_URL` for external access)
4. Note: Railway provides automatic daily backups with 7-day retention

## 3. Add Redis

1. Click "+ New" → "Database" → "Redis"
2. Copy the `REDIS_URL` from the "Variables" tab
3. Use this for `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND`

## 4. Add Backend Service

1. Click "+ New" → "GitHub Repo" → Select `viably` repository
2. Configure:
   - **Root Directory**: `backend`
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `backend/Dockerfile`
3. Set environment variables (Settings → Variables):
   ```
   DATABASE_URL=<from PostgreSQL service>
   JWT_SECRET_KEY=<generate 64-char random string>
   ANTHROPIC_API_KEY=<your key>
   CELERY_BROKER_URL=<from Redis service>
   CELERY_RESULT_BACKEND=<from Redis service>
   CORS_ORIGINS=https://viably.dev
   SENTRY_DSN=<from Sentry>
   ENVIRONMENT=production
   LOG_LEVEL=INFO
   LOG_FORMAT=json
   ```
4. Enable auto-deploy from `main` branch (Settings → Deploy → Auto-Deploy)

## 5. Add Worker Service

1. Click "+ New" → "GitHub Repo" → Select same `viably` repository
2. Configure:
   - **Root Directory**: `backend`
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `backend/Dockerfile.worker`
3. Set the same environment variables as the backend service
4. Enable auto-deploy from `main` branch

## 6. Configure Custom Domain

1. Go to Backend service → Settings → Networking
2. Click "Generate Domain" to get a `*.up.railway.app` domain
3. Click "Custom Domain" → Enter `api.viably.dev`
4. Railway provides the CNAME target — add it to your DNS (see dns-setup.md)
5. Railway automatically provisions SSL certificate

## 7. Verify Deployment

1. Visit `https://api.viably.dev/health`
2. Expected response: `{"status": "healthy", "database": "ok", "redis": "ok"}`
3. Check Railway deployment logs for any startup errors
