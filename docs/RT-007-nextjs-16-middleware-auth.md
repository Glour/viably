# RT-007: Next.js 16 Middleware Authentication Research

**Date**: 2026-02-07
**Researcher**: research-specialist
**Status**: Complete

---

## Executive Summary

Next.js 16 introduces significant changes to middleware with the transition from `middleware.ts` to `proxy.ts`. The new proxy system runs on **Node.js runtime** (not Edge), allowing full access to Node.js APIs but with performance trade-offs. For authentication, the recommended pattern is:

1. **Use `proxy.ts`** for lightweight cookie-based session checks (existence only, no heavy validation)
2. **Store JWT in httpOnly cookies** (not localStorage - inaccessible from middleware anyway)
3. **Perform detailed JWT validation in Server Components/Actions** (not in proxy)
4. **Configure matcher** to exclude API routes, static assets, and metadata files
5. **Use query parameters** for "return to" URLs when redirecting to login

**Key Finding**: While proxy.ts can technically access databases and verify JWTs (Node.js runtime), doing so adds significant latency to TTFB for every request. Keep proxy logic lightweight and perform detailed auth in Server Components.

---

## 1. How Does `proxy.ts` Work in Next.js 16?

### Migration from `middleware.ts` to `proxy.ts`

**Breaking Change**: Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`.

- **Old (middleware.ts)**: Exported a `middleware` function, ran on Edge Runtime (limited APIs)
- **New (proxy.ts)**: Export a `proxy` function, runs on **Node.js runtime only** (full APIs)

**Why the change?**
- Security: CVE-2025-29927 vulnerability where Edge middleware auth could be bypassed under high load
- Naming clarity: "proxy" better reflects its role as a lightweight routing layer
- Node.js access: Full Node.js API support (crypto, file system, etc.)

**Migration Example**:

```typescript
// OLD: middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // auth logic
}

export const config = {
  matcher: '/dashboard/:path*'
}
```

```typescript
// NEW: proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  // auth logic
}

export const config = {
  matcher: '/dashboard/:path*'
}
```

**Runtime**: `proxy.ts` **ONLY runs on Node.js runtime** - the Edge runtime is not supported and cannot be configured.

---

## 2. NextRequest and NextResponse API

### NextRequest

`NextRequest` extends the native Request interface with Next.js-specific conveniences:

**Key Properties**:
- `req.nextUrl.pathname` - Current route path (e.g., `/dashboard/projects`)
- `req.nextUrl.searchParams` - URL query parameters
- `req.cookies` - RequestCookies API for reading cookies
- `req.url` - Full request URL

**Reading Cookies**:

```typescript
import { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Get a single cookie
  const sessionCookie = request.cookies.get('session')
  console.log(sessionCookie) // => { name: 'session', value: '...', path: '/' }

  // Get all cookies
  const allCookies = request.cookies.getAll()

  // Check if cookie exists
  const hasSession = request.cookies.has('session') // => true/false
}
```

**Reading Query Parameters**:

```typescript
export function proxy(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const returnUrl = searchParams.get('returnUrl') // /api/search?returnUrl=/dashboard

  // returnUrl is "/dashboard" for /login?returnUrl=/dashboard
}
```

### NextResponse

`NextResponse` provides methods for manipulating and returning responses:

**Core Methods**:
- `NextResponse.next()` - Allow request to proceed (no action)
- `NextResponse.redirect(url)` - Redirect to another URL
- `NextResponse.rewrite(url)` - Internal rewrite (client doesn't see URL change)
- `response.cookies` - ResponseCookies API for setting cookies

**Setting Cookies**:

```typescript
import { NextResponse } from 'next/server'

export function proxy(request) {
  const response = NextResponse.next()

  // Simple set
  response.cookies.set('vercel', 'fast')

  // With full options
  response.cookies.set({
    name: 'session',
    value: 'token-value',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  })

  return response
}
```

**Redirecting with Query Parameters**:

```typescript
import { NextResponse } from 'next/server'

