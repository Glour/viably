import Link from "next/link"
import { Check } from "lucide-react"
import type { Template } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TemplateCardProps {
  template: Template
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Link href={`/templates/${template.slug}`} className="group block">
      <article className="relative flex flex-col gap-4 rounded-2xl border bg-card p-6 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:shadow-lg hover:border-primary-subtle">
        {/* Gradient line top */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-[image:var(--gradient-main)] opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

        {/* Emoji icon */}
        <span className="text-5xl leading-none" aria-hidden="true">
          {template.emoji}
        </span>

        {/* Name */}
        <h3 className="font-heading text-xl font-semibold">
          {template.name}
        </h3>

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
        <Button variant="secondary" className="w-full" tabIndex={-1}>
          Использовать →
        </Button>
      </article>
    </Link>
  )
}
