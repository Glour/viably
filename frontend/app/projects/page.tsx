"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { Shimmer } from "@/components/ui/shimmer"
import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectListRow } from "@/components/projects/project-list-row"
import { ProjectToolbar } from "@/components/projects/project-toolbar"
import { ProjectEmptyState } from "@/components/projects/project-empty-state"
import { ProjectNoResults } from "@/components/projects/project-no-results"
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog"
import { useProjectsStore } from "@/stores/projects"

export default function ProjectsPage() {
  const {
    projects,
    isLoading,
    searchQuery,
    filter,
    viewMode,
    loadProjects,
    deleteProject,
    getFilteredProjects,
    setSearchQuery,
    setFilter,
  } = useProjectsStore()

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filtered = getFilteredProjects()

  const handleDeleteRequest = (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (project) {
      setDeleteTarget({ id: project.id, name: project.name })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteProject(deleteTarget.id)
    toast.success(`Проект "${deleteTarget.name}" удалён`)
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
                Мои проекты
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {projects.length} проектов из 5 (Free план)
              </p>
            </div>
            <Button
              asChild
              className="bg-[image:var(--gradient-main)] text-white hover:opacity-90 transition-opacity"
            >
              <Link href="/projects/new">
                <Plus className="size-4" />
                Новый проект
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
          ) : projects.length === 0 && !searchQuery && filter === "all" ? (
            <ProjectEmptyState />
          ) : filtered.length === 0 ? (
            <ProjectNoResults onReset={handleResetFilters} />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((project) => (
                <ProjectListRow
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
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
