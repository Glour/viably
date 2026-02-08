# Vercel Setup Guide

## 1. Import Repository

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New" → "Project"
3. Import the `viably` repository from GitHub
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

## 2. Set Environment Variables

Add the following in Vercel project settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://api.viably.dev
NEXT_PUBLIC_WS_URL=wss://api.viably.dev
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SITE_URL=https://viably.dev
NEXT_PUBLIC_SENTRY_DSN=<from Sentry project>
NEXT_PUBLIC_POSTHOG_KEY=<from PostHog project>
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
SENTRY_AUTH_TOKEN=<from Sentry auth token>
```

Set for: Production, Preview, Development (adjust values per environment).

## 3. Configure Domains

1. Go to project → Settings → Domains
2. Add `viably.dev` as the primary domain
3. Add `www.viably.dev` with redirect to `viably.dev`
4. Vercel provides CNAME targets — add to DNS (see dns-setup.md)
5. SSL certificates are automatically provisioned

## 4. Preview Deployments

- Every pull request automatically gets a preview deployment
- Preview URL format: `viably-<hash>-<team>.vercel.app`
- Comments on PR with preview URL (requires Vercel GitHub App)

## 5. Auto-Deploy Configuration

- Pushes to `main` → automatic production deployment
- Pushes to other branches → preview deployment (if PR exists)
- Build cache enabled by default for faster deploys

## 6. Verify Deployment

1. Visit `https://viably.dev` — application should load
2. Visit `http://viably.dev` — should redirect to `https://viably.dev`
3. Visit `https://www.viably.dev` — should redirect to `https://viably.dev`
4. Check Vercel deployment logs for any build errors
