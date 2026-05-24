"use client"

import { TemplateCard } from "./template-card"
import type { Template } from "@/shared/types"

interface TemplateGalleryProps {
  templates: Template[]
}

export function TemplateGallery({ templates }: TemplateGalleryProps) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {templates.map((template) => (
        <TemplateCard key={template.slug} template={template} />
      ))}
    </div>
  )
}
