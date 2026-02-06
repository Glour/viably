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
