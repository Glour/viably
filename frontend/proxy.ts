import { NextResponse, NextRequest } from "next/server"

const authRoutes = ["/login", "/register", "/forgot-password"]
const protectedRoutes = ["/dashboard"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has("session")

  // Authenticated users visiting auth pages → redirect to dashboard
  if (authRoutes.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Unauthenticated users visiting protected pages → redirect to login
  if (protectedRoutes.includes(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
}
