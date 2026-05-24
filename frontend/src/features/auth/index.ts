/**
 * Auth Feature - Public API
 *
 * Exports components, hooks, stores, types, and API for authentication.
 */

// Components
export {
  AuthDecorativePanel,
  AuthGuard,
  AuthInitializer,
  PasswordStrength,
  ProtectedRoute,
  SocialLoginButtons,
} from "./components"

// Hooks
export { useAuth } from "./hooks"

// Stores
export { useAuthStore } from "./stores"
export type { AuthStoreState } from "./stores"

// API (only if needed outside feature)
export {
  loginApi,
  registerApi,
  logoutApi,
  refreshTokenApi,
  forgotPasswordApi,
} from "./api"
export type {
  LoginCredentials,
  RegisterData,
  AuthResult,
  TokenResult,
} from "./api"

// Types & Schemas
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from "./types"
export type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
} from "./types"
