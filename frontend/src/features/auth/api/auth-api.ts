/**
 * Auth Feature API
 *
 * API functions for authentication operations.
 * Uses entity hooks for user data management.
 */

import { api, parseApiError, mapUserResponse } from "@/shared/api/client"
import type { AuthUser } from "@/entities/user"

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

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName?: string
  referrerCode?: string
}

export interface AuthResult {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export interface TokenResult {
  accessToken: string
  refreshToken: string
}

/**
 * Login with email and password
 */
export async function loginApi(email: string, password: string): Promise<AuthResult> {
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
    throw error // unreachable, but satisfies TS
  }
}

/**
 * Register new user
 */
export async function registerApi(data: RegisterData): Promise<AuthResult> {
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
    throw error
  }
}

/**
 * Logout (invalidate refresh token)
 */
export async function logoutApi(refreshToken?: string | null): Promise<void> {
  try {
    await api.post("auth/logout", {
      json: refreshToken ? { refresh_token: refreshToken } : undefined,
    })
  } catch {
    // Logout errors are non-critical — tokens are cleared locally regardless
  }
}

/**
 * Refresh access token
 */
export async function refreshTokenApi(refreshToken: string): Promise<TokenResult> {
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
    throw error
  }
}

/**
 * Send password reset email
 */
export async function forgotPasswordApi(email: string): Promise<void> {
  try {
    await api.post("auth/forgot-password", { json: { email } })
  } catch {
    // Don't reveal whether email exists — always show success
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get("users/me").json<UserApiResponse>()
  return mapUserResponse(response.data)
}

/**
 * Update user profile
 */
export async function updateProfile(payload: Record<string, unknown>): Promise<AuthUser> {
  const response = await api.patch("users/me", { json: payload }).json<UserApiResponse>()
  return mapUserResponse(response.data)
}
