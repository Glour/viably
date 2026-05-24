import { NextResponse, NextRequest } from "next/server"

const authRoutes = ["/login", "/register", "/forgot-password"]
const protectedRoutes = ["/dashboard", "/projects", "/settings", "/templates"]

/**
 * Next.js 16 Proxy with Auth + Performance Optimizations
 *
 * Combines:
 * 1. Authentication redirects (auth logic)
 * 2. Caching headers for static assets
 * 3. Performance hints
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has("viably_session")

  // Auth logic: redirect authenticated users from auth pages
  if (authRoutes.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Auth logic: redirect unauthenticated users from protected pages
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("returnUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Performance optimizations
  const response = NextResponse.next()

  // Aggressive caching for static assets
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/images/') ||
    pathname.match(/\.(woff2|woff|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // Moderate caching for pages
  if (pathname.endsWith('.html') || !pathname.includes('.')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  }

  // Prefetch hints for critical pages
  if (pathname === '/' || pathname === '/dashboard') {
    response.headers.set(
      'Link',
      '</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous, ' +
      '</fonts/space-grotesk.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous'
    )
  }

  response.headers.set('X-DNS-Prefetch-Control', 'on')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - monitoring/sentry routes
     * - _next/webpack-hmr (hot reload)
     */
    '/((?!api|monitoring|_next/webpack-hmr).*)',
  ],
}
