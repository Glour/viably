# Quickstart: API Client & Auth Flow

**Feature**: 015-api-client-auth
**Prerequisites**: Backend running on localhost:8000, Frontend dev server

## Setup

1. Install HTTP client:
```bash
cd frontend && npm install ky
```

2. Ensure `.env.local` exists:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Start backend:
```bash
cd backend && docker-compose up -d && uvicorn app.main:app --reload
```

4. Start frontend:
```bash
cd frontend && npm run dev
```

## Key Files (after implementation)

| File | Purpose |
|------|---------|
| `frontend/lib/api/client.ts` | ky instance с interceptors |
| `frontend/lib/api/tokens.ts` | Token storage (localStorage + flag cookie) |
| `frontend/lib/api/auth.ts` | Auth API functions (login, register, logout, refresh) |
| `frontend/stores/auth.ts` | Zustand auth store |
| `frontend/proxy.ts` | Next.js 16 middleware (route protection) |
| `frontend/types/index.ts` | AuthUser, AuthResponse types |
| `frontend/components/auth/protected-route.tsx` | Client-side auth guard |

## Verification

### Login flow
1. Open http://localhost:3000/login
2. Enter credentials → should redirect to /dashboard
3. Check localStorage: `viably_access_token` and `viably_refresh_token` should be set
4. Check cookie: `viably_session=1` should be present

### Token refresh
1. Wait 15 minutes (or manually delete access_token from localStorage)
2. Navigate to any protected page
3. Should auto-refresh without redirect to login

### Route protection
1. Clear localStorage and cookies
2. Try to open http://localhost:3000/dashboard
3. Should redirect to /login?returnUrl=%2Fdashboard
4. Login → should redirect back to /dashboard

### Logout
1. Click logout button
2. Should redirect to /login
3. localStorage should be empty, cookie removed
4. Back button should redirect to /login