export function proxy(request) {
  const loginUrl = new URL('/login', request.url)

  // Add "return to" URL as query parameter
  loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname)

  return NextResponse.redirect(loginUrl)
  // Redirects to: /login?returnUrl=/dashboard/projects
}
```

---

## 3. Can Middleware Read localStorage?

**Answer: NO - localStorage is completely inaccessible from middleware/proxy.**

### Why?

1. **Server-side execution**: Middleware runs on the server (Node.js runtime in Next.js 16)
2. **No browser APIs**: `window`, `localStorage`, `sessionStorage` are browser-only objects
3. **Architectural constraint**: Even if you try, you'll get `ReferenceError: localStorage is not defined`

### Solution: Use Cookies Instead

Cookies are transmitted via HTTP headers and are accessible in middleware:

```typescript
// ❌ WRONG - localStorage not available
export function proxy(request: NextRequest) {
  const token = localStorage.getItem('token') // ReferenceError!
}

// ✅ CORRECT - Use cookies
export function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value
}
```

**Client-side (React component)**:

```typescript
// After login, store JWT in httpOnly cookie (set by backend)
// DO NOT store in localStorage if you need middleware to read it
```

---

## 4. Can Middleware Read Cookies?

**Answer: YES - Cookies are fully accessible via `request.cookies`.**

### Reading Cookies

```typescript
import { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Get single cookie
  const sessionCookie = request.cookies.get('session')

  if (sessionCookie) {
    console.log(sessionCookie.name)   // "session"
    console.log(sessionCookie.value)  // "encrypted-jwt-token"
    console.log(sessionCookie.path)   // "/"
  }

  // Check existence
  if (request.cookies.has('session')) {
    // User has session cookie
  }

  // Get all cookies
  const allCookies = request.cookies.getAll()
}
```

### Setting Cookies in Response

```typescript
import { NextResponse } from 'next/server'

export function proxy(request) {
  const response = NextResponse.next()

  response.cookies.set({
    name: 'session',
    value: 'encrypted-token',
    path: '/',
    httpOnly: true,  // Not accessible from client-side JS
    secure: true,     // HTTPS only (production)
    sameSite: 'lax',  // CSRF protection
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  })

  return response
}
```

---

## 5. Best Pattern for Auth Middleware with JWT in Cookies

### Recommended Pattern: Optimistic Cookie Check Only

**Philosophy**: Keep proxy.ts lightweight - check for session cookie existence, defer validation to Server Components.

```typescript
// proxy.ts
import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/app/lib/session' // Optional: lightweight check
import { cookies } from 'next/headers'

// 1. Define protected and public routes
const protectedRoutes = ['/dashboard', '/projects', '/templates', '/settings']
const publicRoutes = ['/login', '/register', '/']

