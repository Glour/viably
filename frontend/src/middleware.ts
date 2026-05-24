import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/projects",
  "/templates",
  "/settings",
  "/subscription",
  "/credits",

  "/payments",
]

// Public routes (never redirect)
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/auth",
  "/(auth)",
  "/pricing",
  "/about",
  "/blog",
  "/privacy",
  "/terms",
  "/demo",
  "/_next",
  "/api",
  "/favicon",
]

function isProtected(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
}

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('locale')?.value
  if (cookieLocale && ['en', 'ru', 'pt'].includes(cookieLocale)) return cookieLocale
  
  const acceptLang = request.headers.get('accept-language') ?? ''
  if (acceptLang.toLowerCase().includes('ru')) return 'ru'
  if (acceptLang.toLowerCase().includes('pt')) return 'pt'
  return 'ru'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Автоматически ставим locale cookie если её нет
  if (!request.cookies.get('locale')) {
    const locale = detectLocale(request)
    response.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  }

  if (!isProtected(pathname)) return response

  // Check for access token in cookies or Authorization header
  const tokenCookie = request.cookies.get("viably_access_token")?.value
  // Next.js middleware can't read localStorage — token stored there is checked client-side.
  // We use a session cookie set by the auth flow as the signal.
  const sessionCookie = request.cookies.get("viably_session")?.value

  if (!tokenCookie && !sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    const redirect = NextResponse.redirect(loginUrl)
    if (!request.cookies.get('locale')) {
      const locale = detectLocale(request)
      redirect.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
    return redirect
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - Public file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
}
