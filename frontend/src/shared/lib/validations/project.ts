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

// Inferred TypeScript type
export type CreateProjectFormData = z.infer<typeof createProjectSchema>