export default async function proxy(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route =>
    path.startsWith(route)
  )
  const isPublicRoute = publicRoutes.some(route =>
    path === route || path.startsWith(route)
  )

  // 3. Get session cookie (lightweight check - existence only)
  const cookie = (await cookies()).get('session')?.value

  // Optional: Decrypt to check if valid (keep lightweight!)
  // For heavy validation, move to Server Component
  const session = cookie ? await decrypt(cookie) : null

  // 4. Redirect to /login if user is not authenticated
  if (isProtectedRoute && !session?.userId) {
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('returnUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Redirect to /dashboard if user is authenticated and on auth page
  if (
    isPublicRoute &&
    session?.userId &&
    (path === '/login' || path === '/register')
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}

// Routes Proxy should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
```

### Key Principles

1. **Lightweight checks only**: Verify cookie existence or minimal decryption
2. **No database calls**: Avoid latency on every request
3. **No heavy JWT verification**: Full signature validation in Server Components
4. **Pattern-based route matching**: Use `startsWith()` for route groups
5. **Query params for returnUrl**: Preserve user's intended destination

### Session Decryption (Optional)

If you need minimal validation in proxy, keep it lightweight:

```typescript
// lib/session.ts
import { jwtVerify, SignJWT } from 'jose'

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function decrypt(session: string | undefined) {
  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload // { userId: '...', expiresAt: ... }
  } catch (error) {
    console.error('Failed to decrypt session', error)
    return null
  }
}
```

**CAUTION**: Even lightweight JWT verification adds latency. For high-traffic apps, prefer existence checks only and validate in Server Components.

---

## 6. How to Configure `matcher` to Protect Specific Routes

### Basic Matcher Patterns

**String matcher**:

```typescript
export const config = {
  matcher: '/dashboard/:path*', // Matches /dashboard/* recursively
}
```

**Array matcher**:

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/templates/:path*',
    '/settings/:path*',
  ],
}
```

**Regex exclusion pattern** (recommended):

```typescript
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
```

### Common Exclusion Patterns

**Exclude API routes and static assets**:

```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png$).*)',
  ],
}
```

**Exclude multiple file types**:

```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.(png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
}
```

**Exclude health checks and webhooks**:

```typescript
export const config = {
  matcher: [
    '/((?!api|_next|health|webhooks|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
```

### Matcher Precedence

When using both inclusion and exclusion:

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',    // Include dashboard
    '/projects/:path*',     // Include projects
    '/((?!api).*)',         // Exclude API routes
  ],
}
```

**Best Practice**: Use a single negative lookahead regex for simplicity:

```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)',],
}
```

---

## 7. Redirect from Auth Pages to Dashboard if Authenticated

### Pattern: Check Session on Public Routes

```typescript
// proxy.ts
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const cookie = (await cookies()).get('session')?.value
  const session = cookie ? await decrypt(cookie) : null

  // Define auth pages
  const authPages = ['/login', '/register', '/forgot-password']
  const isAuthPage = authPages.includes(path)

  // Redirect authenticated users away from auth pages
  if (isAuthPage && session?.userId) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}
```

### With returnUrl Support

If user came from a protected route with `?returnUrl=/projects`, redirect there instead:

```typescript
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const cookie = (await cookies()).get('session')?.value
  const session = cookie ? await decrypt(cookie) : null

  const authPages = ['/login', '/register']
  const isAuthPage = authPages.includes(path)

  if (isAuthPage && session?.userId) {
    // Check if returnUrl exists
    const returnUrl = req.nextUrl.searchParams.get('returnUrl')

    // Validate returnUrl (prevent open redirect)
    const validReturnUrl = returnUrl && returnUrl.startsWith('/')
      ? returnUrl
      : '/dashboard'

    return NextResponse.redirect(new URL(validReturnUrl, req.nextUrl))
  }

  return NextResponse.next()
}
```

**Security Note**: Always validate `returnUrl` to prevent open redirect vulnerabilities. Only allow relative paths starting with `/`.

---

## 8. How to Pass "Return To" URL as Query Parameter

### Pattern: Set `returnUrl` When Redirecting to Login

```typescript
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const cookie = (await cookies()).get('session')?.value
  const session = cookie ? await decrypt(cookie) : null

  const protectedRoutes = ['/dashboard', '/projects', '/templates', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  if (isProtectedRoute && !session?.userId) {
    const loginUrl = new URL('/login', req.nextUrl)

    // Add current path as returnUrl
    loginUrl.searchParams.set('returnUrl', req.nextUrl.pathname)

    // Preserve existing query parameters (optional)
    req.nextUrl.searchParams.forEach((value, key) => {
      loginUrl.searchParams.set(key, value)
    })

    return NextResponse.redirect(loginUrl)
    // Redirects to: /login?returnUrl=/dashboard/projects
  }

  return NextResponse.next()
}
```

### Client-Side: Use `returnUrl` After Login

```typescript
// app/login/page.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  async function handleLogin(credentials) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (res.ok) {
      // Redirect to returnUrl or default to dashboard
      router.push(returnUrl || '/dashboard')
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {/* Login form */}
    </form>
  )
}
```

### Server-Side: Set Session Cookie and Redirect

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/session'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  // Validate credentials (your logic)
  const user = await validateUser(email, password)

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Create session token
  const session = await encrypt({ userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })

  // Get returnUrl from query params (if present)
  const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/dashboard'

  // Create response with redirect
  const response = NextResponse.redirect(new URL(returnUrl, request.url))

  // Set session cookie
  response.cookies.set({
    name: 'session',
    value: session,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  })

  return response
}
```

