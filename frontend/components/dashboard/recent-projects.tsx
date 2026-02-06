import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/utils/format-relative-time"
import type { ProjectStatus, ProjectSummary } from "@/types"

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" }
> = {
  deployed: { label: "Deployed", variant: "success" },
  ready: { label: "Ready", variant: "warning" },
  draft: { label: "Draft", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
}

interface RecentProjectsProps {
  projects: ProjectSummary[]
}

export function RecentProjects({ projects }: RecentProjectsProps) {
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

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((project) => {
            const status = STATUS_CONFIG[project.status]

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="cursor-pointer">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{project.emoji}</span>
                      <span className="font-medium truncate">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(project.updatedAt)}
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
