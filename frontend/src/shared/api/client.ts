import ky, { HTTPError } from "ky"
import type { AuthUser } from "@/shared/types"
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./tokens"
import { getQueryClient } from "./query-client"
import { env } from "@/shared/config/env"

const API_BASE_URL = env.NEXT_PUBLIC_API_URL

// Concurrent refresh prevention
let refreshPromise: Promise<string | null> | null = null

async function refreshTokens(): Promise<string | null> {
  // If already refreshing, wait for the existing promise
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return null

      // Use raw ky (NOT the intercepted api instance) to avoid infinite loop
      const response = await ky
        .post(`${API_BASE_URL}/api/auth/refresh`, {
          json: { refresh_token: refreshToken },
          timeout: 10000,
          retry: 0,
        })
        .json<{ data: { access_token: string; refresh_token: string } }>()

      const newAccessToken = response.data.access_token
      const newRefreshToken = response.data.refresh_token
      setTokens(newAccessToken, newRefreshToken)
      return newAccessToken
    } catch {
      clearTokens()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export const api = ky.create({
  prefixUrl: `${API_BASE_URL}/api`,
  timeout: 30000,
  retry: 0, // We handle retries manually for 401
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAccessToken()
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        // Handle 401 — attempt token refresh (only if we had a token)
        if (response.status === 401) {
          const hadToken = !!getAccessToken()
          if (hadToken) {
            const newToken = await refreshTokens()
            if (newToken) {
              // Retry original request with new token
              request.headers.set("Authorization", `Bearer ${newToken}`)
              return ky(request)
            }
            // Refresh failed — redirect to login
            if (typeof window !== "undefined") {
              clearTokens()
              window.location.href = "/login"
            }
          }
          // No token = anonymous user, don't redirect
        }

        // Handle 403 — account deactivated (only if logged in)
        if (response.status === 403 && getAccessToken()) {
          if (typeof window !== "undefined") {
            clearTokens()
            window.location.href = "/login"
          }
        }
      },
    ],
  },
})

// === Response Mapping Utilities ===

/** Convert backend snake_case UserResponse to frontend camelCase AuthUser */
export function mapUserResponse(raw: Record<string, unknown>): AuthUser {
  return {
    id: raw.id as string,
    email: raw.email as string,
    fullName: (raw.full_name as string | null) ?? null,
    avatarUrl: (raw.avatar_url as string | null) ?? null,
    plan: raw.plan as AuthUser["plan"],
    credits: raw.credits as number,
    referralCode: raw.referral_code as string,
    isVerified: raw.is_verified as boolean,
    createdAt: raw.created_at as string,
    lastLoginAt: (raw.last_login_at as string | null) ?? null,
  }
}

/** Extract .data from backend { data: {...} } wrapper */
export function unwrapResponse<T>(response: { data: T }): T {
  return response.data
}

/** Map backend snake_case token response to camelCase */
export function mapTokenResponse(raw: Record<string, unknown>): {
  accessToken: string
  refreshToken: string
} {
  return {
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string,
  }
}

/** Transform ky HTTPError into typed ApiError */
export async function parseApiError(error: unknown): Promise<never> {
  // Import ApiError locally to avoid circular issues
  const { ApiError } = await import("@/shared/types")

  if (error instanceof HTTPError) {
    try {
      const body = await error.response.json()
      const detail = body.detail

      // Validation error array: [{ msg: "...", loc: ["body", "field"] }]
      if (Array.isArray(detail)) {
        const fieldErrors: Record<string, string> = {}
        const messages: string[] = []
        for (const item of detail) {
          const field = item.loc?.[item.loc.length - 1] as string
          const msg = item.msg as string
          if (field) fieldErrors[field] = msg
          messages.push(msg)
        }
        throw new ApiError(
          messages[0] || "Validation error",
          error.response.status,
          Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
        )
      }

      // String detail: { detail: "message" }
      if (typeof detail === "string") {
        throw new ApiError(detail, error.response.status)
      }

      throw new ApiError(error.message, error.response.status)
    } catch (parseError) {
      if (parseError instanceof ApiError) throw parseError
      throw new ApiError(error.message, error.response.status)
    }
  }

  // Network error (no connection)
  if (error instanceof TypeError) {
    throw new (await import("@/shared/types")).ApiError("Нет соединения с сервером", 0)
  }

  throw error
}

// === Cache Management ===

/**
 * Clear all React Query caches
 * Used on logout to ensure no stale data persists
 */
export function clearAllCaches(): void {
  if (typeof window !== "undefined") {
    const queryClient = getQueryClient()
    queryClient.clear()
  }
}
