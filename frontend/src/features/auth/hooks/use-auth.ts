/**
 * Auth Feature Hook
 *
 * Main hook for authentication operations.
 * Combines auth store with entity hooks.
 */

import { useAuthStore } from "../stores/auth-store"
import { useCurrentUser } from "@/entities/user"

/**
 * Main authentication hook
 *
 * Provides auth state and operations.
 * Syncs with React Query for user data.
 */
export function useAuth() {
  const {
    user: storeUser,
    isLoading: storeLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    setUser,
  } = useAuthStore()

  // Sync with React Query user data (if authenticated)
  const { data: queryUser, isLoading: queryLoading } = useCurrentUser(isAuthenticated)

  // Use React Query user data if available, otherwise fallback to store
  const user = queryUser ?? storeUser
  const isLoading = storeLoading || queryLoading

  // Sync query user to store when it changes
  if (queryUser && queryUser !== storeUser) {
    setUser(queryUser)
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  }
}
