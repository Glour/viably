import { api, parseApiError } from "./client"
import { mapUser, toUpdateProfilePayload } from "./mappers"
import type { AuthUser, UpdateProfilePayload } from "@/types"

export async function fetchCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  try {
    const response = await api.get("users/me", { signal }).json<{ data: Record<string, unknown> }>()
    return mapUser(response.data)
  } catch (error) {
    await parseApiError(error)
    throw error // unreachable — parseApiError always throws, but satisfies TS
  }
}

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
