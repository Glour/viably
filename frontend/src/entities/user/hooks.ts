/**
 * User Entity React Query Hooks
 *
 * React Query hooks for user data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchCurrentUser, updateProfile } from "./api"
import type { AuthUser, UpdateProfilePayload } from "./types"

/**
 * Query keys for user-related queries
 */
export const userQueryKeys = {
  me: ["user", "me"] as const,
}

/**
 * Fetch current authenticated user
 *
 * @param isAuthenticated - Whether user is authenticated (from auth store)
 */
export function useCurrentUser(isAuthenticated: boolean) {
  return useQuery<AuthUser>({
    queryKey: userQueryKeys.me,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled: isAuthenticated,
  })
}

/**
 * Update user profile mutation
 *
 * @param onSuccess - Optional callback to run on successful update (e.g., update auth store)
 */
export function useUpdateProfile(onSuccess?: (user: AuthUser) => void) {
  const queryClient = useQueryClient()

  return useMutation<AuthUser, Error, UpdateProfilePayload>({
    mutationFn: (payload) => updateProfile(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.me })
      onSuccess?.(data)
    },
  })
}
