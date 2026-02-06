"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, CreditCard, Crown, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface SettingsNavItem {
  label: string
  href: string
  icon: LucideIcon
}

const settingsNavItems: SettingsNavItem[] = [
  { label: "Профиль", href: "/settings/profile", icon: User },
  { label: "Кредиты", href: "/settings/billing", icon: CreditCard },
  { label: "Тариф", href: "/settings/plan", icon: Crown },
  { label: "Тема", href: "/settings/theme", icon: Palette },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[220px] shrink-0">
        <nav className="space-y-1" aria-label="Настройки">
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
      </aside>

      {/* Mobile horizontal tabs */}
      <div className="md:hidden flex gap-1 overflow-x-auto pb-4 -mx-1 px-1" role="tablist" aria-label="Настройки">
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
    </>
  )
}
