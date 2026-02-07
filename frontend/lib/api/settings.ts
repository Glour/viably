// Re-exports from dedicated API modules
export { fetchCurrentUser as getProfile } from "./users"
export { updateProfile } from "./users"
// Stubs for unimplemented backend endpoints

import type { UserPlanInfo, SubscriptionPlan } from "@/types"
import { AVAILABLE_PLANS, MOCK_USER_PLAN } from "@/lib/data/settings"

export async function changePassword(_data: {
  currentPassword: string
  newPassword: string
}): Promise<{ success: boolean; error?: string }> {
  // TODO: Backend endpoint POST /api/users/me/password not yet implemented
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}

export async function getUserPlan(): Promise<{
  planInfo: UserPlanInfo
  availablePlans: SubscriptionPlan[]
}> {
  // TODO: Backend endpoint for plan info not yet implemented
  await new Promise((resolve) => setTimeout(resolve, 300))
  return { planInfo: MOCK_USER_PLAN, availablePlans: AVAILABLE_PLANS }
}
