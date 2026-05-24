/**
 * Credit Entity - Public API
 *
 * Exports types, hooks, schemas, and API functions for credit management.
 */

// Types
export type {
  CreditBalance,
  DailyBonusInfo,
  DailyBonusClaim,
  ApiCreditTransaction,
  TransactionsPaginated,
  PaginationMeta,
  TransactionFilters,
} from "./types"

// Schemas
export { transactionFilterSchema } from "./schemas"
export type { TransactionFilterFormData } from "./schemas"

// API functions (for direct use if needed)
export {
  fetchCreditBalance,
  fetchDailyBonusStatus,
  claimDailyBonus,
  fetchCreditTransactions,
} from "./api"

// React Query hooks (primary interface)
export {
  useCreditBalance,
  useDailyBonusStatus,
  useClaimDailyBonus,
  useCreditTransactions,
  creditQueryKeys,
} from "./hooks"
