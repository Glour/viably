/**
 * Credit Check Utility
 * Feature: 017-websocket-generation (User Story 6)
 *
 * Provides utility functions for validating user credit balance
 * before generation operations.
 */

/**
 * Result of credit check validation
 */
export interface CreditCheckResult {
  /** Whether user has sufficient credits */
  hasSufficientCredits: boolean
  /** Current user credit balance */
  currentBalance: number
  /** Required credits for operation */
  requiredCredits: number
  /** Amount of credits missing (null if sufficient) */
  shortfall: number | null
}

/**
 * Check if user has sufficient credits for an operation
 *
 * @param currentBalance - User's current credit balance
 * @param requiredCredits - Credits required for the operation
 * @returns CreditCheckResult with validation details
 *
 * @example
 * ```ts
 * const result = checkCreditBalance(50, 100)
 * if (!result.hasSufficientCredits) {
 *   console.log(`Need ${result.shortfall} more credits`)
 * }
 * ```
 */
export function checkCreditBalance(
  currentBalance: number,
  requiredCredits: number
): CreditCheckResult {
  const hasSufficientCredits = currentBalance >= requiredCredits
  const shortfall = hasSufficientCredits ? null : requiredCredits - currentBalance

  return {
    hasSufficientCredits,
    currentBalance,
    requiredCredits,
    shortfall,
  }
}
