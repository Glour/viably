"use client"

/**
 * SandpackPreview — real Sandpack-based fallback preview for browsers
 * without WebContainer support (Safari, iOS, Android, etc.).
 * Feature: 002-production-preview
 *
 * Uses @codesandbox/sandpack-react with the `react-ts` template.
 * Loads npm packages from CDN — lucide-react, radix-ui, etc. all work.
 * Tailwind CSS via CDN script tag (externalResources).
 *
 * Fallback chain: WebContainers → Sandpack → BabelPreview
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Artifact } from '@/features/generation/types/conversation'
import type { DeviceSize } from './types'
import { canRunSandpack } from './browser-capabilities'
import { artifactsToSandpackFiles } from './artifacts-to-sandpack'
import { BabelPreview } from './BabelPreview'

// ============================================================================
// Lazy-loaded Sandpack components (avoid SSR issues)
// ============================================================================

let SandpackProvider: typeof import('@codesandbox/sandpack-react').SandpackProvider | null = null
let SandpackPreviewFrame: typeof import('@codesandbox/sandpack-react').SandpackPreview | null = null
// Console removed — warnings (Tailwind CDN, React Router future flags) waste
// space and obscure the preview for no benefit.
let sandpackImportPromise: Promise<void> | null = null

function loadSandpack(): Promise<void> {
  if (SandpackProvider && SandpackPreviewFrame) return Promise.resolve()
  if (sandpackImportPromise) return sandpackImportPromise

  sandpackImportPromise = import('@codesandbox/sandpack-react').then((mod) => {
    SandpackProvider = mod.SandpackProvider
    SandpackPreviewFrame = mod.SandpackPreview
    // SandpackConsole intentionally not loaded
  })
  return sandpackImportPromise
}

// ============================================================================
// Constants
// ============================================================================

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

/**
 * Dependencies for Sandpack react-ts template.
 * Sandpack fetches these from sandpack-bundler.codesandbox.io (their own CDN),
 * NOT from registry.npmjs.org — so network access to npmjs is not required.
 */
function getSandpackDependencies(): Record<string, string> {
  return {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    'react-router-dom': '^6.22.0',
    '@tanstack/react-query': '^5.0.0',
    'react-hook-form': '^7.54.0',
    zod: '^3.22.0',
    'lucide-react': '^0.469.0',
    clsx: '^2.1.1',
    'tailwind-merge': '^2.6.0',
    'class-variance-authority': '^0.7.1',
    '@radix-ui/react-slot': '^1.0.2',
    '@radix-ui/react-dialog': '^1.0.5',
    '@radix-ui/react-dropdown-menu': '^2.0.6',
    '@radix-ui/react-select': '^2.0.0',
    '@radix-ui/react-tabs': '^1.0.4',
    '@radix-ui/react-tooltip': '^1.0.7',
    '@radix-ui/react-avatar': '^1.0.4',
    '@radix-ui/react-separator': '^1.0.3',
    '@radix-ui/react-label': '^2.0.2',
    'date-fns': '^3.0.0',
  }
}

// ============================================================================
// Component Props
// ============================================================================

export interface SandpackPreviewProps {
  artifacts: Artifact[]
  deviceSize?: DeviceSize
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function SandpackPreview({ artifacts, deviceSize = 'desktop', className }: SandpackPreviewProps) {
  // ---- Feature detection ------------------------------------------------

  const [supported, setSupported] = useState<boolean | null>(null)
  const [sandpackLoaded, setSandpackLoaded] = useState(false)
  const [sandpackKey, setSandpackKey] = useState(0)

  useEffect(() => {
    const canRun = canRunSandpack()
    setSupported(canRun)

    if (canRun) {
      loadSandpack().then(() => setSandpackLoaded(true))
    }
  }, [])

  // ---- Build Sandpack files from artifacts ------------------------------
  // Convert string values to { code } objects so Sandpack treats them as
  // explicit overrides that take priority over the template defaults.

  const files = useMemo(() => {
    if (artifacts.length === 0) return {}
    const rawFiles = artifactsToSandpackFiles(artifacts)
    const sandpackFiles: Record<string, { code: string; hidden?: boolean }> = {}
    for (const [path, code] of Object.entries(rawFiles)) {
      // Hide UI component internals and boilerplate from the editor
      const isUiComponent = path.startsWith('/components/ui/') || path === '/lib/utils.ts'
      sandpackFiles[path] = { code, hidden: isUiComponent }
    }
    return sandpackFiles
  }, [artifacts])

  // ---- Refresh handler --------------------------------------------------

  const handleRefresh = useCallback(() => {
    setSandpackKey((k) => k + 1)
  }, [])

  // ---- Dependencies (stable reference) ----------------------------------

  const dependencies = useMemo(() => getSandpackDependencies(), [])

  // ============================================================================
  // Render
  // ============================================================================

  // SSR / pre-hydration
  if (supported === null) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-muted/30', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Инициализация...</span>
        </div>
      </div>
    )
  }

  // Browser doesn't support Sandpack → fall back to BabelPreview
  if (!supported) {
    return <BabelPreview artifacts={artifacts} deviceSize={deviceSize} className={className} />
  }

  // Sandpack module still loading
  if (!sandpackLoaded || !SandpackProvider || !SandpackPreviewFrame) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-muted/30', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Загрузка Sandpack...</span>
        </div>
      </div>
    )
  }

  // No artifacts yet
  if (artifacts.length === 0 || Object.keys(files).length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-muted/30', className)}>
        <span className="text-sm text-muted-foreground">Ожидание кода...</span>
      </div>
    )
  }

  // ---- Ready: render Sandpack -------------------------------------------

  const Provider = SandpackProvider
  const Preview = SandpackPreviewFrame

  return (
    <div className={cn('flex flex-col h-full bg-muted/30', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Sandpack</span>
        </div>
        <button
          onClick={handleRefresh}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          type="button"
          aria-label="Обновить превью"
        >
          <RefreshCw className="w-3 h-3" />
          Обновить
        </button>
      </div>

      {/* Preview area — full height, no console */}
      {/* eslint-disable-next-line react/no-unknown-property -- Sandpack internal class overrides */}
      <style>{`
        .sp-wrapper, .sp-layout, .sp-stack, .sp-preview-container, .sp-preview-iframe {
          height: 100% !important;
        }
        .sp-wrapper { display: flex !important; flex-direction: column !important; }
        .sp-preview { flex: 1 !important; }
      `}</style>
      <div className="flex-1 overflow-auto flex justify-center bg-muted/20">
        <div
          style={{ width: DEVICE_WIDTHS[deviceSize], height: '100%', minHeight: '100%' }}
          className="relative bg-white"
        >
          <Provider
            key={sandpackKey}
            template="react-ts"
            files={files}
            customSetup={{
              dependencies,
            }}
            options={{
              externalResources: ['https://cdn.tailwindcss.com'],
              activeFile: '/App.tsx',
              autorun: true,
              initMode: 'immediate',
            }}
          >
            <Preview
              style={{ width: '100%', height: '100%' }}
              showNavigator={false}
              showRefreshButton={false}
              showOpenInCodeSandbox={false}
            />
          </Provider>
        </div>
      </div>
    </div>
  )
}
