import type { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

// Dashboard types

export type ProjectStatus = "draft" | "generating" | "generated" | "deployed" | "failed" | "stopped"

// Auth types (015-api-client-auth)

export type PlanType = "free" | "starter" | "pro" | "business"

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

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string
  referrer_code?: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export interface AuthStoreState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; fullName?: string; referrerCode?: string }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: AuthUser | null) => void
  reset: () => void
}

export interface UserProfile extends Pick<AuthUser, "id" | "email" | "plan" | "credits"> {
  name: string
  projectsCount: number
  projectsLimit: number
  deployedCount: number
}

export interface TemplateShortcut {
  slug: string
  name: string
  emoji: string
  badge: string
  href: string
}

// Projects types

export interface DeploymentInfo {
  url: string
  botUsername: string
  status: "running" | "stopped" | "deploying"
  runningSince: string | null
  costEstimate: string
}

export interface ProjectFile {
  path: string
  name: string
  type: "file" | "folder"
  content?: string
  children?: ProjectFile[]
}

export type LogLevel = "info" | "warning" | "error"

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
}

export interface EnvVariable {
  id: string
  key: string
  value: string
  isRevealed: boolean
}

export interface Project {
  id: string
  name: string
  emoji: string
  description: string
  status: ProjectStatus
  category: string
  createdAt: string
  updatedAt: string
  config: Record<string, string>
  deployment: DeploymentInfo | null
  files: ProjectFile[]
  envVars: EnvVariable[]
  logs: LogEntry[]
}

export type ViewMode = "grid" | "list"
export type ProjectFilter = "all" | "deployed" | "generated" | "draft" | "failed"
export type ProjectSort = "newest" | "oldest" | "name"

export type ProjectsResponse =
  | { success: true; projects: Project[] }
  | { success: false; error: string }

export type ProjectResponse =
  | { success: true; project: Project }
  | { success: false; error: string }

export type DeleteProjectResponse =
  | { success: true }
  | { success: false; error: string }

export type DuplicateProjectResponse =
  | { success: true; projectId: string }
  | { success: false; error: string }

export type ToggleStatusResponse =
  | { success: true; newStatus: ProjectStatus }
  | { success: false; error: string }

export interface ProjectsStoreState {
  searchQuery: string
  filter: ProjectFilter
  sort: ProjectSort
  viewMode: ViewMode
  setSearchQuery: (query: string) => void
  setFilter: (filter: ProjectFilter) => void
  setSort: (sort: ProjectSort) => void
  setViewMode: (mode: ViewMode) => void
}

// Templates Gallery types

export type TemplateCategory = "telegram_bot" | "discord_bot" | "web_app" | "api" | "automation"

export type ConfigFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "number"

export interface ConfigField {
  name: string
  label: string
  type: ConfigFieldType
  required: boolean
  placeholder?: string
  options?: string[]
}

export interface Template {
  slug: string
  name: string
  emoji: string
  description: string
  category: TemplateCategory
  creditCost: number
  features: string[]
  tags: string[]
  configFields: ConfigField[]
  isPopular: boolean
}

export type FilterTab = "all" | "telegram" | "popular" | "cheap"

export type TemplatesResponse =
  | { success: true; templates: Template[] }
  | { success: false; error: string }

export type TemplateResponse =
  | { success: true; template: Template }
  | { success: false; error: string }

export type CreateProjectResponse =
  | { success: true; projectId: string; redirectUrl: string }
  | { success: false; error: string }

export interface TemplatesStoreState {
  templates: Template[]
  searchQuery: string
  activeTab: FilterTab
  isLoading: boolean
  loadTemplates: () => Promise<void>
  setSearchQuery: (query: string) => void
  setActiveTab: (tab: FilterTab) => void
  resetFilters: () => void
  getFilteredTemplates: () => Template[]
  getTemplateBySlug: (slug: string) => Template | undefined
}

// Generation Flow types

export type GenerationStatus = "idle" | "generating" | "complete" | "error"

export type GenerationStepStatus = "pending" | "running" | "done" | "error"

export interface GenerationStep {
  id: string
  name: string
  status: GenerationStepStatus
  duration: number | null
}

export interface GeneratedCode {
  files: ProjectFile[]
  totalFiles: number
  totalLines: number
}

export interface GenerationSession {
  status: GenerationStatus
  currentStep: number
  steps: GenerationStep[]
  progress: number
  code: GeneratedCode | null
  error: string | null
  startedAt: string | null
  completedAt: string | null
  codeSnippets?: string[]
}

export type DeploymentStatus = "config" | "deploying" | "success" | "failure"

export type DeploymentStepStatus = "pending" | "running" | "done" | "error"

export interface DeploymentStep {
  id: string
  name: string
  status: DeploymentStepStatus
  duration: number | null
}

export interface DeployedBotInfo {
  username: string
  url: string
  status: "running"
}

export interface DeployConfig {
  botToken: string
  envVars: Record<string, string>
}

export interface DeploymentSession {
  status: DeploymentStatus
  steps: DeploymentStep[]
  currentStep: number
  progress: number
  botInfo: DeployedBotInfo | null
  error: string | null
}

export type ConfigFormValues = Record<string, string | string[] | number>

