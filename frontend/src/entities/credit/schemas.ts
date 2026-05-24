/**
 * Credit Entity Zod Schemas
 *
 * Validation schemas for credit-related data.
 */

import { z } from "zod"

/**
 * Transaction filter validation schema
 */
export const transactionFilterSchema = z.object({
  type: z.string().optional(),
  offset: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
})

export type TransactionFilterFormData = z.infer<typeof transactionFilterSchema>
