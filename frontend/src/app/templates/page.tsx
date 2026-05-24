"use client"

import dynamic from "next/dynamic"
import { MainLayout } from "@/widgets/layout"
import { FadeInUp } from "@/shared/components/motion/fade-in-up"
import { Shimmer } from "@/shared/ui/shimmer"
import { SearchBar } from "@/features/templates/components/search-bar"
import { FilterTabs } from "@/features/templates/components"
import { useTemplates } from "@/shared/hooks/use-templates"
import { useTemplatesStore } from "@/features/templates/stores"
import type { ApiTemplate, Template, TemplateCategory } from "@/shared/types"
import { useTranslations } from 'next-intl'

const TemplateGallery = dynamic(() => import("@/features/templates/components").then(m => ({ default: m.TemplateGallery })), {
  ssr: false,
  loading: () => <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array(8).fill(0).map((_, i) => <Shimmer key={i} className="h-64 rounded-2xl" />)}</div>,
})

const EmptyState = dynamic(() => import("@/features/templates/components").then(m => ({ default: m.EmptyState })), {
  ssr: false,
})

const CATEGORY_EMOJI: Record<string, string> = {
  telegram_bot: "bot",
  discord_bot: "bot",
  website: "globe",
  web_app: "globe",
  webapp: "smartphone",
  api: "zap",
  automation: "wrench",
}

function apiToTemplate(api: ApiTemplate): Template {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    emoji: CATEGORY_EMOJI[api.category] || "bot",
    description: api.description,
    category: api.category as TemplateCategory,
    creditCost: api.creditCost,
    previewImageUrl: api.previewImageUrl,
    features: api.features,
    tags: api.tags,
    configFields: [],
    isPopular: api.usageCount > 50,
  }
}

const BUSINESS_MAP: Record<string, string[]> = {
  business: ["shop-bot", "landing-page", "dashboard"],
  community: ["faq-bot"],
  personal: ["portfolio", "blog"],
}

export default function TemplatesPage() {
  const t = useTranslations('nav')
  const { searchQuery, activeTab, sortBy, resetFilters } = useTemplatesStore()
  const { data: apiTemplates, isLoading } = useTemplates()

  const templates = (apiTemplates ?? []).map(apiToTemplate)

  const filtered = templates
    .filter((tpl) => {
      const query = searchQuery.toLowerCase()
      const matchesTab =
        activeTab === "all" ||
        (BUSINESS_MAP[activeTab]?.includes(tpl.slug))
      const matchesSearch =
        !query ||
        tpl.name.toLowerCase().includes(query) ||
        tpl.description.toLowerCase().includes(query) ||
        tpl.tags?.some(tag => tag.toLowerCase().includes(query))
      return matchesTab && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === "popular") {
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
      }
      return 0
    })

  return (
    <MainLayout>
      <div className="container space-y-6 py-8">
        <FadeInUp>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t('templates')}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {t('templates_page_desc')}
            </p>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <div className="space-y-4">
            <FilterTabs />
            <SearchBar />
          </div>
        </FadeInUp>

        <FadeInUp delay={0.2}>
          {isLoading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Shimmer key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            <TemplateGallery templates={filtered} />
          )}
        </FadeInUp>
      </div>
    </MainLayout>
  )
}
