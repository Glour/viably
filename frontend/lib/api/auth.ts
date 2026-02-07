import { api, mapUserResponse, unwrapResponse, parseApiError } from "./client"
import type { AuthUser } from "@/types"

interface AuthApiResponse {
  data: {
    user: Record<string, unknown>
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }
}

interface TokenApiResponse {
  data: {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }
}

interface UserApiResponse {
  data: Record<string, unknown>
}

export async function loginApi(email: string, password: string) {
  try {
    const response = await api
      .post("auth/login", { json: { email, password } })
      .json<AuthApiResponse>()

    const { data } = response
    return {
      user: mapUserResponse(data.user),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  } catch (error) {
    await parseApiError(error)
  }
}

export async function registerApi(data: {
  email: string
  password: string
  fullName?: string
  referrerCode?: string
}) {
  try {
    const response = await api
      .post("auth/register", {
        json: {
          email: data.email,
          password: data.password,
          full_name: data.fullName,
          referrer_code: data.referrerCode,
        },
      })
      .json<AuthApiResponse>()

    const { data: responseData } = response
    return {
      user: mapUserResponse(responseData.user),
      accessToken: responseData.access_token,
      refreshToken: responseData.refresh_token,
    }
  } catch (error) {
    await parseApiError(error)
  }
}

export async function logoutApi(refreshToken?: string | null) {
  try {
    await api.post("auth/logout", {
      json: refreshToken ? { refresh_token: refreshToken } : undefined,
    })
  } catch {
    // Logout errors are non-critical — tokens are cleared locally regardless
  }
}

export async function refreshTokenApi(refreshToken: string) {
  try {
    const response = await api
      .post("auth/refresh", { json: { refresh_token: refreshToken } })
      .json<TokenApiResponse>()

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    }
  } catch (error) {
    await parseApiError(error)
  }
}

export async function forgotPasswordApi(email: string) {
  try {
    await api.post("auth/forgot-password", { json: { email } })
  } catch {
    // Don't reveal whether email exists — always show success
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get("users/me").json<UserApiResponse>()
  return mapUserResponse(response.data)
}
