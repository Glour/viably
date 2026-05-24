/**
 * Credit Entity React Query Hooks
 *
 * React Query hooks for credits, transactions, and daily bonuses.
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchCreditBalance,
  fetchDailyBonusStatus,
  claimDailyBonus,
  fetchCreditTransactions,
} from "./api"
import type {
  CreditBalance,
  DailyBonusInfo,
  DailyBonusClaim,
  TransactionsPaginated,
  TransactionFilters,
} from "./types"

/**
 * Query keys for credit-related queries
 */
export const creditQueryKeys = {
  balance: ["credits", "balance"] as const,
  dailyBonus: ["credits", "dailyBonus"] as const,
  transactions: (filters?: Pick<TransactionFilters, "type">) => ["credits", "transactions", filters] as const,
}

/**
 * Fetch credit balance
 *
 * @param isAuthenticated - Whether user is authenticated
 */
export function useCreditBalance(isAuthenticated: boolean) {
  return useQuery<CreditBalance>({
    queryKey: creditQueryKeys.balance,
    queryFn: ({ signal }) => fetchCreditBalance(signal),
    enabled: isAuthenticated,
  })
}

/**
 * Fetch daily bonus status
 *
 * @param isAuthenticated - Whether user is authenticated
 */
export function useDailyBonusStatus(isAuthenticated: boolean) {
  return useQuery<DailyBonusInfo>({
    queryKey: creditQueryKeys.dailyBonus,
    queryFn: ({ signal }) => fetchDailyBonusStatus(signal),
    enabled: isAuthenticated,
  })
}

/**
 * Claim daily bonus mutation
 *
 * @param onSuccess - Optional callback to run on successful claim (e.g., show toast)
 */
export function useClaimDailyBonus(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation<DailyBonusClaim, Error, void>({
    mutationFn: claimDailyBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditQueryKeys.balance })
      queryClient.invalidateQueries({ queryKey: creditQueryKeys.dailyBonus })
      onSuccess?.()
    },
  })
}

/**
 * Fetch credit transactions with infinite scroll pagination
 *
 * @param isAuthenticated - Whether user is authenticated
 * @param filters - Optional filters (type)
 */
export function useCreditTransactions(isAuthenticated: boolean, filters?: Pick<TransactionFilters, "type">) {
  return useInfiniteQuery<TransactionsPaginated>({
    queryKey: creditQueryKeys.transactions(filters),
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
