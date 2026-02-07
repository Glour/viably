import { create } from "zustand"
import type { AuthStoreState } from "@/types"
import { api, mapUserResponse, parseApiError } from "@/lib/api/client"
import { setTokens, getAccessToken, clearTokens } from "@/lib/api/tokens"

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await api
        .post("auth/login", { json: { email, password } })
        .json<{ data: { user: Record<string, unknown>; access_token: string; refresh_token: string } }>()

      const { user: rawUser, access_token, refresh_token } = response.data
      setTokens(access_token, refresh_token)
      const user = mapUserResponse(rawUser)
      set({ user, isAuthenticated: true })
    } catch (error) {
      await parseApiError(error)
    }
  },

  register: async (data) => {
    try {
      const response = await api
        .post("auth/register", {
          json: {
            email: data.email,
            password: data.password,
            full_name: data.fullName,
            referrer_code: data.referrerCode,
          },
        })
        .json<{ data: { user: Record<string, unknown>; access_token: string; refresh_token: string } }>()

      const { user: rawUser, access_token, refresh_token } = response.data
      setTokens(access_token, refresh_token)
      const user = mapUserResponse(rawUser)
      set({ user, isAuthenticated: true })
    } catch (error) {
      await parseApiError(error)
    }
  },

  logout: async () => {
    try {
      const { getRefreshToken } = await import("@/lib/api/tokens")
      await api.post("auth/logout", {
        json: { refresh_token: getRefreshToken() },
      })
    } catch {
      // Even if server call fails, clear locally
    } finally {
      clearTokens()
      set({ user: null, isAuthenticated: false })
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
  },

  checkAuth: async () => {
    const token = getAccessToken()
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }

    try {
      const response = await api
        .get("users/me")
        .json<{ data: Record<string, unknown> }>()

      const user = mapUserResponse(response.data)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      clearTokens()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: user !== null })
  },
}))
