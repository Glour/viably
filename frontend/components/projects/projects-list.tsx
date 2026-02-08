"use client"

import { useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ProjectCard } from "./project-card"
import { ProjectListRow } from "./project-list-row"
import type { Project } from "@/types"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProjectsListProps {
  projects: Project[]
  viewMode: "grid" | "list"
  onDelete: (id: string) => void
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

// Estimated sizes for virtualization
const ESTIMATED_CARD_HEIGHT = 224 // ~14rem from ProjectCard
const ESTIMATED_ROW_HEIGHT = 64 // ~4rem from ProjectListRow
const GRID_GAP = 24 // 1.5rem (gap-6)
const GRID_COLUMNS = {
  sm: 1,
  md: 2,
  lg: 3,
} as const

/* ------------------------------------------------------------------ */
/*  Virtualized Grid                                                   */
/* ------------------------------------------------------------------ */

function VirtualizedGrid({ projects, onDelete }: Omit<ProjectsListProps, "viewMode">) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate columns based on container width
  // For simplicity, we use a fixed 3-column layout (lg breakpoint)
  // In production, you might want to use a resize observer
  const columns = GRID_COLUMNS.lg

  // Calculate virtual rows (each row contains multiple cards)
  const rowCount = Math.ceil(projects.length / columns)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT + GRID_GAP,
    overscan: 2, // Render 2 extra rows above/below viewport
  })

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-20rem)] overflow-auto"
      style={{
        contain: "strict",
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns
          const endIndex = Math.min(startIndex + columns, projects.length)
          const rowProjects = projects.slice(startIndex, endIndex)

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rowProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Virtualized List                                                   */
/* ------------------------------------------------------------------ */

function VirtualizedList({ projects, onDelete }: Omit<ProjectsListProps, "viewMode">) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 5, // Render 5 extra rows above/below viewport
  })

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-20rem)] overflow-auto"
      style={{
        contain: "strict",
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <div className="space-y-1">
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const project = projects[virtualRow.index]

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ProjectListRow
                  project={project}
                  onDelete={onDelete}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ProjectsList({ projects, viewMode, onDelete }: ProjectsListProps) {
  // Fallback to non-virtualized rendering for small lists
  if (projects.length < 20) {
    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

  // Use virtualization for large lists (>= 20 items)
  if (viewMode === "grid") {
    return <VirtualizedGrid projects={projects} onDelete={onDelete} />
  }

  return <VirtualizedList projects={projects} onDelete={onDelete} />
}
