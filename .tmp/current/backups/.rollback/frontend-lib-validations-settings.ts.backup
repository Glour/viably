import { z } from "zod"

/**
 * Profile update form validation schema
 */
export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
})

/**
 * Change password form validation schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

/**
 * Custom credits purchase form validation schema
 */
export const customCreditsSchema = z.object({
  amount: z
    .number()
    .min(10, "Minimum 10 credits")
    .max(10000, "Maximum 10000 credits"),
})

// Inferred TypeScript types
export type ProfileFormData = z.infer<typeof profileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type CustomCreditsFormData = z.infer<typeof customCreditsSchema>
