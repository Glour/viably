import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "@/lib/api/query-keys"
import {
  fetchCreditBalance,
  fetchDailyBonusStatus,
  claimDailyBonus,
  fetchCreditTransactions,
} from "@/lib/api/credits"
import type { CreditBalance, DailyBonusInfo, DailyBonusClaim, TransactionsPaginated } from "@/types"
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

export function useCreditTransactions(filters?: { type?: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useInfiniteQuery<TransactionsPaginated>({
    queryKey: queryKeys.credits.transactions(filters),
    queryFn: async ({ pageParam, signal }) => {
      const params = pageParam as { offset: number; limit: number }
      return fetchCreditTransactions(
        { offset: params.offset, limit: params.limit, type: filters?.type },
        signal
      )
    },
    initialPageParam: { offset: 0, limit: 20 },
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.meta.offset + lastPage.meta.limit
      return nextOffset < lastPage.meta.total
        ? { offset: nextOffset, limit: lastPage.meta.limit }
        : undefined
    },
    enabled: isAuthenticated,
  })
}
