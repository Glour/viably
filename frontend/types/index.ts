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
