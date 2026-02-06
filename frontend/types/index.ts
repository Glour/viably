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

export type ProjectStatus = "deployed" | "ready" | "draft" | "failed"

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
