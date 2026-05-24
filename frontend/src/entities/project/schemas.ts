/**
 * Project Entity Zod Schemas
 *
 * Validation schemas for project data.
 */

import { z } from "zod"

/**
 * Create project form validation schema
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Название должно содержать минимум 3 символа")
    .max(100, "Название слишком длинное (макс. 100 символов)"),
  description: z
    .string()
    .max(500, "Описание слишком длинное (макс. 500 символов)")
    .optional(),
  templateId: z.string().optional(),
})

/**
 * Update project form validation schema
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Название должно содержать минимум 3 символа")
    .max(100, "Название слишком длинное (макс. 100 символов)")
    .optional(),
  description: z
    .string()
    .max(500, "Описание слишком длинное (макс. 500 символов)")
    .optional(),
  isPublic: z.boolean().optional(),
})

// Inferred TypeScript types
export type CreateProjectFormData = z.infer<typeof createProjectSchema>
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>