export interface GenerationStoreState {
  projectId: string | null
  template: Template | null
  generation: GenerationSession
  deployment: DeploymentSession
  formValues: ConfigFormValues
  freeTextInput: string
  deployConfig: DeployConfig | null
  setProjectContext: (projectId: string, template: Template) => void
  setFormValues: (values: ConfigFormValues) => void
  setFreeTextInput: (text: string) => void
  startGeneration: () => void
  retryGeneration: () => void
  resetGeneration: () => void
  startDeployment: (config: DeployConfig) => void
  resetDeployment: () => void
  reset: () => void
  _updateStep: (stepIndex: number, status: GenerationStepStatus, duration: number | null) => void
  _setProgress: (progress: number) => void
  _completeGeneration: (code: GeneratedCode) => void
  _failGeneration: (error: string) => void
  _updateDeployStep: (stepIndex: number, status: DeploymentStepStatus, duration: number | null) => void
  _setDeployProgress: (progress: number) => void
  _completeDeployment: (botInfo: DeployedBotInfo) => void
  _failDeployment: (error: string) => void
}

// Settings types

export type TransactionType = "earned" | "spent" | "purchased"
export type TransactionFilter = "all" | "earned" | "spent" | "purchased"

export interface CreditTransaction {
  id: string
  amount: number
  type: TransactionType
  description: string
  createdAt: string
}

export interface CreditPackage {
  id: string
  credits: number
  price: number
  badge: string | null
}

export type PlanTier = "free" | "starter" | "pro" | "business" | "enterprise"

export interface SubscriptionPlan {
  id: string
  name: string
  tier: PlanTier
  price: number | null
  period: "month" | "year" | null
  features: string[]
  projectLimit: number | null
  creditsPerMonth: number | null
  isPopular: boolean
}

export interface UserPlanInfo {
  plan: SubscriptionPlan
  usage: {
    projectsUsed: number
    creditsRemaining: number
  }
  renewalDate: string | null
}

export type UpdateProfileResponse =
  | { success: true; user: UserProfile }
  | { success: false; error: string }

export type ChangePasswordResponse =
  | { success: true }
  | { success: false; error: string }

export type TransactionsResponse =
  | { success: true; transactions: CreditTransaction[]; hasMore: boolean }
  | { success: false; error: string }

export type UserPlanResponse =
  | { success: true; planInfo: UserPlanInfo; availablePlans: SubscriptionPlan[] }
  | { success: false; error: string }

export interface SettingsStoreState {
  profile: AuthUser | null
  isLoadingProfile: boolean
  isSavingProfile: boolean

  transactionFilter: TransactionFilter
  setTransactionFilter: (filter: TransactionFilter) => void

  currentPlan: UserPlanInfo | null
  availablePlans: SubscriptionPlan[]
  isLoadingPlan: boolean

  loadProfile: () => Promise<void>
  updateProfile: (data: UpdateProfilePayload) => Promise<boolean>
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<boolean>

  loadPlan: () => Promise<void>
}

// === API Response Types (016-data-hooks) ===

export type BackendProjectStatus = "draft" | "generating" | "ready" | "deploying" | "deployed" | "error"

export interface DailyBonusInfo {
  amount: number
  claimedToday: boolean
  nextAvailableAt: string | null
  streakDays: number
}

export interface CreditBalance {
  credits: number
  plan: string
  dailyBonus: DailyBonusInfo | null
}

export interface DailyBonusClaim {
  claimed: boolean
  amount: number
  newBalance: number
  nextAvailableAt: string
}

export interface PaginationMeta {
  total: number
  limit: number
  offset: number
}

// API version of CreditTransaction (matches backend)
export interface ApiCreditTransaction {
  id: string
  amount: number
  balanceAfter: number
  transactionType: string
  description: string | null
  projectId: string | null
  relatedUserId: string | null
  extraData: Record<string, unknown>
  createdAt: string
}

export interface TransactionsPaginated {
  transactions: ApiCreditTransaction[]
  meta: PaginationMeta
}

// API version of Template (matches backend)
export interface ApiTemplate {
  id: string
  name: string
  slug: string
  description: string
  category: string
  creditCost: number
  previewImageUrl: string | null
  features: string[]
  tags: string[]
  usageCount: number
  createdAt: string
}

export interface ApiTemplateDetail extends ApiTemplate {
  configSchema: Record<string, unknown> | null
  exampleConfig: Record<string, unknown> | null
}

// API version of Project (matches backend)
export interface ApiProject {
  id: string
  userId: string
  name: string
  description: string | null
  templateId: string
  config: Record<string, unknown>
  status: ProjectStatus
  isPublic: boolean
  createdAt: string
  updatedAt: string | null
  generatedCode: {
    files: Record<string, string>
    entryPoint: string
    runtime: string
  } | null
  generationLogs: string | null
  aiModelUsed: string | null
  errorMessage: string | null
  deployedUrl: string | null
  deployPlatform: string | null
  generatedAt: string | null
  deployedAt: string | null
}

export interface ProjectsPaginated {
  items: ApiProject[]
  total: number
  page: number
  perPage: number
  pages: number
}

export interface UpdateProfilePayload {
  fullName?: string | null
  avatarUrl?: string | null
}

export interface CreateProjectPayload {
  name: string
  description?: string
  templateId: string
  config: Record<string, unknown>
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  config?: Record<string, unknown>
  isPublic?: boolean
}
