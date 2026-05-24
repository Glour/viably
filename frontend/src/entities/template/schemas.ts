/**
 * Template Entity Zod Schemas
 *
 * Validation schemas for template data.
 */

import { z } from "zod"

/**
 * Template filter validation schema
 */
export const templateFilterSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
})

export type TemplateFilterFormData = z.infer<typeof templateFilterSchema>
