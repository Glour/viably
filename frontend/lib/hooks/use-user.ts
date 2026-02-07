import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"
import { fetchCurrentUser, updateProfile } from "@/lib/api/users"
import { useAuthStore } from "@/stores/auth"
import type { AuthUser, UpdateProfilePayload } from "@/types"

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<AuthUser>({
    queryKey: queryKeys.user.me,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled: isAuthenticated,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<AuthUser, Error, UpdateProfilePayload>({
    mutationFn: (payload) => updateProfile(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me })
      useAuthStore.getState().setUser(data)
    },
  })
}
