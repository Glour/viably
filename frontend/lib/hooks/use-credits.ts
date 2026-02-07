import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "@/lib/api/query-keys"
import {
  fetchCreditBalance,
  fetchDailyBonusStatus,
  claimDailyBonus,
} from "@/lib/api/credits"
import type { CreditBalance, DailyBonusInfo, DailyBonusClaim } from "@/types"
import { useAuthStore } from "@/stores/auth"

export function useCreditBalance() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<CreditBalance>({
    queryKey: queryKeys.credits.balance,
    queryFn: ({ signal }) => fetchCreditBalance(signal),
    enabled: isAuthenticated,
  })
}

export function useDailyBonusStatus() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<DailyBonusInfo>({
    queryKey: queryKeys.credits.dailyBonus,
    queryFn: ({ signal }) => fetchDailyBonusStatus(signal),
    enabled: isAuthenticated,
  })
}

export function useClaimDailyBonus() {
  const queryClient = useQueryClient()

  return useMutation<DailyBonusClaim, Error, void>({
    mutationFn: claimDailyBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.credits.balance })
      queryClient.invalidateQueries({ queryKey: queryKeys.credits.dailyBonus })
      toast.success("Бонус получен!")
    },
  })
}
