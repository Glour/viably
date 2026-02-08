# DNS Configuration Guide

## Prerequisites

- Domain `viably.dev` purchased and accessible via DNS provider
- Railway backend service deployed (for CNAME target)
- Vercel frontend project created (for CNAME target)

## DNS Records

| Host | Type | Value | Purpose |
|------|------|-------|---------|
| `viably.dev` | CNAME | `cname.vercel-dns.com` | Frontend (Vercel) |
| `www` | CNAME | `cname.vercel-dns.com` | Redirect to apex |
| `api` | CNAME | `<your-service>.up.railway.app` | Backend API (Railway) |

**Note**: If your DNS provider doesn't support CNAME at the apex (root), use an ALIAS or ANAME record instead, or use Vercel's nameservers.

## Setup Steps

### 1. Frontend (viably.dev → Vercel)

1. In your DNS provider, add a CNAME record:
   - **Host**: `@` or blank (apex domain)
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: Auto or 3600
2. Add another CNAME for www:
   - **Host**: `www`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: Auto or 3600

### 2. Backend (api.viably.dev → Railway)

1. Get your Railway CNAME target:
   - Go to Railway → Backend service → Settings → Networking
   - Copy the generated domain (e.g., `viably-backend-production.up.railway.app`)
2. In your DNS provider, add a CNAME record:
   - **Host**: `api`
   - **Value**: `<your-railway-domain>.up.railway.app`
   - **TTL**: Auto or 3600

### 3. SSL Certificates

- **Vercel**: Automatically provisions and renews Let's Encrypt certificates
- **Railway**: Automatically provisions and renews certificates for custom domains
- No manual SSL configuration needed

## Verification

After DNS propagation (usually 5-60 minutes):

```bash
# Check frontend DNS
dig viably.dev CNAME +short

# Check backend DNS
dig api.viably.dev CNAME +short

# Check HTTPS
curl -I https://viably.dev
curl -I https://api.viably.dev/health

# Check HTTP redirect
curl -I http://viably.dev

# Check www redirect
curl -I https://www.viably.dev
```

## Troubleshooting

- **DNS not resolving**: Wait up to 48 hours for full propagation. Use `dig` to check current status.
- **SSL certificate pending**: Vercel and Railway need DNS to be correct before issuing certificates. Verify CNAME records.
- **www not redirecting**: Ensure www CNAME is set to `cname.vercel-dns.com` and www redirect is configured in Vercel domain settings.
