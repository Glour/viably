import { api, parseApiError } from "./client"
import {
  mapCreditBalance,
  mapDailyBonusInfo,
  mapDailyBonusClaim,
  mapCreditTransaction,
} from "./mappers"
import type {
  CreditBalance,
  DailyBonusInfo,
  DailyBonusClaim,
  TransactionsPaginated,
  ApiCreditTransaction,
  PaginationMeta,
} from "@/types"

export async function fetchCreditBalance(signal?: AbortSignal): Promise<CreditBalance> {
  try {
    const response = await api.get("credits/balance", { signal }).json<{ data: Record<string, unknown> }>()
    return mapCreditBalance(response.data)
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

export async function fetchDailyBonusStatus(signal?: AbortSignal): Promise<DailyBonusInfo> {
  try {
    const response = await api.get("credits/daily-bonus", { signal }).json<{ data: Record<string, unknown> }>()
    return mapDailyBonusInfo(response.data)
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

export async function claimDailyBonus(): Promise<DailyBonusClaim> {
  try {
    const response = await api.post("credits/daily-bonus").json<{ data: Record<string, unknown> }>()
    return mapDailyBonusClaim(response.data)
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

export async function fetchCreditTransactions(
  params?: { offset?: number; limit?: number; type?: string },
  signal?: AbortSignal
): Promise<TransactionsPaginated> {
  try {
    const searchParams: Record<string, string | number> = {}
    if (params?.offset !== undefined) searchParams.offset = params.offset
    if (params?.limit !== undefined) searchParams.limit = params.limit
    if (params?.type) searchParams.type = params.type

    const response = await api
      .get("credits/transactions", { searchParams, signal })
      .json<{ data: Record<string, unknown>[]; meta: Record<string, unknown> }>()

    const transactions: ApiCreditTransaction[] = response.data.map((raw) =>
      mapCreditTransaction(raw as Record<string, unknown>)
    )
    const meta: PaginationMeta = {
      total: (response.meta?.total as number) ?? 0,
      limit: (response.meta?.limit as number) ?? 20,
      offset: (response.meta?.offset as number) ?? 0,
    }

    return { transactions, meta }
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}
