"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Gem } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"

interface CompactNavbarProps {
  projectName: string
  credits: number
}

export function CompactNavbar({ projectName, credits }: CompactNavbarProps) {
  const router = useRouter()

  return (
    <nav aria-label="Навигация генерации" className="sticky top-0 z-50">
      <div className="relative bg-background/80 backdrop-blur-xl saturate-[1.8] border-b border-border/50 overflow-hidden">
        {/* Glass morphism gradient glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-primary/8 via-primary/4 to-primary/8 pointer-events-none"
        />

        <div className="relative mx-auto max-w-[1280px] px-6 h-16 flex items-center">
          {/* Left: Logo + Project Name */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-0 group cursor-pointer">
              <div className="relative">
                {/* Gradient glow behind logo */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-[image:var(--gradient-main)] blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                />
                <span className="relative bg-[image:var(--gradient-main)] bg-clip-text text-transparent font-heading font-bold text-lg transition-all duration-300 group-hover:scale-110">
                  V
                </span>
              </div>
              <span className="font-heading font-bold text-base transition-all duration-300 group-hover:text-foreground/80">iably</span>
            </div>
            <div className="h-4 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            <span className="text-sm font-medium font-body text-foreground truncate max-w-[200px] md:max-w-[400px]">
              {projectName}
            </span>
          </div>

          {/* Right: Credits + Back Button */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Credits badge with glow effect */}
            <div className="relative group">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-[image:var(--gradient-main)] blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500"
              />
              <Badge
                variant="default"
                className="relative bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-foreground hover:from-primary/20 hover:to-primary/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary-glow)]"
              >
                <Gem className="size-3 text-primary" />
                {credits}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/projects")}
              className="gap-2 hover:bg-primary/10 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline font-body">Назад</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
