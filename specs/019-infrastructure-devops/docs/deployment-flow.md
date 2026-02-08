# Deployment Flow

## Overview

```
Developer → Push to feature branch → CI checks run
         → Create PR → CI checks + Vercel preview deploy
         → Merge to main → CI checks → Auto-deploy to production
```

## Flow Details

### 1. Feature Development

```
git checkout -b feature/my-feature
# ... develop ...
git push origin feature/my-feature
```

**Triggers**: GitHub Actions CI (lint, type-check, test, build)
**Frontend**: Vercel creates preview deployment on PR

### 2. Pull Request

- CI must pass before merge is allowed (branch protection)
- 1 review required
- Vercel preview URL posted as PR comment
- Preview deployment uses production-like environment

### 3. Merge to Main

```
# Merge PR via GitHub UI
# Auto-triggers:
# 1. GitHub Actions CI → verify all checks
# 2. Railway auto-deploy → backend + worker
# 3. Vercel auto-deploy → frontend
```

### 4. Production Deployment

| Component | Platform | Trigger | Duration |
|-----------|----------|---------|----------|
| Backend API | Railway | Push to main | ~3-5 min |
| Celery Worker | Railway | Push to main | ~3-5 min |
| Frontend | Vercel | Push to main | ~1-2 min |

### 5. Rollback

#### Backend (Railway)
1. Go to Railway → Deployments
2. Find the last successful deployment
3. Click "Redeploy"

#### Frontend (Vercel)
1. Go to Vercel → Deployments
2. Find the last successful deployment
3. Click "..." → "Promote to Production"

#### Database
- Railway provides point-in-time recovery (see backup-recovery.md)
- Always create manual backup before risky deployments

## Monitoring After Deploy

1. Check `https://api.viably.dev/health` → should return 200
2. Check Sentry for new errors
3. Check Railway/Vercel deployment logs
4. Verify UptimeRobot shows green status
