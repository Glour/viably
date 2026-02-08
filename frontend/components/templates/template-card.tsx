import Link from "next/link"
import { Check, BookOpen } from "lucide-react"
import type { Template } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TemplateCardProps {
  template: Template
}

/**
 * Maps template category to documentation slug
 */
function getDocSlugForCategory(category: Template["category"]): string {
  const categoryMap: Record<Template["category"], string> = {
    telegram_bot: "telegram",
  }
  return categoryMap[category] || "custom"
}

export function TemplateCard({ template }: TemplateCardProps) {
  const docSlug = getDocSlugForCategory(template.category)
  return (
    <article className="relative flex flex-col gap-4 rounded-2xl border bg-card p-6 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:shadow-lg hover:border-primary-subtle group">
      {/* Gradient line top */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-[image:var(--gradient-main)] opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

      {/* Header: Emoji + Doc Link */}
      <div className="flex items-start justify-between gap-3">
        {/* Emoji icon */}
        <span className="text-5xl leading-none" aria-hidden="true">
          {template.emoji}
        </span>

        {/* Documentation link button */}
        <Link
          href={`/docs/templates/${docSlug}`}
          className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-primary hover:bg-primary-subtle"
          onClick={(e) => e.stopPropagation()}
        >
          <BookOpen className="size-3.5" />
          <span className="hidden sm:inline">Guide</span>
        </Link>
      </div>

      {/* Name */}
      <Link href={`/templates/${template.slug}`} className="block">
        <h3 className="font-heading text-xl font-semibold group-hover:text-primary transition-colors">
          {template.name}
        </h3>
      </Link>

      {/* Gradient separator */}
      <div className="h-px w-full bg-[image:var(--gradient-main)] opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-3">
        {template.description}
      </p>

      {/* Features */}
      <ul className="flex flex-col gap-1.5">
        {template.features.slice(0, 4).map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-sm"
          >
            <Check className="size-4 shrink-0 text-success" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Spacer */}
      <div className="mt-auto" />

      {/* Credits badge */}
      <Badge variant="secondary" className="w-fit">
        💎 {template.creditCost} credits
      </Badge>

      {/* CTA */}
      <Link href={`/templates/${template.slug}`}>
        <Button variant="secondary" className="w-full">
          Использовать →
        </Button>
      </Link>
    </article>
  )
}
