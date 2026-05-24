"use client"

import { ProjectCard } from "./project-card"
import { ProjectListRow } from "./project-list-row"
import type { Project } from "@/shared/types"

interface ProjectsListProps {
  projects: Project[]
  viewMode: "grid" | "list"
  onDelete: (id: string) => void
}

export function ProjectsList({ projects, viewMode, onDelete }: ProjectsListProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {projects.map((project) => (
        <ProjectListRow
          key={project.id}
          project={project}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
