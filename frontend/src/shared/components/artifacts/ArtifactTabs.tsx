"use client"

import { memo } from "react"
import { cn } from "@/shared/lib/utils"
import { FileCode2, FileText, FileType, Braces } from "lucide-react"
import type { Artifact } from "@/features/generation/types"

interface ArtifactTabsProps {
  artifacts: Artifact[]
  activeArtifactId: string | null
  onSelectArtifact: (artifactId: string) => void
  className?: string
}

const TYPE_ICONS: Record<string, typeof FileCode2> = {
  html: FileCode2,
  css: FileType,
  javascript: Braces,
  typescript: Braces,
  python: FileCode2,
  react: Braces,
  json: Braces,
  markdown: FileText,
  text: FileText,
}

const TYPE_COLORS: Record<string, string> = {
  html: "text-orange-400",
  css: "text-purple-400",
  javascript: "text-yellow-400",
  typescript: "text-blue-400",
  python: "text-green-400",
  react: "text-cyan-400",
  json: "text-yellow-300",
  markdown: "text-gray-400",
  text: "text-gray-400",
}

const TYPE_EXT: Record<string, string> = {
  html: "html",
  css: "css",
  javascript: "js",
  typescript: "ts",
  python: "py",
  react: "tsx",
  json: "json",
  markdown: "md",
}

export const ArtifactTabs = memo(function ArtifactTabs({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  className,
}: ArtifactTabsProps) {
  if (artifacts.length <= 1) return null

  return (
    <div
      className={cn(
        "flex items-center gap-0 h-9 border-b border-white/[0.06] bg-background/50 overflow-x-auto shrink-0",
        className
      )}
    >
      {artifacts.map((artifact) => {
        const isActive = artifact.id === activeArtifactId
        const Icon = TYPE_ICONS[artifact.type] || FileText
        const color = TYPE_COLORS[artifact.type] || "text-gray-400"
        const ext = TYPE_EXT[artifact.type] || artifact.language || "txt"
        const label = artifact.title || `file.${ext}`

        return (
          <button
            key={artifact.id}
            onClick={() => onSelectArtifact(artifact.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 h-full text-[12px] font-mono transition-all duration-150 whitespace-nowrap border-b-2",
              isActive
                ? "border-b-violet-500 text-foreground/90 bg-white/[0.04]"
                : "border-b-transparent text-muted-foreground/50 hover:text-foreground/70 hover:bg-white/[0.03]"
            )}
          >
            <Icon className={cn("size-3 shrink-0", isActive ? color : "opacity-50")} />
            {label}
          </button>
        )
      })}
    </div>
  )
})
