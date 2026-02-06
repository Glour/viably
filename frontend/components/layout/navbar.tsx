"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  FolderKanban,
  Gem,
  LayoutDashboard,
  Menu,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"
import type { NavItem } from "@/types"

const navItems: NavItem[] = [
  { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
  { label: "Шаблоны", href: "/templates", icon: FileText },
  { label: "Проекты", href: "/projects", icon: FolderKanban },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on Escape key (subscribing to external event)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <nav aria-label="Основная навигация" className="sticky top-0 z-50">
      <div className="bg-background/80 backdrop-blur-xl saturate-[1.8] border-b">
        <div className="mx-auto max-w-[1280px] px-6 h-16 flex items-center">
          {/* Left: Logo */}
          <Link href="/dashboard" className="flex items-center gap-0 shrink-0">
            <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent font-heading font-bold text-xl">
              V
            </span>
            <span className="font-heading font-bold text-lg">iably</span>
          </Link>

          {/* Center: Nav tabs (hidden below md) */}
          <div className="hidden md:flex items-center gap-1 mx-auto">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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

          {/* Right: Actions */}
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            <Badge variant="default">
              <Gem className="size-3" />
              150
            </Badge>
            <ThemeToggle />
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="size-5" />
                <span className="sr-only">Настройки</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
              <span className="sr-only">Меню</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-xl">
          <div className="px-6 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm w-full",
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
        </div>
      )}
    </nav>
  )
}
