"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { Shimmer } from "@/components/ui/shimmer"
import { Button } from "@/components/ui/button"
import { ProjectsList } from "@/components/projects/projects-list"
import { ProjectToolbar } from "@/components/projects/project-toolbar"
import { ProjectEmptyState } from "@/components/projects/project-empty-state"
import { ProjectNoResults } from "@/components/projects/project-no-results"
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog"
import { useProjects, useDeleteProject } from "@/lib/hooks/use-projects"
import { useProjectsStore } from "@/stores/projects"
import type { ApiProject, Project } from "@/types"

// ---------------------------------------------------------------------------
// Adapter: ApiProject -> local Project (consumed by ProjectCard / ListRow)
// ---------------------------------------------------------------------------

function apiToProject(api: ApiProject): Project {
  return {
    id: api.id,
    name: api.name,
    emoji: "\u{1F916}", // backend doesn't store emoji
    description: api.description ?? "",
    status: api.status,
    category: "telegram_bot",
    createdAt: api.createdAt,
    updatedAt: api.updatedAt ?? api.createdAt,
    config: api.config as Record<string, string>,
    deployment: api.deployedUrl
      ? {
          url: api.deployedUrl,
          botUsername: "",
          status: api.status === "deployed" ? "running" : "stopped",
          runningSince: api.deployedAt,
          costEstimate: "",
        }
      : null,
    files: [],
    envVars: [],
    logs: [],
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  const { searchQuery, filter, sort, viewMode, setSearchQuery, setFilter } =
    useProjectsStore()

  const { data, isLoading } = useProjects()
  const deleteMutation = useDeleteProject()

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  // Map API models to local Project shape
  const allProjects = (data?.items ?? []).map(apiToProject)

  // Client-side filtering + sorting (mirrors the old store logic)
  const filtered = allProjects
    .filter((p) => {
      const matchesFilter = filter === "all" || p.status === filter
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      switch (sort) {
        case "newest":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        case "oldest":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          )
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  // Handlers
  const handleDeleteRequest = (id: string) => {
    const project = allProjects.find((p) => p.id === id)
    if (project) {
      setDeleteTarget({ id: project.id, name: project.name })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success(`\u041F\u0440\u043E\u0435\u043A\u0442 "${deleteTarget.name}" \u0443\u0434\u0430\u043B\u0451\u043D`)
    } catch {
      toast.error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442")
    }
    setDeleteTarget(null)
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setFilter("all")
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <FadeInUp delay={0}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">
                {"\u041C\u043E\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u044B"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {allProjects.length}{" "}
                {"\u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432 \u0438\u0437 5 (Free \u043F\u043B\u0430\u043D)"}
              </p>
            </div>
            <Button
              asChild
              className="bg-[image:var(--gradient-main)] text-white hover:opacity-90 transition-opacity"
            >
              <Link href="/projects/new">
                <Plus className="size-4" />
                {"\u041D\u043E\u0432\u044B\u0439 \u043F\u0440\u043E\u0435\u043A\u0442"}
              </Link>
            </Button>
          </div>
        </FadeInUp>

        {/* Toolbar */}
        <FadeInUp delay={0.1}>
          <ProjectToolbar />
        </FadeInUp>

        {/* Content */}
        <FadeInUp delay={0.2}>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Shimmer key={i} height="14rem" className="rounded-2xl" />
              ))}
            </div>
          ) : allProjects.length === 0 && !searchQuery && filter === "all" ? (
            <ProjectEmptyState />
          ) : filtered.length === 0 ? (
            <ProjectNoResults onReset={handleResetFilters} />
          ) : (
            <ProjectsList
              projects={filtered}
              viewMode={viewMode}
              onDelete={handleDeleteRequest}
            />
          )}
        </FadeInUp>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteProjectDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        projectName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
      />
    </MainLayout>
  )
}
