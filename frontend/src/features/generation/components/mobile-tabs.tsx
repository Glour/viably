"use client"

import { motion } from "motion/react"
import { MessageSquare, Eye } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface MobileTabsProps {
  activeTab: "chat" | "preview"
  onTabChange: (tab: "chat" | "preview") => void
}

export function MobileTabs({ activeTab, onTabChange }: MobileTabsProps) {
  const tabs = [
    {
      id: "chat" as const,
      label: "Чат",
      icon: MessageSquare,
    },
    {
      id: "preview" as const,
      label: "Предпросмотр",
      icon: Eye,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background/95 backdrop-blur-xl saturate-[1.8] border-t border-border/50">
        <div className="flex items-center justify-around px-4 pb-safe">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-3 px-6 min-h-[3rem] flex-1 touch-manipulation transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Animated background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-tab-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-lg"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                {/* Icon and label */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium font-body">{tab.label}</span>
                </div>

                {/* Active indicator line at top */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-tab-line"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-12 bg-primary rounded-full"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
