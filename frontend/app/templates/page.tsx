"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { Shimmer } from "@/components/ui/shimmer"
import { TemplateCard } from "@/components/templates/template-card"
import { EmptyState } from "@/components/templates/empty-state"
import { SearchBar } from "@/components/templates/search-bar"
import { FilterTabs } from "@/components/templates/filter-tabs"
import { useTemplates } from "@/lib/hooks/use-templates"
import { useTemplatesStore } from "@/stores/templates"
import type { ApiTemplate, Template, TemplateCategory } from "@/types"

function apiToTemplate(api: ApiTemplate): Template {
  return {
    slug: api.slug,
    name: api.name,
    emoji: "\u{1F916}",
    description: api.description,
    category: api.category as TemplateCategory,
    creditCost: api.creditCost,
    features: api.features,
    tags: api.tags,
    configFields: [],
    isPopular: api.usageCount > 50,
  }
}

export default function TemplatesPage() {
  const { searchQuery, activeTab, resetFilters } = useTemplatesStore()
  const { data: apiTemplates, isLoading } = useTemplates()

  const templates = (apiTemplates ?? []).map(apiToTemplate)

  const filtered = templates.filter((t) => {
    const query = searchQuery.toLowerCase()
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "telegram" && t.category === "telegram_bot") ||
      (activeTab === "popular" && t.isPopular) ||
      (activeTab === "cheap" && t.creditCost < 5)
    const matchesSearch =
      !query ||
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    return matchesTab && matchesSearch
  })

  return (
    <MainLayout>
      <div className="space-y-8">
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

        <FadeInUp delay={0.1}>
          <SearchBar />
        </FadeInUp>

        <FadeInUp delay={0.15}>
          <FilterTabs />
        </FadeInUp>

        <FadeInUp delay={0.2}>
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
