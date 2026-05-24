/**
 * Dashboard Feature API
 *
 * API functions for dashboard operations including credits and daily bonus.
 */

import { api } from "@/shared/api/client"
import type { CreditBalance, DailyBonusInfo, DailyBonusClaim, TransactionsPaginated } from "@/shared/types"

export async function fetchCreditBalance(signal?: AbortSignal): Promise<CreditBalance> {
  const response = await api.get("credits/balance", { signal }).json<{ data: CreditBalance }>()
  return response.data
}

export async function fetchDailyBonusStatus(signal?: AbortSignal): Promise<DailyBonusInfo> {
  const response = await api.get("credits/daily-bonus", { signal }).json<{ data: DailyBonusInfo }>()
  return response.data
}

export async function claimDailyBonus(): Promise<DailyBonusClaim> {
  const response = await api.post("credits/daily-bonus/claim").json<{ data: DailyBonusClaim }>()
  return response.data
}

export async function fetchCreditTransactions(
  params: { offset: number; limit: number; type?: string },
  signal?: AbortSignal
): Promise<TransactionsPaginated> {
  const searchParams = new URLSearchParams({
    offset: params.offset.toString(),
    limit: params.limit.toString(),
  })
  if (params.type) {
    searchParams.append("type", params.type)
  }
  const response = await api
    .get(`credits/transactions?${searchParams.toString()}`, { signal })
    .json<{ data: TransactionsPaginated }>()
  return response.data
}
