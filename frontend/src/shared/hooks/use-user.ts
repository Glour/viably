import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/shared/api/query-keys"
import { getCurrentUser, updateProfile } from "@/features/auth/api"
import { useAuthStore } from "@/features/auth/stores"
import type { AuthUser, UpdateProfilePayload } from "@/shared/types"

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<AuthUser>({
    queryKey: queryKeys.user.me,
    queryFn: async () => getCurrentUser(),
    enabled: isAuthenticated,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<AuthUser, Error, Record<string, unknown>>({
    mutationFn: (payload) => updateProfile(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me })
      useAuthStore.getState().setUser(data)
    },
  })
}
