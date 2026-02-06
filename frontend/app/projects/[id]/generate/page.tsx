"use client"

import * as React from "react"
import { Panel, Group, Separator } from "react-resizable-panels"
import { CompactNavbar } from "@/components/generation/compact-navbar"
import { ChatPanel } from "@/components/generation/chat-panel"
import { PreviewPanel } from "@/components/generation/preview-panel"
import { useGeneration } from "@/lib/generation/use-generation"
import { useProjectsStore } from "@/stores/projects"

interface GeneratePageProps {
  params: Promise<{ id: string }>
}

export default function GeneratePage({ params }: GeneratePageProps) {
  const { id } = React.use(params)
  const [activeTab, setActiveTab] = React.useState("preview")

  // Load project details
  const { currentProject, loadProject } = useProjectsStore()

  // Load generation state and actions
  const {
    generation,
    formValues,
    freeTextInput,
    template,
    setFormValues,
    setFreeTextInput,
    startGeneration,
    canGenerate,
    isGenerating,
  } = useGeneration(id)

  // Load project on mount
  React.useEffect(() => {
    loadProject(id)
  }, [id, loadProject])

  // Auto-switch to "code" tab when generation completes
  React.useEffect(() => {
    if (generation.status === "complete") {
      setActiveTab("code")
    }
  }, [generation.status])

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
    } catch (error) {
      console.error("Failed to parse saved layout:", error)
    }

    return { chat: 40, preview: 60 }
  }, [])

  const handleLayoutChange = React.useCallback((layout: { [id: string]: number }) => {
    try {
      localStorage.setItem("gen-split-ratio", JSON.stringify(layout))
    } catch (error) {
      console.error("Failed to save layout:", error)
    }
  }, [])

  // Handlers for ChatPanel
  const handleGenerate = React.useCallback(() => {
    startGeneration()
  }, [startGeneration])

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
            />
          </Panel>
        </Group>
      </div>

      {/* Mobile: Full-width ChatPanel only (mobile tabs integration comes in T028) */}
      <div className="flex md:hidden flex-1 overflow-hidden">
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
      </div>
    </div>
  )
}
