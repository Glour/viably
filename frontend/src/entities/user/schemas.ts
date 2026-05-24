/**
 * User Entity Zod Schemas
 *
 * Validation schemas for user data.
 */

import { z } from "zod"

/**
 * Update profile validation schema
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Имя не может быть пустым")
    .max(100, "Имя слишком длинное (макс. 100 символов)")
    .nullable()
    .optional(),
  avatarUrl: z
    .string()
    .url("Некорректный URL аватара")
    .nullable()
    .optional(),
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
