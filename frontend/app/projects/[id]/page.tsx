"use client"

import { Suspense } from "react"
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
import { useProject, useDeleteProject } from "@/lib/hooks/use-projects"
import type { ApiProject, Project, ProjectFile, LogEntry } from "@/types"

// ---------------------------------------------------------------------------
// Adapters: ApiProject -> local types consumed by child components
// ---------------------------------------------------------------------------

function apiToProject(api: ApiProject): Project {
  return {
    id: api.id,
    name: api.name,
    emoji: "\u{1F916}",
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

function apiToCodeFiles(api: ApiProject): ProjectFile[] {
  if (!api.generatedCode) return []

  return Object.entries(api.generatedCode.files).map(([path, content]) => ({
    path,
    name: path.split("/").pop() ?? path,
    type: "file" as const,
    content,
  }))
}

function apiToLogEntries(api: ApiProject): LogEntry[] {
  if (!api.generationLogs) return []

  return [
    {
      id: "1",
      timestamp: api.createdAt,
      level: "info" as const,
      message: api.generationLogs,
    },
  ]
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: apiProject, isLoading } = useProject(id)
  const deleteMutation = useDeleteProject()

  const project = apiProject ? apiToProject(apiProject) : null
  const codeFiles = apiProject ? apiToCodeFiles(apiProject) : []
  const logEntries = apiProject ? apiToLogEntries(apiProject) : []

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
                <Shimmer
                  height="2.5rem"
                  width="2.5rem"
                  className="rounded-lg"
                />
                <Shimmer height="2rem" width="40%" />
                <Shimmer
                  height="1.5rem"
                  width="5rem"
                  className="rounded-full"
                />
              </div>
              <Shimmer height="1rem" width="30%" />
              <div className="flex gap-2">
                <Shimmer
                  height="2.25rem"
                  width="10rem"
                  className="rounded-md"
                />
                <Shimmer
                  height="2.25rem"
                  width="8rem"
                  className="rounded-md"
                />
                <Shimmer
                  height="2.25rem"
                  width="8rem"
                  className="rounded-md"
                />
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
        ) : project ? (
          <FadeInUp delay={0}>
            <div className="space-y-8">
              <ProjectDetailHeader project={project} />

              <Suspense
                fallback={
                  <Shimmer
                    height="2.5rem"
                    width="20rem"
                    className="rounded-lg"
                  />
                }
              >
                <ProjectTabs>
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab project={project} />
                  </TabsContent>

                  <TabsContent value="code" className="mt-6">
                    <CodeViewer files={codeFiles} />
                  </TabsContent>

                  <TabsContent value="logs" className="mt-6">
                    <LogsViewer logs={logEntries} />
                  </TabsContent>

                  <TabsContent value="settings" className="mt-6">
                    <ProjectSettings
                      project={project}
                      onToggleStatus={() => {
                        toast.info(
                          "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u043C \u043F\u043E\u043A\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E",
                        )
                      }}
                      onDelete={async () => {
                        try {
                          await deleteMutation.mutateAsync(project.id)
                          toast.success(
                            `\u041F\u0440\u043E\u0435\u043A\u0442 "${project.name}" \u0443\u0434\u0430\u043B\u0451\u043D`,
                          )
                          router.push("/projects")
                        } catch {
                          toast.error(
                            "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442",
                          )
                        }
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
                {"\u{1F50D}"}
              </span>
              <p className="font-heading text-lg font-semibold">
                {"\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"}
              </p>
              <p className="text-muted-foreground mt-1">
                {"\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043E\u043D \u0431\u044B\u043B \u0443\u0434\u0430\u043B\u0451\u043D \u0438\u043B\u0438 \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u0430"}
              </p>
              <Button variant="secondary" className="mt-4" asChild>
                <Link href="/projects">
                  {"\u041D\u0430\u0437\u0430\u0434 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0430\u043C"}
                </Link>
              </Button>
            </div>
          </FadeInUp>
        )}
      </div>
    </MainLayout>
  )
}
