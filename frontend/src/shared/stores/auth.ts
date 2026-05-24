import { create } from "zustand"
import type { AuthStoreState } from "@/shared/types"
import { api, mapUserResponse, parseApiError, clearAllCaches } from "@/shared/api/client"
import { setTokens, getAccessToken, clearTokens } from "@/shared/api/tokens"

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  ...initialState,

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
      const { getRefreshToken } = await import("@/shared/api/tokens")
      await api.post("auth/logout", {
        json: { refresh_token: getRefreshToken() },
      })
    } catch {
      // Even if server call fails, clear locally
    } finally {
      // Complete cleanup sequence on logout:

      // 1. Clear all React Query caches (server data)
      clearAllCaches()

      // 2. Reset all Zustand stores (client state)
      // Import stores dynamically to avoid circular dependencies
      const { useProjectsStore } = await import("./projects")
      const { useTemplatesStore } = await import("./templates")
      const { useGenerationStore } = await import("@/features/generation/stores/generation-store")
      const { useSettingsStore } = await import("./settings")

      useProjectsStore.getState().reset()
      useTemplatesStore.getState().reset()
      useGenerationStore.getState().reset()
      useSettingsStore.getState().reset()

      // 3. Clear authentication tokens from localStorage
      clearTokens()

      // 4. Reset auth store last (this store)
      set({ user: null, isAuthenticated: false })

      // 5. Redirect to login page
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

  /**
   * Resets the auth store to initial state
   * Clears user data and authentication status
   * Used for cleanup on logout or auth errors
   */
  reset: () => {
    set(initialState)
  },
}))
