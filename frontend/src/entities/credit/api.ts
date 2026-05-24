/**
 * Credit Entity API
 *
 * API calls for credits, transactions, and daily bonuses.
 */

import { api, parseApiError } from "@/shared/api/client"
import type {
  CreditBalance,
  DailyBonusInfo,
  DailyBonusClaim,
  TransactionsPaginated,
  ApiCreditTransaction,
  PaginationMeta,
  TransactionFilters,
} from "./types"

/**
 * Map backend daily bonus response to DailyBonusInfo
 */
function mapDailyBonusInfo(raw: Record<string, unknown>): DailyBonusInfo {
  return {
    amount: raw.amount as number,
    claimedToday: raw.claimed_today as boolean,
    nextAvailableAt: (raw.next_available_at as string | null) ?? null,
    streakDays: (raw.streak_days as number) ?? 0,
  }
}

/**
 * Map backend credit balance response to CreditBalance
 */
function mapCreditBalance(raw: Record<string, unknown>): CreditBalance {
  const dailyBonusRaw = raw.daily_bonus as Record<string, unknown> | null
  return {
    credits: raw.credits as number,
    plan: raw.plan as string,
    dailyBonus: dailyBonusRaw ? mapDailyBonusInfo(dailyBonusRaw) : null,
  }
}

/**
 * Map backend daily bonus claim response to DailyBonusClaim
 */
function mapDailyBonusClaim(raw: Record<string, unknown>): DailyBonusClaim {
  return {
    claimed: raw.claimed as boolean,
    amount: raw.amount as number,
    newBalance: raw.new_balance as number,
    nextAvailableAt: raw.next_available_at as string,
  }
}

/**
 * Map backend credit transaction response to ApiCreditTransaction
 */
function mapCreditTransaction(raw: Record<string, unknown>): ApiCreditTransaction {
  return {
    id: raw.id as string,
    amount: raw.amount as number,
    balanceAfter: raw.balance_after as number,
    transactionType: raw.transaction_type as string,
    description: (raw.description as string | null) ?? null,
    projectId: (raw.project_id as string | null) ?? null,
    relatedUserId: (raw.related_user_id as string | null) ?? null,
    extraData: (raw.extra_data as Record<string, unknown>) ?? {},
    createdAt: raw.created_at as string,
  }
}

/**
 * Fetch credit balance
 */
export async function fetchCreditBalance(signal?: AbortSignal): Promise<CreditBalance> {
  try {
    const response = await api.get("credits/balance", { signal }).json<{ data: Record<string, unknown> }>()
    return mapCreditBalance(response.data)
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Fetch daily bonus status
 */
export async function fetchDailyBonusStatus(signal?: AbortSignal): Promise<DailyBonusInfo> {
  try {
    const response = await api.get("credits/daily-bonus", { signal }).json<{ data: Record<string, unknown> }>()
    return mapDailyBonusInfo(response.data)
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Claim daily bonus
 */
export async function claimDailyBonus(): Promise<DailyBonusClaim> {
  try {
    const response = await api.post("credits/daily-bonus").json<{ data: Record<string, unknown> }>()
    return mapDailyBonusClaim(response.data)
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Fetch credit transactions with pagination
 */
export async function fetchCreditTransactions(
  params?: TransactionFilters,
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
