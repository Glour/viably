const ACCESS_TOKEN_KEY = "viably_access_token"
const REFRESH_TOKEN_KEY = "viably_refresh_token"
const SESSION_COOKIE = "viably_session"

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  // Set flag cookie for proxy.ts middleware
  document.cookie = `${SESSION_COOKIE}=1; path=/; samesite=lax; max-age=${7 * 24 * 60 * 60}`
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  // Delete flag cookie
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    // Add 10 second buffer
    return payload.exp * 1000 < Date.now() + 10000
  } catch {
    return true
  }
}
