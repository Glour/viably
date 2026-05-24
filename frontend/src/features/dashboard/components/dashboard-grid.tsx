"use client"

import Link from "next/link"
import { FolderOpen, Rocket, ArrowRight } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Shimmer } from "@/shared/ui/shimmer"
import { useRecentProjects } from "@/entities/project"
import { useAuthStore } from "@/features/auth/stores"

import { ProjectCard } from "./project-card"

export function DashboardGrid() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: projects, isLoading } = useRecentProjects(isAuthenticated)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold tracking-tight">Мои проекты</h2>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
        >
          <span>Все проекты</span>
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="rounded-2xl" height="10rem" />
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} index={projects.indexOf(project)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-10 text-center">
          <div className="mb-4">
            <div className="size-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4"><FolderOpen className="size-8 text-muted-foreground" /></div>
          </div>
          <h3 className="font-heading text-xl font-bold mb-2">
            У тебя пока нет проектов
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Создай первый бот за 60 секунд — выбери шаблон или начни с нуля.
          </p>
          <Button
            asChild
            size="default"
            className="h-11 px-6 text-sm font-semibold bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_12px_var(--primary-glow)] transition-all duration-200 hover:bg-[position:100%_100%] hover:shadow-[0_0_20px_var(--primary-glow)] hover:-translate-y-0.5"
          >
            <Link href="/templates">
              <Rocket className="size-4 mr-2" />
              Создать первый проект
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
