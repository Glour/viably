"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, MessageSquare, Eye, Rocket } from "lucide-react"
import Link from "next/link"
import { motion } from "motion/react"
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels"
import { MainLayout } from "@/widgets/layout"
import { FadeInUp } from "@/shared/components/motion/fade-in-up"
import { Shimmer } from "@/shared/ui/shimmer"
import { Button } from "@/shared/ui/button"
import { ChatPanel } from "@/features/generation/components"
import { ArtifactPreviewPanel } from "@/shared/components/artifacts"
import { FeatureGallery } from "@/shared/components/artifacts/FeatureGallery"
import { DeployModal } from "@/features/generation/components/deploy-modal"
import { useConversationStore } from "@/features/generation/stores"
import { useProject } from "@/shared/hooks/use-projects"
import { useConversations, useCreateConversation, downloadProjectZip } from "@/features/generation/api"
import { useTemplate } from "@/shared/hooks/use-templates"
import { toast } from "sonner"

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}

export default function AIEditorPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat")
  const [deployOpen, setDeployOpen] = useState(false)

  const { data: project, isLoading: isLoadingProject } = useProject(projectId)
  const { data: templateData } = useTemplate(project?.templateId || "")
  const { data: conversationsData, isLoading: isLoadingConversations } = useConversations(projectId)
  const createConversationMutation = useCreateConversation()

  const {
    currentConversation,
    messages,
    artifacts,
    activeArtifactId,
    isStreaming,
    loadConversation,
    reset,
  } = useConversationStore()

  const loadingRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    if (!projectId || isLoadingConversations || !conversationsData) return

    const existingConversations = conversationsData.items

    if (existingConversations.length === 0) {
      if (createConversationMutation.isPending) return

      createConversationMutation.mutate(
        {
          project_id: projectId,
          title: project?.name ? `${project.name} - AI Chat` : "AI Чат",
        },
        {
          onSuccess: (newConversation) => {
            if (!mountedRef.current) return
            if (loadingRef.current === newConversation.id) return
            loadingRef.current = newConversation.id
            loadConversation(newConversation.id).catch((err) => {
              console.error("[AIEditorPage] Failed to load new conversation:", err)
              if (mountedRef.current) {
                loadingRef.current = null
                toast.error("Не удалось загрузить диалог")
              }
            })
          },
          onError: () => {
            toast.error("Не удалось создать диалог")
          },
        }
      )
    } else {
      const latestConversation = existingConversations[0]
      if (loadingRef.current === latestConversation.id) return
      loadingRef.current = latestConversation.id
      loadConversation(latestConversation.id).catch((err) => {
        console.error("[AIEditorPage] Failed to load conversation:", err)
        if (mountedRef.current) {
          loadingRef.current = null
          toast.error("Не удалось загрузить диалог")
        }
      })
    }
  }, [projectId, conversationsData, isLoadingConversations])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      loadingRef.current = null
      reset()
    }
  }, [])

  // Pick up prompt from Hero page (sessionStorage)
  const promptSentRef = useRef(false)
  useEffect(() => {
    if (!currentConversation || promptSentRef.current) return
    const savedPrompt = sessionStorage.getItem("viably_prompt")
    if (savedPrompt) {
      promptSentRef.current = true
      sessionStorage.removeItem("viably_prompt")
      // sendMessage now awaits WebSocket connection internally
      useConversationStore.getState().sendMessage(savedPrompt).catch((err) => {
        console.error("[AIEditorPage] Failed to send saved prompt:", err)
        promptSentRef.current = false
      })
    }
  }, [currentConversation])

  // Auto-switch to preview on mobile when artifacts appear
  useEffect(() => {
    if (isMobile && artifacts.size > 0 && !isStreaming) {
      setMobileTab("preview")
    }
  }, [artifacts.size, isMobile, isStreaming])

  const isLoading = isLoadingProject || isLoadingConversations

  if (isLoading) {
    return (
      <MainLayout fullscreen>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b bg-background/95 backdrop-blur px-6 py-4">
            <div className="flex items-center gap-4">
              <Shimmer width="2rem" height="2rem" />
              <div className="space-y-2">
                <Shimmer width="12rem" height="1.5rem" />
                <Shimmer width="8rem" height="1rem" />
              </div>
            </div>
          </div>
          <div className="flex-1 p-6 space-y-4">
            <Shimmer width="100%" height="4rem" />
            <Shimmer width="100%" height="4rem" />
            <Shimmer width="100%" height="4rem" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!currentConversation) {
    return (
      <MainLayout fullscreen>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Создаём диалог...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const artifactsArray = Array.from(artifacts.values())
  const isWebProject = artifactsArray.some((a) =>
    a.type === "html" || a.type === "react" || a.type === "vue" || a.type === "svelte"
  )

  const previewContent = artifactsArray.length > 0 ? (
    <ArtifactPreviewPanel
      artifacts={artifactsArray}
      activeArtifactId={activeArtifactId}
      isStreaming={isStreaming}
      isBotProject={templateData?.category === "telegram_bot" || templateData?.category === "telegram-bot"}
      onSelectArtifact={(id) => useConversationStore.getState().selectArtifact(id)}
      onUpdateArtifact={async (id, update) => {
        try {
          await useConversationStore.getState().updateArtifact(id, update)
          toast.success("Артефакт обновлён")
        } catch (error) {
          toast.error("Не удалось обновить артефакт")
        }
      }}
      onReady={() => setMobileTab("preview")}
    />
  ) : (
    <FeatureGallery className="flex-1" />
  )

  return (
    <MainLayout fullscreen>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur-sm px-4 md:px-6 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Spacer for mobile hamburger button */}
              <div className="w-8 md:hidden shrink-0" />
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="gap-1 px-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Назад</span>
                </Button>
              </Link>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">{project?.name}</p>
                  <p className="text-xs text-muted-foreground hidden md:block">AI Редактор</p>
                </div>
              </div>
            </div>

            {/* Mobile controls */}
            {isMobile && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 bg-muted/30 rounded-full p-1">
                  <Button
                    variant={mobileTab === "chat" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setMobileTab("chat")}
                    title="Чат"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={mobileTab === "preview" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setMobileTab("preview")}
                    title="Превью"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setDeployOpen(true)}
                  disabled={artifacts.size === 0}
                  className="h-8 w-8 p-0 bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 shrink-0"
                  title="Деплой"
                >
                  <Rocket className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {!isMobile && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled={isStreaming} className="text-xs">
                  {messages.length} сообщений
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setDeployOpen(true)}
                  disabled={artifacts.size === 0}
                  className="gap-1.5 text-xs bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  Деплой
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isMobile ? (
            /* Mobile: tab-based layout */
            <div className="h-full">
              {mobileTab === "chat" ? (
                <ChatPanel conversationId={currentConversation.id} className="h-full" templateCategory={templateData?.category} />
              ) : (
                <div className="h-full flex flex-col">
                  {previewContent}
                </div>
              )}
            </div>
          ) : (
            /* Desktop: fixed chat + flex preview */
            <div className="flex h-full">
              <div className="w-[380px] shrink-0 flex flex-col overflow-hidden border-r border-border/50">
                <ChatPanel conversationId={currentConversation.id} className="flex-1" templateCategory={templateData?.category} />
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                {previewContent}
              </div>
            </div>
          )}
        </div>
        <DeployModal
          open={deployOpen}
          onOpenChange={setDeployOpen}
          projectId={projectId}
          onDownload={() => { downloadProjectZip(projectId).catch(() => toast.error("Не удалось скачать ZIP")) }}
          isWebProject={isWebProject}
        />
      </div>
    </MainLayout>
  )
}