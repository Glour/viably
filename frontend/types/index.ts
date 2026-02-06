import type { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface SidebarState {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

// Dashboard types

export type ProjectStatus = "draft" | "generating" | "generated" | "deployed" | "failed" | "stopped"

export interface UserProfile {
  id: string
  name: string
  email: string
  plan: "free" | "pro" | "business"
  credits: number
  projectsCount: number
  projectsLimit: number
  deployedCount: number
}

export interface ProjectSummary {
  id: string
  name: string
  emoji: string
  status: ProjectStatus
  updatedAt: string
}

export interface DailyBonusState {
  claimedToday: boolean
  lastClaimedDate: string | null
  streak: number
  todayReward: number
  nextReward: number
}

export interface TemplateShortcut {
  slug: string
  name: string
  emoji: string
  badge: string
  href: string
}

export type UserProfileResponse =
  | { success: true; user: UserProfile }
  | { success: false; error: string }

export type RecentProjectsResponse =
  | { success: true; projects: ProjectSummary[] }
  | { success: false; error: string }

export interface DashboardStoreState {
  user: UserProfile | null
  projects: ProjectSummary[]
  isLoading: boolean
  loadDashboard: () => Promise<void>
}

export interface DailyBonusStoreState extends DailyBonusState {
  claim: () => void
  checkStreak: () => void
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

export type UpdateEnvVarsResponse =
  | { success: true }
  | { success: false; error: string }

export type ToggleStatusResponse =
  | { success: true; newStatus: ProjectStatus }
  | { success: false; error: string }

export interface ProjectsStoreState {
  projects: Project[]
  currentProject: Project | null
  searchQuery: string
  filter: ProjectFilter
  sort: ProjectSort
  viewMode: ViewMode
  isLoading: boolean
  loadProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setFilter: (filter: ProjectFilter) => void
  setSort: (sort: ProjectSort) => void
  setViewMode: (mode: ViewMode) => void
  deleteProject: (id: string) => Promise<void>
  getFilteredProjects: () => Project[]
}

// Templates Gallery types

export type TemplateCategory = "telegram_bot"

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
