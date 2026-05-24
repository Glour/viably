"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User, Palette, CreditCard, LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/shared/lib/utils"
import { useAuthStore } from "@/features/auth/stores"
import type { LucideIcon } from "lucide-react"

interface SettingsNavItem {
  label: string
  href: string
  icon: LucideIcon
  external?: boolean
}

const settingsNavItems: SettingsNavItem[] = [
  { label: "Профиль", href: "/settings/profile", icon: User },
  { label: "Тема", href: "/settings/theme", icon: Palette },
  { label: "Подписка", href: "/subscription", icon: CreditCard },
]

export function SettingsSidebar() {
  const t = useTranslations("settings")
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    await logout?.()
    router.push("/login")
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0">
        <nav className="space-y-1" aria-label={t("settings_aria")}>
          {settingsNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-subtle text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="size-4" />
            Выйти из аккаунта
          </button>
        </div>
      </aside>

      {/* Mobile horizontal tabs */}
      <div className="md:hidden space-y-4">
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1" role="tablist" aria-label={t("settings_aria")}>
          {settingsNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary-subtle text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="size-4" />
          Выйти из аккаунта
        </button>
      </div>
    </>
  )
}
