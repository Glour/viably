"use client"

import { Button } from "@/shared/ui/button"
import { useTranslations } from "next-intl"

interface EmptyStateProps {
  onReset?: () => void
}

export function EmptyState({ onReset }: EmptyStateProps) {
  const t = useTranslations("projects")
  return (
    <div className="relative rounded-3xl p-12 md:p-16 overflow-hidden bg-gradient-to-br from-primary/5 via-primary-subtle to-transparent border border-border/50 backdrop-blur-xl">
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-glow)] blur-[80px] opacity-20 rounded-full" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 blur-[60px] opacity-20 rounded-full" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="mb-6 animate-float">
          <span className="text-8xl drop-shadow-lg" aria-hidden="true">
            📭
          </span>
        </div>
        <h3 className="font-heading text-2xl md:text-3xl font-bold mb-2 bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
          {t("not_found")}
        </h3>
        <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-md">
          Попробуйте изменить параметры поиска
        </p>
        {onReset && (
          <Button
            onClick={onReset}
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_20px_var(--primary-glow)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_32px_var(--primary-glow)] hover:scale-105"
          >
            Сбросить фильтры
          </Button>
        )}
      </div>
    </div>
  )
}
