"use client"

import { useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { Shimmer } from "@/components/ui/shimmer"
import { TemplateCard } from "@/components/templates/template-card"
import { EmptyState } from "@/components/templates/empty-state"
import { useTemplatesStore } from "@/stores/templates"

export default function TemplatesPage() {
  const { isLoading, loadTemplates, getFilteredTemplates, resetFilters } =
    useTemplatesStore()

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const filtered = getFilteredTemplates()

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <FadeInUp delay={0}>
          <div>
            <h1 className="font-heading text-3xl font-bold">
              Шаблоны ботов
            </h1>
            <p className="mt-2 text-muted-foreground">
              Выбери шаблон и создай бота за минуту
            </p>
          </div>
        </FadeInUp>

        {/* Grid */}
        <FadeInUp delay={0.1}>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Shimmer key={i} height="20rem" className="rounded-2xl" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((template) => (
                <TemplateCard key={template.slug} template={template} />
              ))}
            </div>
          ) : (
            <EmptyState onReset={resetFilters} />
          )}
        </FadeInUp>
      </div>
    </MainLayout>
  )
}
