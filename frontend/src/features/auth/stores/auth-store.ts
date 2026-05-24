/**
 * Auth Feature Store
 *
 * Zustand store for authentication state management.
 * Uses feature API functions and entity hooks.
 */

import { create } from "zustand"
import type { AuthUser } from "@/entities/user"
import { loginApi, registerApi, logoutApi, getCurrentUser } from "../api"
import { setTokens, getAccessToken, clearTokens, getRefreshToken } from "@/shared/api/tokens"
import { clearAllCaches } from "@/shared/api/client"

export interface AuthStoreState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; fullName?: string; referrerCode?: string }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: AuthUser | null) => void
  reset: () => void
}

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  ...initialState,

  login: async (email: string, password: string) => {
    const result = await loginApi(email, password)
    setTokens(result.accessToken, result.refreshToken)
    set({ user: result.user, isAuthenticated: true })
  },

  register: async (data) => {
    const result = await registerApi(data)
    setTokens(result.accessToken, result.refreshToken)
    set({ user: result.user, isAuthenticated: true })
  },

  logout: async () => {
    try {
      const refreshToken = getRefreshToken()
      await logoutApi(refreshToken)
    } catch {
      // Even if server call fails, clear locally
    } finally {
      // Complete cleanup sequence on logout:

      // 1. Clear all React Query caches (server data)
      clearAllCaches()

      // 2. Reset all Zustand stores (client state)
      // Import stores dynamically to avoid circular dependencies
      const { useProjectsStore } = await import("@/features/projects/stores/projects-store")
      const { useTemplatesStore } = await import("@/features/templates/stores")
      const { useGenerationStore } = await import("@/features/generation/stores")
      const { useSettingsStore } = await import("@/features/settings/stores")

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
      const user = await getCurrentUser()
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
