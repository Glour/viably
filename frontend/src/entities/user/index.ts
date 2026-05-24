/**
 * User Entity - Public API
 *
 * Exports types, hooks, and API functions for user management.
 */

// Types
export type { AuthUser, UserProfile, UpdateProfilePayload, PlanType } from "./types"

// Schemas
export { updateProfileSchema } from "./schemas"
export type { UpdateProfileFormData } from "./schemas"

// API functions (for direct use if needed)
export { fetchCurrentUser, updateProfile } from "./api"

// React Query hooks (primary interface)
export { useCurrentUser, useUpdateProfile, userQueryKeys } from "./hooks"