---

## 9. JWT Cookie Security Best Practices

### Cookie Configuration

**Always set these flags**:

```typescript
response.cookies.set({
  name: 'session',
  value: encryptedJwt,
  httpOnly: true,      // ✅ Prevents client-side JS access (XSS protection)
  secure: true,        // ✅ HTTPS only (set in production)
  sameSite: 'lax',     // ✅ CSRF protection (or 'strict' for tighter security)
  path: '/',           // ✅ Available across entire app
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
})
```

### Why httpOnly?

- **Prevents XSS attacks**: Client-side JS cannot access the cookie, so malicious scripts can't steal tokens
- **Not accessible from `document.cookie`**: Third-party scripts can't read it
- **Still sent with requests**: Browser automatically includes it in HTTP headers

### Why secure?

- **HTTPS only**: Cookie won't be sent over unencrypted HTTP connections
- **Man-in-the-middle protection**: Prevents token interception on insecure networks

### Why sameSite?

- **CSRF protection**: Limits cross-site request forgery attacks
- **Values**:
  - `strict`: Cookie only sent for same-site requests (strict CSRF protection, may break legitimate flows)
  - `lax`: Cookie sent for top-level navigation (e.g., clicking a link) but not for cross-site POST requests (recommended)
  - `none`: Cookie sent with all requests (requires `secure: true`)

### JWT Payload Recommendations

**DO include**:
- `userId` - User identifier
- `role` - User role (for authorization)
- `expiresAt` - Token expiration timestamp
- `iat` (issued at) - Timestamp of token creation

**DON'T include**:
- Passwords or password hashes
- Personally identifiable information (PII) like email, phone, address
- Sensitive data (API keys, secrets)
- Large objects (keep payload small)

### Token Lifecycle

1. **Short-lived tokens**: Use 15-30 minute expiration for access tokens
2. **Refresh tokens**: Store in separate httpOnly cookie, longer lifespan (7-30 days)
3. **Token rotation**: Issue new tokens on each request (rolling sessions)
4. **Invalidation**: Support server-side session revocation (database-backed sessions)

---

## 10. Complete Production-Ready Example

```typescript
// proxy.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'

// Route configuration
const protectedRoutes = ['/dashboard', '/projects', '/templates', '/settings']
const authRoutes = ['/login', '/register', '/forgot-password']
const publicRoutes = ['/', '/about', '/pricing', '/contact']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Check route type
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isAuthRoute = authRoutes.includes(path)
  const isPublicRoute = publicRoutes.includes(path)

  // Get session cookie
  const sessionCookie = (await cookies()).get('session')?.value
  const session = sessionCookie ? await decrypt(sessionCookie) : null

  // 1. Protected route without session → redirect to login with returnUrl
  if (isProtectedRoute && !session?.userId) {
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('returnUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Auth route with session → redirect to dashboard or returnUrl
  if (isAuthRoute && session?.userId) {
    const returnUrl = req.nextUrl.searchParams.get('returnUrl')
    const validReturnUrl = returnUrl && returnUrl.startsWith('/')
      ? returnUrl
      : '/dashboard'
    return NextResponse.redirect(new URL(validReturnUrl, req.nextUrl))
  }

  // 3. Public route or valid session → proceed
  return NextResponse.next()
}

// Exclude API routes, static files, and metadata
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
```

