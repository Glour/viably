"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Github, Send } from "lucide-react"
import { useMemo } from "react"

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/Glour/viably", icon: Github },
  { label: "Telegram", href: "https://t.me/viably_news", icon: Send },
] as const

export function Footer() {
  const t = useTranslations("footer")

  const FOOTER_COLUMNS = useMemo(() => [
    {
      title: t("product"),
      links: [
        { label: t("templates"), href: "/templates" },
        { label: t("pricing"), href: "/pricing" },
        { label: t("docs"), href: "/docs" },
      ],
    },
    {
      title: t("company"),
      links: [
        { label: t("about"), href: "/about" },
        { label: t("blog"), href: "/blog" },
      ],
    },
    {
      title: t("support"),
      links: [
        { label: t("telegram_bot"), href: "https://t.me/viably_support_bot" },
        { label: t("telegram_channel"), href: "https://t.me/viably_news" },
      ],
    },
    {
      title: t("legal"),
      links: [
        { label: t("privacy"), href: "/privacy" },
        { label: t("terms"), href: "/terms" },
      ],
    },
  ], [t])

  return (
    <footer>
      <div className="border-t border-border/40 bg-background dark:bg-card/60 py-12 lg:py-16">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] lg:gap-8">
            {/* Brand column */}
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center gap-0 group"
                aria-label={t("viably_home_aria")}
              >
                <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent font-heading font-bold text-xl transition-all group-hover:scale-110">
                  V
                </span>
                <span className="font-heading font-bold text-lg">iably</span>
              </Link>
              <p className="text-sm font-body text-muted-foreground leading-relaxed max-w-xs">
                {t("tagline")}
              </p>

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

            {/* Navigation columns */}
            <div className="col-span-1 grid grid-cols-2 gap-8 md:grid-cols-4 lg:col-span-4 lg:grid-cols-4">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title}>
                  <h3 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider mb-4">
                    {column.title}
                  </h3>
                  <ul className="space-y-0">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="block py-1.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                          target={link.href.startsWith('http') ? '_blank' : undefined}
                          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 h-px bg-border/50" />

          <p className="mt-8 text-center text-sm font-body text-muted-foreground">
            &copy; 2026 Viably. {t("rights")}.
          </p>
        </div>
      </div>
    </footer>
  )
}
