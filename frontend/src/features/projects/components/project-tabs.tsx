"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"

interface ProjectTabsProps {
  children: React.ReactNode
}

function ProjectTabs({ children }: ProjectTabsProps) {
  const t = useTranslations("projects")
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const TABS = [
    { value: "overview", label: t("tab_overview") },
    { value: "code", label: t("tab_code") },
    { value: "logs", label: t("tab_logs") },
    { value: "settings", label: t("settings") },
  ] as const
  
  type TabValue = (typeof TABS)[number]["value"]
  const activeTab = (searchParams.get("tab") as TabValue) || "overview"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <div className="relative rounded-2xl p-1 bg-gradient-to-br from-card/60 via-card/40 to-card/20 border border-border/40 backdrop-blur-xl mb-6">
        <TabsList
          variant="line"
          className="w-full gap-2 bg-transparent"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 px-6 py-3 text-base font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-card/80 data-[state=active]:via-card/60 data-[state=active]:to-card/40 data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-[0_0_20px_var(--primary-glow)] hover:bg-card/20 after:hidden data-[state=active]:text-foreground data-[state=active]:bg-[image:var(--gradient-main)] data-[state=active]:bg-clip-text data-[state=active]:text-transparent"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  )
}

export { ProjectTabs }
