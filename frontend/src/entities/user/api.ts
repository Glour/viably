/**
 * User Entity API
 *
 * API calls for user data management.
 */

import { api, parseApiError } from "@/shared/api/client"
import type { AuthUser, UpdateProfilePayload } from "./types"

/**
 * Map backend user response to AuthUser
 */
function mapUser(raw: Record<string, unknown>): AuthUser {
  return {
    id: raw.id as string,
    email: raw.email as string,
    fullName: (raw.full_name as string | null) ?? null,
    avatarUrl: (raw.avatar_url as string | null) ?? null,
    plan: raw.plan as AuthUser["plan"],
    credits: raw.credits as number,
    referralCode: raw.referral_code as string,
    isVerified: raw.is_verified as boolean,
    createdAt: raw.created_at as string,
    lastLoginAt: (raw.last_login_at as string | null) ?? null,
  }
}

/**
 * Convert UpdateProfilePayload to backend format (snake_case)
 */
function toUpdateProfilePayload(data: UpdateProfilePayload): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.fullName !== undefined) payload.full_name = data.fullName
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl
  return payload
}

/**
 * Fetch current authenticated user
 */
export async function fetchCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  try {
    const response = await api.get("users/me", { signal }).json<{ data: Record<string, unknown> }>()
    return mapUser(response.data)
  } catch (error) {
    await parseApiError(error)
    throw error // unreachable — parseApiError always throws, but satisfies TS
  }
}

/**
 * Update user profile
 */
export async function updateProfile(payload: UpdateProfilePayload, signal?: AbortSignal): Promise<AuthUser> {
  try {
    const response = await api
      .patch("users/me", { json: toUpdateProfilePayload(payload), signal })
      .json<{ data: Record<string, unknown> }>()
    return mapUser(response.data)
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}
