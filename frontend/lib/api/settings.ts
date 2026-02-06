import type {
  UserProfileResponse,
  UpdateProfileResponse,
  ChangePasswordResponse,
  TransactionsResponse,
  UserPlanResponse,
  TransactionFilter,
} from "@/types"
import { MOCK_TRANSACTIONS, MOCK_USER_PLAN, AVAILABLE_PLANS } from "@/lib/data/settings"

const MOCK_USER = {
  id: "user-1",
  name: "Алексей Петров",
  email: "alex@example.com",
  plan: "starter" as const,
  credits: 47,
  projectsCount: 4,
  projectsLimit: 10,
  deployedCount: 2,
}

export async function getProfile(): Promise<UserProfileResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return { success: true, user: MOCK_USER }
}

export async function updateProfile(data: {
  name: string
  avatarFile: File | null
}): Promise<UpdateProfileResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  if (!data.name.trim()) {
    return { success: false, error: "Name is required" }
  }
  return { success: true, user: { ...MOCK_USER, name: data.name } }
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<ChangePasswordResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  if (!data.currentPassword) {
    return { success: false, error: "Current password is incorrect" }
  }
  return { success: true }
}

export async function getTransactions(params: {
  filter: TransactionFilter
  offset: number
  limit: number
}): Promise<TransactionsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  let filtered = MOCK_TRANSACTIONS
  if (params.filter !== "all") {
    filtered = MOCK_TRANSACTIONS.filter((t) => t.type === params.filter)
  }

  const sliced = filtered.slice(params.offset, params.offset + params.limit)
  const hasMore = params.offset + params.limit < filtered.length

  return { success: true, transactions: sliced, hasMore }
}

export async function getUserPlan(): Promise<UserPlanResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    success: true,
    planInfo: MOCK_USER_PLAN,
    availablePlans: AVAILABLE_PLANS,
  }
}
