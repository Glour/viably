"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Gem } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CompactNavbarProps {
  projectName: string
  credits: number
}

export function CompactNavbar({ projectName, credits }: CompactNavbarProps) {
  const router = useRouter()

  return (
    <nav aria-label="Навигация генерации" className="sticky top-0 z-50">
      <div className="bg-background/80 backdrop-blur-xl saturate-[1.8] border-b">
        <div className="mx-auto max-w-[1280px] px-6 h-12 flex items-center">
          {/* Left: Logo + Project Name */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-0">
              <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent font-heading font-bold text-lg">
                V
              </span>
              <span className="font-heading font-bold text-base">iably</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-medium text-foreground truncate max-w-[200px] md:max-w-[400px]">
              {projectName}
            </span>
          </div>

          {/* Right: Credits + Back Button */}
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="default">
              <Gem className="size-3" />
              {credits}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/projects")}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Назад</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
