"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMounted } from "@/hooks/use-mounted"
import type { LucideIcon } from "lucide-react"

interface ThemeOption {
  value: string
  label: string
  description: string
  icon: LucideIcon
}

const themeOptions: ThemeOption[] = [
  {
    value: "light",
    label: "Светлая",
    description: "Классическая светлая тема для комфортной работы днём",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Тёмная",
    description: "Тёмная тема для снижения нагрузки на глаза",
    icon: Moon,
  },
  {
    value: "system",
    label: "Системная",
    description: "Автоматически следует настройкам вашей ОС",
    icon: Monitor,
  },
]

export function ThemeSelector() {
  const mounted = useMounted()
  const { theme, setTheme } = useTheme()

  if (!mounted) return null

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Оформление</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {themeOptions.map((option) => {
          const isSelected = theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className="text-left"
            >
              <Card
                className={cn(
                  "transition-all cursor-pointer hover:border-primary/50",
                  isSelected && "ring-2 ring-primary border-primary bg-primary-subtle/30"
                )}
              >
                <CardContent className="pt-6 space-y-3">
                  {/* Preview */}
                  <div
                    className={cn(
                      "rounded-lg border p-3 space-y-2",
                      option.value === "dark"
                        ? "bg-zinc-900 border-zinc-700"
                        : option.value === "light"
                          ? "bg-white border-zinc-200"
                          : "bg-gradient-to-r from-white to-zinc-900 border-zinc-300"
                    )}
                  >
                    <div
                      className={cn(
                        "h-2 rounded-full w-3/4",
                        option.value === "dark" ? "bg-zinc-700" : "bg-zinc-200"
                      )}
                    />
                    <div
                      className={cn(
                        "h-2 rounded-full w-1/2",
                        option.value === "dark" ? "bg-zinc-700" : "bg-zinc-200"
                      )}
                    />
                    <div
                      className={cn(
                        "h-2 rounded-full w-2/3",
                        option.value === "dark" ? "bg-zinc-700" : "bg-zinc-200"
                      )}
                    />
                  </div>

                  {/* Label + icon */}
                  <div className="flex items-center gap-2">
                    <option.icon className="size-4 text-primary" />
                    <span className="font-semibold text-sm">{option.label}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )
}
