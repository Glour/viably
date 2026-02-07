"use client"

import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shimmer } from "@/components/ui/shimmer"
import { formatRelativeTime } from "@/lib/utils/format-relative-time"
import { useRecentProjects } from "@/lib/hooks/use-projects"
import type { ProjectStatus } from "@/types"

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  generating: { label: "Generating", variant: "warning" },
  generated: { label: "Generated", variant: "warning" },
  deployed: { label: "Deployed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  stopped: { label: "Stopped", variant: "destructive" },
}

const DEFAULT_EMOJI = "\u{1F916}" // robot face

export function RecentProjects() {
  const { data: projects, isLoading } = useRecentProjects()

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold">Мои проекты</h2>
        <Link
          href="/projects"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Все проекты &rarr;
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Shimmer className="rounded-2xl" height="8rem" />
          <Shimmer className="rounded-2xl" height="8rem" />
          <Shimmer className="rounded-2xl" height="8rem" />
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((project) => {
            const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="cursor-pointer">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{DEFAULT_EMOJI}</span>
                      <span className="font-medium truncate">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {project.updatedAt
                          ? formatRelativeTime(project.updatedAt)
                          : formatRelativeTime(project.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-6xl mb-4">📦</span>
          <p className="font-heading text-lg font-semibold">
            У тебя пока нет проектов
          </p>
          <p className="text-muted-foreground mt-1">
            Создай первый бот за 60 секунд!
          </p>
          <Button asChild className="mt-4">
            <Link href="/projects/new">Создать проект &rarr;</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
