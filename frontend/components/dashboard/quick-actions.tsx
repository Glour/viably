import Link from "next/link"

import type { TemplateShortcut } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const QUICK_ACTIONS: TemplateShortcut[] = [
  {
    slug: "shop-bot",
    name: "Shop Bot",
    emoji: "🛒",
    badge: "Самый популярный",
    href: "/projects/new?template=shop-bot",
  },
  {
    slug: "faq-bot",
    name: "FAQ Bot",
    emoji: "❓",
    badge: "Быстрый старт",
    href: "/projects/new?template=faq-bot",
  },
]

export function QuickActions() {
  return (
    <section>
      <h2 className="font-heading text-xl font-bold mb-4">
        Быстрые действия
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.slug} href={action.href}>
            <Card className="cursor-pointer">
              <Badge variant="default" className="absolute top-3 right-3 z-10">
                {action.badge}
              </Badge>

              <CardContent>
                <span className="text-3xl">{action.emoji}</span>
                <p className="font-heading text-lg font-semibold mt-2">
                  {action.name}
                </p>
                <p className="text-sm text-primary mt-1">Создать →</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
