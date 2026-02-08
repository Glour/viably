"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  ChevronRight,
  BookOpen,
  FileText,
  Sparkles,
  MessageSquare,
  Phone,
  Zap,
  Code,
  Github,
  Search,
  LayoutGrid,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface NavSection {
  title: string
  items: NavItem[]
}

interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

const navigation: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Quick Start", href: "/docs/quickstart", icon: Sparkles },
      { title: "Installation", href: "/docs/installation", icon: FileText },
    ],
  },
  {
    title: "Templates",
    items: [
      { title: "Templates Overview", href: "/docs/templates", icon: LayoutGrid },
      { title: "Template Guide", href: "/docs/templates/guide", icon: BookOpen },
      { title: "Discord Bot", href: "/docs/templates/discord", icon: MessageSquare },
      { title: "Telegram Bot", href: "/docs/templates/telegram", icon: Phone },
      { title: "Slack Bot", href: "/docs/templates/slack", icon: Zap },
      { title: "WhatsApp Bot", href: "/docs/templates/whatsapp", icon: Phone },
      { title: "Custom Bot", href: "/docs/templates/custom", icon: Code },
    ],
  },
]

function DocsSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

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

  // Generate breadcrumb items
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
  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="text-sm font-semibold text-foreground">On This Page</h4>
      <nav className="space-y-2">
        {/* TOC will be dynamically populated by MDX components later */}
        <div className="text-sm text-muted-foreground italic">
          Table of contents will appear here
        </div>
      </nav>
    </div>
  )
}

function DocsHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl saturate-[1.8] border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Left: Logo + Mobile Menu */}
        <div className="flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
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
                <div className="mb-6 px-3">
                  <Link
                    href="/"
                    className="flex items-center gap-0"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent font-heading font-bold text-xl">
                      V
                    </span>
                    <span className="font-heading font-bold text-lg">iably</span>
                  </Link>
                </div>
                <DocsSidebar />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-0">
            <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent font-heading font-bold text-xl">
              V
            </span>
            <span className="font-heading font-bold text-lg">iably</span>
          </Link>

          <Separator orientation="vertical" className="h-6 hidden lg:block" />

          <span className="text-sm font-medium text-muted-foreground hidden lg:inline-block">
            Documentation
          </span>
        </div>

        {/* Right: Search + Theme + GitHub */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex gap-2 text-muted-foreground"
            disabled
          >
            <Search className="size-4" />
            Search...
          </Button>

          <ThemeToggle />

          <Link
            href="https://github.com/viably/viably"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon" aria-label="GitHub">
              <Github className="size-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

function DocsFooter() {
  const pathname = usePathname()
  const editUrl = `https://github.com/viably/viably/edit/main/frontend/content${pathname}.mdx`

  return (
    <footer className="border-t mt-12 pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-muted-foreground">
          © 2024 Viably. Built with Next.js and shadcn/ui.
        </div>
        <Link
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="size-4" />
          Edit this page on GitHub
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
  return (
    <div className="min-h-screen bg-background">
      <DocsHeader />

      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs />
        </div>

        <div className="flex gap-8 relative">
          {/* Left Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-24">
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
            <div className="sticky top-24">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
