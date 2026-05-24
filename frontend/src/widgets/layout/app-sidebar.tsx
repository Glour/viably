"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderOpen,
  Layers,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Menu,
  X,
} from "lucide-react"
import { useAuthStore } from "@/features/auth/stores"
import { useTranslations } from 'next-intl'

interface NavItemProps {
  href?: string
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
  collapsed?: boolean
}

function NavItem({ href, icon, label, active, onClick, collapsed }: NavItemProps) {
  const base = "px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors cursor-pointer w-full"
  const cls = active
    ? `${base} bg-foreground/[0.08] text-foreground`
    : `${base} text-muted-foreground hover:bg-accent hover:text-foreground`

  const content = (
    <>
      {icon}
      {!collapsed && <span>{label}</span>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cls} title={collapsed ? label : undefined}>
        {content}
      </Link>
    )
  }

  return (
    <button className={cls} onClick={onClick} title={collapsed ? label : undefined}>
      {content}
    </button>
  )
}

function SectionLabel({ label, collapsed }: { label: string; collapsed?: boolean }) {
  if (collapsed) return null

  return (
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-3 mt-4 mb-1">
      {label}
    </div>
  )
}

function SidebarContent({
  collapsed,
  toggleCollapsed,
  onNavClick,
}: {
  collapsed: boolean
  toggleCollapsed: () => void
  onNavClick?: () => void
}) {
  const t = useTranslations('nav')
  const tSidebar = useTranslations('sidebar')
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const displayName = user?.fullName || user?.email || tSidebar("my_workspace")
  const firstLetter = (user?.fullName || user?.email || "M")[0].toUpperCase()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

  return (
    <>
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: "var(--accent-gradient)" }}
          >
            V
          </div>
          {!collapsed && <span className="text-foreground/90 font-semibold text-sm">Viably</span>}
        </div>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={toggleCollapsed}
          title={collapsed ? tSidebar("expand") : tSidebar("collapse")}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Workspace selector */}
      {!collapsed && (
        <div className="px-3 mb-2">
          <button className="w-full px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left truncate">
            {displayName}
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto" onClick={onNavClick}>
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard size={15} />}
          label={t('dashboard')}
          active={isActive("/dashboard")}
          collapsed={collapsed}
        />

        <SectionLabel label={tSidebar("section_projects")} collapsed={collapsed} />
        <NavItem
          href="/projects"
          icon={<FolderOpen size={15} />}
          label={t('projects')}
          active={isActive("/projects")}
          collapsed={collapsed}
        />
        <NavItem
          href="/templates"
          icon={<Layers size={15} />}
          label={t('templates')}
          active={isActive("/templates")}
          collapsed={collapsed}
        />

        <SectionLabel label={tSidebar("section_tools")} collapsed={collapsed} />
        <NavItem
          href="/docs"
          icon={<BookOpen size={15} />}
          label={t('docs')}
          active={isActive("/docs")}
          collapsed={collapsed}
        />

        <SectionLabel label={tSidebar("section_account")} collapsed={collapsed} />
        <NavItem
          href="/subscription"
          icon={<CreditCard size={15} />}
          label={t('subscription')}
          active={isActive("/subscription")}
          collapsed={collapsed}
        />
        <NavItem
          href="/settings"
          icon={<Settings size={15} />}
          label={t('settings')}
          active={isActive("/settings")}
          collapsed={collapsed}
        />
      </nav>

      {/* Bottom section */}
      {!collapsed && (
        <div className="px-3 pb-4 space-y-3">
          {user?.plan && user.plan !== "free" ? (
            <Link
              href="/subscription"
              className="group block rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
              style={{ background: "var(--accent-gradient)" }}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">✦</span>
                    <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
                      {user.plan}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50 font-medium">{tSidebar("subscription_active")}</span>
                </div>
                <p className="text-[11px] text-white/70 mb-2 leading-relaxed">{tSidebar("subscription_manage_text")}</p>
                <div className="flex items-center justify-center gap-1 bg-white/15 hover:bg-white/25 transition-colors rounded-lg py-1.5">
                  <span className="text-[11px] text-white font-semibold">{tSidebar("subscription_manage_link")}</span>
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="group block rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
              style={{ background: "linear-gradient(135deg, #4c1d95, #2563EB)" }}
            >
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">⚡</span>
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">{tSidebar("upgrade_title")}</span>
                </div>
                <p className="text-[11px] text-white/60 mb-2">{tSidebar("upgrade_text")}</p>
                <div className="flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors rounded-lg py-1.5">
                  <span className="text-[11px] text-white font-semibold">Upgrade →</span>
                </div>
              </div>
            </Link>
          )}
          <Link href="/settings" className="flex items-center gap-2 px-1 rounded-lg hover:bg-accent transition-colors py-1 group">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 group-hover:ring-2 group-hover:ring-primary/40 transition-all"
              style={{ background: "var(--accent-gradient)" }}
            >
              {firstLetter}
            </div>
            <span className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">{displayName}</span>
          </Link>
        </div>
      )}

      {/* Collapsed user avatar */}
      {collapsed && (
        <div className="px-3 pb-4">
          <Link href="/settings" title={displayName}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white mx-auto hover:ring-2 hover:ring-primary/40 transition-all"
              style={{ background: "var(--accent-gradient)" }}
            >
              {firstLetter}
            </div>
          </Link>
        </div>
      )}
    </>
  )
}

export function AppSidebar() {
  const tSidebar = useTranslations('sidebar')
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setCollapsed(saved === "true")
    } else {
      setCollapsed(false)
    }
  }, [])

  useEffect(() => {
    const isAIEditor = /\/projects\/[^/]+\/ai/.test(pathname)
    if (isAIEditor) {
      setAnimate(false)
      setCollapsed(true)
      setMobileOpen(false)
    }
  }, [pathname])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapsed = () => {
    const newState = !collapsed
    setAnimate(true)
    setCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  return (
    <>
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 flex items-center justify-center rounded-lg bg-background border border-border/60 text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={tSidebar("menu_aria")}
      >
        {mobileOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`md:hidden fixed top-0 left-0 z-40 h-full flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "220px",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-default)",
        }}
      >
        <SidebarContent
          collapsed={false}
          toggleCollapsed={() => setMobileOpen(false)}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>

      <aside
        className={`hidden md:flex flex-col h-screen shrink-0 border-r ${animate ? "transition-[width] duration-300" : ""}`}
        style={{
          width: collapsed ? "60px" : "200px",
          background: "var(--bg-sidebar)",
          borderColor: "var(--border-default)",
        }}
      >
        <SidebarContent collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
      </aside>
    </>
  )
}
