"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TABS = [
  { value: "overview", label: "Обзор" },
  { value: "code", label: "Код" },
  { value: "logs", label: "Логи" },
  { value: "settings", label: "Настройки" },
] as const

type TabValue = (typeof TABS)[number]["value"]

interface ProjectTabsProps {
  children: React.ReactNode
}

function ProjectTabs({ children }: ProjectTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = (searchParams.get("tab") as TabValue) || "overview"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}

export { ProjectTabs, TABS }
export type { TabValue }
