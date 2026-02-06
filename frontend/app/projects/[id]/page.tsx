"use client"

import { useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { Shimmer } from "@/components/ui/shimmer"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import { ProjectDetailHeader } from "@/components/projects/project-detail-header"
import { ProjectTabs } from "@/components/projects/project-tabs"
import { OverviewTab } from "@/components/projects/overview-tab"
import { CodeViewer } from "@/components/projects/code-viewer"
import { LogsViewer } from "@/components/projects/logs-viewer"
import { ProjectSettings } from "@/components/projects/project-settings"
import { useProjectsStore } from "@/stores/projects"
import { toggleProjectStatus } from "@/lib/api/projects"

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { currentProject, isLoading, loadProject, deleteProject } = useProjectsStore()

  useEffect(() => {
    loadProject(id)
  }, [id, loadProject])

  return (
    <MainLayout>
      <div className="space-y-8">
        {isLoading ? (
          <div className="space-y-6">
            {/* Breadcrumb shimmer */}
            <Shimmer height="1.25rem" width="12rem" />
            {/* Card shimmer */}
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Shimmer height="2.5rem" width="2.5rem" className="rounded-lg" />
                <Shimmer height="2rem" width="40%" />
                <Shimmer height="1.5rem" width="5rem" className="rounded-full" />
              </div>
              <Shimmer height="1rem" width="30%" />
              <div className="flex gap-2">
                <Shimmer height="2.25rem" width="10rem" className="rounded-md" />
                <Shimmer height="2.25rem" width="8rem" className="rounded-md" />
                <Shimmer height="2.25rem" width="8rem" className="rounded-md" />
              </div>
            </div>
            {/* Tabs shimmer */}
            <Shimmer height="2.5rem" width="20rem" className="rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} height="5rem" className="rounded-xl" />
              ))}
            </div>
          </div>
        ) : currentProject ? (
          <FadeInUp delay={0}>
            <div className="space-y-8">
              <ProjectDetailHeader project={currentProject} />

              <Suspense fallback={<Shimmer height="2.5rem" width="20rem" className="rounded-lg" />}>
                <ProjectTabs>
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab project={currentProject} />
                  </TabsContent>

                  <TabsContent value="code" className="mt-6">
                    <CodeViewer files={currentProject.files} />
                  </TabsContent>

                  <TabsContent value="logs" className="mt-6">
                    <LogsViewer logs={currentProject.logs} />
                  </TabsContent>

                  <TabsContent value="settings" className="mt-6">
                    <ProjectSettings
                      project={currentProject}
                      onToggleStatus={async (action) => {
                        const res = await toggleProjectStatus(currentProject.id, action)
                        if (res.success) {
                          toast.success(action === "start" ? "Бот запущен" : "Бот остановлен")
                          loadProject(currentProject.id)
                        }
                      }}
                      onDelete={async () => {
                        await deleteProject(currentProject.id)
                        toast.success(`Проект "${currentProject.name}" удалён`)
                        router.push("/projects")
                      }}
                    />
                  </TabsContent>
                </ProjectTabs>
              </Suspense>
            </div>
          </FadeInUp>
        ) : (
          <FadeInUp delay={0}>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-6xl mb-4" aria-hidden="true">
                🔍
              </span>
              <p className="font-heading text-lg font-semibold">
                Проект не найден
              </p>
              <p className="text-muted-foreground mt-1">
                Возможно, он был удалён или ссылка некорректна
              </p>
              <Button variant="secondary" className="mt-4" asChild>
                <Link href="/projects">Назад к проектам</Link>
              </Button>
            </div>
          </FadeInUp>
        )}
      </div>
    </MainLayout>
  )
}
