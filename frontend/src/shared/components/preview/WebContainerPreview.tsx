"use client"

/**
 * WebContainerPreview — production preview component.
 * Feature: 002-production-preview
 *
 * Replaces the legacy Babel + stubs iframe approach with a full
 * WebContainer-backed Vite dev server running inside the browser.
 *
 * Responsibilities:
 *   - Gate rendering behind a runtime browser capability check
 *   - Drive the useWebContainer lifecycle (boot → install → ready)
 *   - Diff-update files in the running container when artifacts change
 *   - Show granular loading / error states via PreviewLoader / PreviewError
 *   - Render the Vite dev-server URL in a sandboxed iframe once ready
 */

import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { ProductionPreviewProps, DeviceSize, PreviewStatus } from './types'
import { canRunWebContainers } from './browser-capabilities'
import { useWebContainer } from './use-webcontainer'
import { PreviewLoader } from './PreviewLoader'
import { PreviewError } from './PreviewError'
import { SandpackPreview } from './SandpackPreview'

// ============================================================================
// Constants
// ============================================================================

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

/**
 * Statuses that map to the "loading" visual — any state between idle and ready
 * (excluding error and unsupported) should show the loader.
 */
const LOADING_STATUSES = new Set<PreviewStatus>(['idle', 'booting', 'installing', 'starting', 'updating'])

// ============================================================================
// Component
// ============================================================================

export function WebContainerPreview({
  artifacts,
  deviceSize = 'desktop',
  className,
  onReady,
}: ProductionPreviewProps) {
  // ---- Browser capability gate -----------------------------------------------

  /**
   * `null` = SSR / pre-hydration (we don't know yet).
   * `true` / `false` = determined on the client after first render.
   */
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setSupported(canRunWebContainers())
  }, [])

  // ---- WebContainer hook -----------------------------------------------------

  const { state, start, updateFiles, iframeKey } = useWebContainer({ artifacts, autoStart: false })

  // Auto-notify parent when preview becomes ready for the first time
  const prevStatusRef = useRef<string>('')
  useEffect(() => {
    if (state.status === 'ready' && prevStatusRef.current !== 'ready' && onReady) {
      onReady()
    }
    prevStatusRef.current = state.status
  }, [state.status, onReady])

  // ---- Auto-start once support is confirmed ----------------------------------

  useEffect(() => {
    if (supported === true && state.status === 'idle' && artifacts.length > 0) {
      void start()
    }
    // We intentionally run this only when `supported` resolves — `start` is a
    // stable callback reference from useCallback so it is safe to omit here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported])

  // ---- Diff-update files when artifacts change (only while running) ----------

  const prevArtifactsRef = useRef(artifacts)

  useEffect(() => {
    if (
      (state.status === 'ready' || state.status === 'updating') &&
      artifacts !== prevArtifactsRef.current
    ) {
      prevArtifactsRef.current = artifacts
      void updateFiles(artifacts)
    }
  }, [artifacts, state.status, updateFiles])

  // ============================================================================
  // Render
  // ============================================================================

  // 5. SSR / pre-hydration: we don't know support status yet — show loader
  if (supported === null) {
    return (
      <PreviewLoader
        status="booting"
        progress={5}
        progressLabel="Инициализация..."
      />
    )
  }

  // 6. Unsupported browser: Babel-based fallback (works in Safari and all browsers)
  if (!supported) {
    return <SandpackPreview artifacts={artifacts} deviceSize={deviceSize} className={className} />
  }

  // 7. Error state — fall back to Sandpack instead of showing an error
  if (state.status === 'error' && state.error !== null) {
    return <SandpackPreview artifacts={artifacts} deviceSize={deviceSize} className={className} />
  }

  // 8. Any intermediate loading state
  if (LOADING_STATUSES.has(state.status)) {
    return (
      <PreviewLoader
        status={state.status}
        progress={state.progress}
        progressLabel={state.progressLabel}
      />
    )
  }

  // 9. Ready — render the live Vite dev-server URL inside a sandboxed iframe
  return (
    <div className={cn('flex flex-col h-full bg-muted/30', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Превью</span>
        </div>
        <button
          onClick={() => void start()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          type="button"
          aria-label="Обновить превью"
        >
          <RefreshCw className="w-3 h-3" />
          Обновить
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex justify-center bg-muted/20">
        <div
          style={{ width: DEVICE_WIDTHS[deviceSize], height: '100%', minHeight: '100%' }}
          className="relative bg-white"
        >
          <iframe
            key={iframeKey}
            src={state.url ?? undefined}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  )
}
