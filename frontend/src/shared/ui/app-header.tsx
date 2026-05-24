"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { 
  LayoutDashboard,
  FolderOpen,
  FileText,
  BookOpen,
  CreditCard,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Gem,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { ThemeToggle } from "@/shared/ui/theme-toggle"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { cn } from "@/shared/lib/utils"
import { LanguageSwitcher } from "@/shared/components/language-switcher"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/shared/ui/sheet"
import { useCreditBalance } from "@/entities/credit"
import { useAuthStore } from "@/features/auth/stores"

export function AppHeader() {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated, logout } = useAuthStore()
  const { data: creditBalance, isLoading: creditsLoading } = useCreditBalance(true)

  /* Nav config with translations */
  const authedNav = useMemo(() => [
    { label: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("projects"), href: "/projects", icon: FolderOpen },
    { label: t("templates"), href: "/templates", icon: FileText },
    { label: t("docs"), href: "/docs", icon: BookOpen },
    { label: t("pricing"), href: "/pricing", icon: CreditCard },
  ], [t])

  const publicNav = useMemo(() => [
    { label: t("demo"), href: "/#demo" },
    { label: t("features"), href: "/#features" },
    { label: t("pricing"), href: "/#pricing" },
    { label: t("blog"), href: "/blog" },
  ], [t])

  /* Track scroll for public page transparency */
  useEffect(() => {
    if (isAuthenticated) return
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isAuthenticated])

  /* Close mobile on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const showGlass = isAuthenticated || scrolled

  const navItems = isAuthenticated ? authedNav : publicNav

  return (
    <header
      
      className={cn(
        "sticky top-0 z-50 h-16 transition-all duration-300",
        showGlass
          ? [
              "bg-[rgba(250,249,246,0.8)] dark:bg-[rgba(15,15,26,0.8)]",
              "backdrop-blur-[20px]",
              "border-b border-border-subtle dark:border-[#2D2D4A]/60",
              "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
            ]
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1280px] items-center px-6">
        {/* ── Logo ─────────────────────────────────── */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="group flex shrink-0 items-center gap-0.5 transition-transform duration-200 hover:scale-[1.04]"
          aria-label="Viably — домой"
        >
          <span className="font-heading text-xl font-bold text-primary transition-colors">
            V
          </span>
          <span className="font-heading text-lg font-bold text-foreground transition-colors group-hover:text-primary">
            iably
          </span>
        </Link>

        {/* ── Desktop nav ──────────────────────────── */}
        <nav className="ml-8 hidden items-center gap-1 sm:flex">
          {navItems.map((item) => {
            const isActive = "icon" in item
              ? pathname.startsWith(item.href)
              : pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {"icon" in item && (
                  <item.icon className="size-4" aria-hidden />
                )}
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-[9px] h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Spacer ───────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Right actions ─────────────────────────── */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Credits */}
              <Link href="/settings" aria-label="Кредиты — перейти в настройки">
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1.5 border-primary/20 bg-primary/10 px-3 py-1 font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <Gem className="size-3.5" aria-hidden />
                  <span className="font-mono text-xs">
                    {creditsLoading ? "…" : (creditBalance?.credits ?? 0)}
                  </span>
                </Badge>
              </Link>

              {/* Language */}
              <LanguageSwitcher />

              {/* Theme */}
              <ThemeToggle />

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full transition-colors hover:bg-primary/10 hover:text-primary"
                    aria-label="Меню пользователя"
                  >
                    <User className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="size-4" />
                      {t("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout?.()}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <Link
                href="/login"
                className="hidden rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:block"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="hidden rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-primary-dark hover:shadow-[0_4px_12px_rgba(124,58,237,0.3)] sm:block"
              >
                {t("signup")} →
              </Link>
            </>
          )}

          {/* Mobile burger */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* ── Mobile drawer ────────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[280px] sm:hidden backdrop-blur-[20px] bg-background/95 p-0"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-heading text-lg font-bold">
                <span className="text-primary">V</span>
                <span className="text-foreground">iably</span>
              </SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label="Закрыть меню">
                  <X className="size-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          {/* Credits badge */}
          {isAuthenticated && (
            <div className="px-6 pt-4">
              <Badge
                variant="secondary"
                className="w-full justify-center gap-2 border-primary/20 bg-primary/10 px-4 py-2 font-semibold text-primary"
              >
                <Gem className="size-4" aria-hidden />
                <span className="font-mono text-sm">
                  {creditsLoading ? "…" : (creditBalance?.credits ?? 0)} кредитов
                </span>
              </Badge>
            </div>
          )}

          {/* Nav links */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navItems.map((item) => {
              const isActive = "icon" in item
                ? pathname.startsWith(item.href)
                : pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {"icon" in item && <item.icon className="size-5" aria-hidden />}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer: auth buttons + theme */}
          <div className="mt-auto border-t border-border/50 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground">Тема</span>
              <ThemeToggle />
            </div>

            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  onClick={closeMobile}
                  className="flex items-center justify-center rounded-lg border border-border px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobile}
                  className="flex items-center justify-center rounded-[10px] bg-primary px-3 py-3 text-sm font-semibold text-white transition-colors hover:brightness-110"
                >
                  {t("signup")} →
                </Link>
              </>
            )}

            {isAuthenticated && (
              <>
                <Link
                  href="/settings"
                  onClick={closeMobile}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <Settings className="size-5" aria-hidden />
                  {t("settings")}
                </Link>
                <button
                  onClick={() => { logout?.(); closeMobile(); }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-5" aria-hidden />
                  {t("logout")}
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
