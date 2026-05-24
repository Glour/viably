/**
 * Credit Entity Types
 *
 * Domain types for credits, transactions, and daily bonuses.
 */

/**
 * Daily bonus information
 */
export interface DailyBonusInfo {
  amount: number
  claimedToday: boolean
  nextAvailableAt: string | null
  streakDays: number
}

/**
 * Credit balance with plan info
 */
export interface CreditBalance {
  credits: number
  plan: string
  dailyBonus: DailyBonusInfo | null
}

/**
 * Daily bonus claim result
 */
export interface DailyBonusClaim {
  claimed: boolean
  amount: number
  newBalance: number
  nextAvailableAt: string
}

/**
 * Credit transaction (matches backend API)
 */
export interface ApiCreditTransaction {
  id: string
  amount: number
  balanceAfter: number
  transactionType: string
  description: string | null
  projectId: string | null
  relatedUserId: string | null
  extraData: Record<string, unknown>
  createdAt: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  limit: number
  offset: number
}

/**
 * Paginated transactions response
 */
export interface TransactionsPaginated {
  transactions: ApiCreditTransaction[]
  meta: PaginationMeta
}

/**
 * Transaction filters for list queries
 */
export interface TransactionFilters {
  offset?: number
  limit?: number
  type?: string
}