```typescript
// lib/session.ts
import { jwtVerify, SignJWT } from 'jose'

const secretKey = process.env.SESSION_SECRET!
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: { userId: string; expiresAt: number }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined) {
  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as { userId: string; expiresAt: number }
  } catch (error) {
    console.error('Session decryption failed:', error)
    return null
  }
}
```

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/session'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  // Validate credentials
  const user = await validateUser(email, password)
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Create session
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  const session = await encrypt({ userId: user.id, expiresAt })

  // Set cookie
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: 'session',
    value: session,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  })

  return response
}
```

---

## Key Takeaways

1. **Use `proxy.ts` (not `middleware.ts`)** in Next.js 16
2. **Node.js runtime only** - Edge runtime not supported, cannot be configured
3. **Keep proxy lightweight** - Check cookie existence, defer validation to Server Components
4. **localStorage is inaccessible** - Use httpOnly cookies for auth tokens
5. **Cookies are fully accessible** - Use `request.cookies` API
6. **Configure matcher to exclude** API routes, static files, and metadata
7. **Use `returnUrl` query param** to preserve user's intended destination
8. **Redirect authenticated users** away from auth pages (/login, /register)
9. **Always set httpOnly, secure, sameSite** on session cookies
10. **Validate returnUrl** to prevent open redirect vulnerabilities (only allow relative paths)

---

## Performance Considerations

### Node.js Runtime Trade-offs

**Advantages**:
- Full Node.js API access (crypto, file system, etc.)
- Can perform JWT verification directly
- Can connect to databases (if needed)

**Disadvantages**:
- **Adds latency to TTFB** (Time To First Byte) for every request
- Not as fast as Edge Runtime (which was optimized for low-latency checks)
- Database calls in proxy block all requests (not recommended)

**Recommendation**: Keep proxy logic minimal. For high-traffic apps, only check cookie existence and perform full JWT validation in Server Components where you need the data anyway.

---

## Sources

- [Next.js 16: What's New for Authentication and Authorization - Auth0](https://auth0.com/blog/whats-new-nextjs-16/)
- [Next.js 16: What's New for Authentication and Authorization - Medium](https://medium.com/@reactjsbd/next-js-16-whats-new-for-authentication-and-authorization-1fed6647cfcc)
- [Next.js 16 Update: middleware Is Now proxy - Medium](https://medium.com/@amitupadhyay878/next-js-16-update-middleware-js-5a020bdf9ca7)
- [Stop Crying Over Auth: A Senior Dev's Guide to Next.js 16 & Auth.js v5](https://javascript.plainenglish.io/stop-crying-over-auth-a-senior-devs-guide-to-next-js-15-auth-js-v5-42a57bc5b4ce)
- [Next.js 16 Official Blog](https://nextjs.org/blog/next-16)
- [Upgrading: Version 16 - Next.js Docs](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [File-system conventions: proxy.js - Next.js Docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [API Reference: Edge Runtime - Next.js](https://nextjs.org/docs/app/api-reference/edge)
- [How to Fix "Edge Runtime" Limitations in Next.js](https://oneuptime.com/blog/post/2026-01-24-fix-nextjs-edge-runtime-limitations/view)
- [Docs: proxy runtime is inconsistent (edge vs nodejs) - GitHub Issue](https://github.com/vercel/next.js/issues/85344)
- [Node.js runtime support for Next.js Middleware - GitHub Discussion](https://github.com/vercel/next.js/discussions/71727)
- [Goodbye middleware.ts, Hello proxy.ts: The Next.js 16 Migration Guide](https://www.rabinarayanpatra.com/blogs/hello-proxy-ts-nextjs-16)
- [Netxjs Middleware with localstorage or cookies - GitHub Discussion](https://github.com/vercel/next.js/discussions/52463)
- [Guides: Authentication - Next.js Official Docs](https://nextjs.org/docs/app/guides/authentication)
- [Next.js: Using HTTP-Only Cookies for Secure Authentication (2023) - Max Schmitt](https://maxschmitt.me/posts/next-js-http-only-cookie-auth-tokens)
- [Implementing Robust Cookie Management for Next.js Applications - Wisp CMS](https://www.wisp.blog/blog/implementing-robust-cookie-management-for-nextjs-applications)
- [Implementing JWT Middleware in Next.js: A Complete Guide to Auth - Medium](https://leapcell.medium.com/implementing-jwt-middleware-in-next-js-a-complete-guide-to-auth-300d9c7fcae2)
- [Ultimate Guide to Securing JWT Authentication with httpOnly Cookies - Wisp CMS](https://www.wisp.blog/blog/ultimate-guide-to-securing-jwt-authentication-with-httponly-cookies)
- [Next.js v16.1.5 Documentation - Context7](https://github.com/vercel/next.js/blob/v16.1.5/docs/)
