"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  ChevronRight,
  BookOpen,
  FileText,
  Sparkles,
  LayoutGrid,
  Github,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Separator } from "@/shared/ui/separator"
import { cn } from "@/shared/lib/utils"
import { MainLayout } from "@/widgets/layout"
import { useTranslations } from "next-intl"

interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

function DocsSidebar({ className }: { className?: string }) {
  const t = useTranslations("docs")
  const pathname = usePathname()

  const navigation: NavSection[] = [
    {
      title: t("nav_getting_started"),
      items: [
        { title: t("nav_quick_start"), href: "/docs/quickstart", icon: Sparkles },
        { title: t("nav_credits"), href: "/docs/credits", icon: FileText },
      ],
    },
    {
      title: t("nav_templates"),
      items: [
        { title: t("nav_templates_overview"), href: "/docs/templates", icon: LayoutGrid },
        { title: t("nav_templates_guide"), href: "/docs/templates/guide", icon: BookOpen },
      ],
    },
  ]

  return (
    <nav className={cn("space-y-6", className)}>
      {navigation.map((section, idx) => (
        <div key={section.title}>
          {idx > 0 && <Separator className="mb-4" />}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground px-3">
              {section.title}
            </h4>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary-subtle text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </nav>
  )
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs = segments.map((segment, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/")
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    return { href, label }
  })

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Home
      </Link>
      {breadcrumbs.map((crumb, idx) => (
        <div key={crumb.href} className="flex items-center gap-2">
          <ChevronRight className="size-4 text-muted-foreground" />
          {idx === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

function TableOfContents({ className }: { className?: string }) {
  const t = useTranslations("docs")
  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="text-sm font-semibold text-foreground">{t("toc_title")}</h4>
      <nav className="space-y-2">
        <div className="text-sm text-muted-foreground italic">
          {t("toc_placeholder")}
        </div>
      </nav>
    </div>
  )
}

function DocsFooter() {
  const t = useTranslations("docs")
  const pathname = usePathname()
  const editUrl = `https://github.com/viably/viably/edit/main/frontend/content${pathname}.mdx`

  return (
    <footer className="border-t mt-12 pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {t("footer_copyright")}
        </div>
        <Link
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="size-4" />
          {t("edit_on_github")}
        </Link>
      </div>
    </footer>
  )
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations("docs")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <MainLayout>
      <div>
        {/* Mobile navigation sheet */}
        <div className="lg:hidden mb-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("nav_getting_started")}
              >
                {mobileMenuOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <ScrollArea className="h-full py-6 px-4">
                <DocsSidebar />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs />
        </div>

        <div className="flex gap-8 relative">
          {/* Left Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-8">
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <DocsSidebar />
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <article className="prose prose-neutral dark:prose-invert max-w-4xl">
              {children}
            </article>

            <DocsFooter />
          </main>

          {/* Right TOC - Desktop Only */}
          <aside className="hidden xl:block w-[240px] shrink-0">
            <div className="sticky top-8">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  )
}
