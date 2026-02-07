"use client"

import * as React from "react"
import { Panel, Group, Separator } from "react-resizable-panels"
import { CompactNavbar } from "@/components/generation/compact-navbar"
import { ChatPanel } from "@/components/generation/chat-panel"
import { PreviewPanel } from "@/components/generation/preview-panel"
import { DeployModal } from "@/components/generation/deploy-modal"
import { MobileTabs } from "@/components/generation/mobile-tabs"
import { useGeneration } from "@/lib/generation/use-generation"
import { useProject } from "@/lib/hooks/use-projects"

interface GeneratePageProps {
  params: Promise<{ id: string }>
}

export default function GeneratePage({ params }: GeneratePageProps) {
  const { id } = React.use(params)
  const [activeTab, setActiveTab] = React.useState("preview")

  // Load project details via React Query hook
  const { data: currentProject } = useProject(id)

  // Load generation state and actions
  const {
    generation,
    deployment,
    formValues,
    freeTextInput,
    template,
    setFormValues,
    setFreeTextInput,
    startGeneration,
    retryGeneration,
    resetGeneration,
    startDeployment,
    downloadCode,
    canGenerate,
    isGenerating,
  } = useGeneration(id)

  // Mobile tab state
  const [mobileTab, setMobileTab] = React.useState<"chat" | "preview">("chat")

  // Deploy modal state
  const [deployOpen, setDeployOpen] = React.useState(false)

  // Auto-switch to "code" tab when generation completes
  React.useEffect(() => {
    if (generation.status === "complete") {
      setActiveTab("code")
    }
  }, [generation.status])

  // Auto-switch mobile tab to "preview" on generation start
  React.useEffect(() => {
    if (isGenerating) {
      setMobileTab("preview")
    }
  }, [isGenerating])

  // localStorage persistence for split layout
  const defaultLayout = React.useMemo(() => {
    if (typeof window === "undefined") {
      return { chat: 40, preview: 60 } // Default: 40% chat, 60% preview
    }

    try {
      const saved = localStorage.getItem("gen-split-ratio")
      if (saved) {
        const parsed = JSON.parse(saved)
        return typeof parsed === "object" && parsed !== null ? parsed : { chat: 40, preview: 60 }
      }
    } catch {
      // Ignore localStorage parse errors
    }

    return { chat: 40, preview: 60 }
  }, [])

  const handleLayoutChange = React.useCallback((layout: { [id: string]: number }) => {
    try {
      localStorage.setItem("gen-split-ratio", JSON.stringify(layout))
    } catch {
      // Ignore localStorage save errors
    }
  }, [])

  // beforeunload warning when generation is in progress (FR-018)
  React.useEffect(() => {
    if (!isGenerating) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isGenerating])

  // Handlers for ChatPanel (with double-click protection FR-017)
  const handleGenerate = React.useCallback(() => {
    if (isGenerating) return
    startGeneration()
  }, [startGeneration, isGenerating])

  const handleFreeTextSubmit = React.useCallback(() => {
    if (freeTextInput.trim() && canGenerate) {
      startGeneration()
    }
  }, [freeTextInput, canGenerate, startGeneration])

  return (
    <div className="flex flex-col h-screen">
      {/* Compact Navbar */}
      <CompactNavbar
        projectName={currentProject?.name || "Loading..."}
        credits={150} // Hardcoded for MVP
      />

      {/* Desktop: Split layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <Group
          orientation="horizontal"
          id="gen-layout"
          onLayoutChange={handleLayoutChange}
          defaultLayout={defaultLayout}
        >
          {/* Left Panel: Chat */}
          <Panel minSize={25} id="chat">
            <ChatPanel
              template={template}
              formValues={formValues}
              freeTextInput={freeTextInput}
              onFormChange={setFormValues}
              onFreeTextChange={setFreeTextInput}
              onGenerate={handleGenerate}
              onFreeTextSubmit={handleFreeTextSubmit}
              canGenerate={canGenerate}
              isGenerating={isGenerating}
              credits={150} // Hardcoded for MVP
            />
          </Panel>

          {/* Separator */}
          <Separator className="w-1.5 bg-border hover:bg-primary/50 transition-colors cursor-col-resize rounded" />

          {/* Right Panel: Preview */}
          <Panel minSize={30} id="preview">
            <PreviewPanel
              generation={generation}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onDeploy={() => setDeployOpen(true)}
              onDownload={downloadCode}
              onRetry={retryGeneration}
              onModify={resetGeneration}
            />
          </Panel>
        </Group>
      </div>

      {/* Mobile: Tabbed interface */}
      <div className="flex md:hidden flex-1 overflow-hidden flex-col">
        <div className="flex-1 overflow-hidden">
          {mobileTab === "chat" ? (
            <ChatPanel
              template={template}
              formValues={formValues}
              freeTextInput={freeTextInput}
              onFormChange={setFormValues}
              onFreeTextChange={setFreeTextInput}
              onGenerate={handleGenerate}
              onFreeTextSubmit={handleFreeTextSubmit}
              canGenerate={canGenerate}
              isGenerating={isGenerating}
              credits={150}
              isMobile
            />
          ) : (
            <PreviewPanel
              generation={generation}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onDeploy={() => setDeployOpen(true)}
              onDownload={downloadCode}
              onRetry={retryGeneration}
              onModify={resetGeneration}
            />
          )}
        </div>

        {/* Bottom tabs */}
        <MobileTabs activeTab={mobileTab} onTabChange={setMobileTab} />
      </div>

      {/* Deploy Modal */}
      <DeployModal
        open={deployOpen}
        onOpenChange={setDeployOpen}
        deployment={deployment}
        onDeploy={startDeployment}
        onDownload={downloadCode}
      />
    </div>
  )
}
