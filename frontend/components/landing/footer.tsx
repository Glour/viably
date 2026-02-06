"use client"

import Link from "next/link"
import { Twitter, Github, Send } from "lucide-react"

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Templates", href: "/templates" },
      { label: "Pricing", href: "#pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "#docs" },
      { label: "Blog", href: "/blog" },
      { label: "API", href: "/api-docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const

const SOCIAL_LINKS = [
  { label: "Twitter", href: "https://twitter.com/viably", icon: Twitter },
  { label: "GitHub", href: "https://github.com/viably", icon: Github },
  { label: "Telegram", href: "https://t.me/viably", icon: Send },
] as const

export function Footer() {
  return (
    <footer>
      {/* Gradient separator */}
      <div className="h-px bg-[image:var(--gradient-main)]" />

      <div className="border-t border-border/30 bg-card/30 py-12 lg:py-16">
        <div className="mx-auto max-w-[1280px] px-6">
          {/* Main grid: logo/description + nav columns */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] lg:gap-8">
            {/* Brand column */}
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center gap-0"
                aria-label="Viably home"
              >
                <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent font-heading font-bold text-xl">
                  V
                </span>
                <span className="font-heading font-bold text-lg">iably</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Build and deploy AI-powered bots in minutes. Describe what you
                need, and we generate production-ready code.
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-4 pt-2">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <social.icon className="size-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation columns — 2x2 on tablet, 4-col on desktop */}
            <div className="col-span-1 grid grid-cols-2 gap-8 md:grid-cols-2 lg:col-span-4 lg:grid-cols-4">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title}>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                    {column.title}
                  </h3>
                  <ul className="space-y-0">
                    {column.links.map((link) =>
                      link.href.startsWith("#") ? (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {link.label}
                          </a>
                        </li>
                      ) : (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mt-12 h-px bg-border/50" />

          {/* Copyright */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            &copy; 2025 Viably. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
