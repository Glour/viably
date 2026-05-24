/**
 * User Entity Types
 *
 * Domain types for user, profile, and authentication.
 */

export type PlanType = "free" | "starter" | "pro" | "business"

/**
 * Authenticated user with full profile information
 */
export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  plan: PlanType
  credits: number
  referralCode: string
  isVerified: boolean
  createdAt: string
  lastLoginAt: string | null
}

/**
 * User profile subset (for display purposes)
 */
export interface UserProfile extends Pick<AuthUser, "id" | "email" | "plan" | "credits"> {
  name: string
  projectsCount: number
  projectsLimit: number
  deployedCount: number
}

/**
 * Update profile payload
 */
export interface UpdateProfilePayload {
  fullName?: string | null
  avatarUrl?: string | null
}
