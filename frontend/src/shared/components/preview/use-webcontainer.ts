"use client"

/**
 * useWebContainer — core React hook for WebContainer lifecycle management.
 * Feature: 002-production-preview
 *
 * Responsibilities:
 *   - Boot the WebContainer singleton (once per page session)
 *   - Mount the full Vite + React template file tree merged with user artifacts
 *   - Run `npm install` and `npm run dev` inside the container
 *   - Expose `updateFiles` for HMR-based hot updates via wc.fs.writeFile
 *   - Provide granular progress / status state to the UI
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { WebContainer } from '@webcontainer/api'
import type { Artifact } from '@/features/generation/types/conversation'
import { artifactsToFileSystem } from './artifacts-to-fs'
import { buildPreviewTemplate, buildTemplateFileTree } from './preview-template'
import type {
  PreviewState,
  UseWebContainerOptions,
  UseWebContainerReturn,
  WCFileNode,
  WCDirectoryNode,
  WCFileSystemTree,
} from './types'
import { canRunWebContainers } from './browser-capabilities'

// ============================================================================
// Constants
// ============================================================================

const NPM_INSTALL_TIMEOUT_MS = 180_000

const INITIAL_STATE: PreviewState = {
  status: 'idle',
  url: null,
  progress: 0,
  progressLabel: '',
  error: null,
  isFallback: false,
}

// ============================================================================
// Module-level singleton — survives component re-mounts
// ============================================================================

/**
 * WebContainer.boot() must be called at most once per page session.
 * We keep the instance (and its boot promise) at module scope so that
 * component unmount/remount cycles never trigger a second boot.
 */
let _wcInstance: WebContainer | null = null
let _bootPromise: Promise<WebContainer> | null = null

/**
 * Cache the running dev server URL so subsequent project loads can skip
 * the boot → install → dev cycle and just re-mount new files.
 */
let _serverUrl: string | null = null

async function getOrBootWebContainer(): Promise<WebContainer> {
  if (_wcInstance) return _wcInstance
  if (_bootPromise) return _bootPromise

  // coep: 'credentialless' must match the COEP HTTP header sent by Next.js.
  // This allows SharedArrayBuffer (needed by WebContainers) while still
  // permitting cross-origin iframes that have CORS headers (e.g. Sandpack).
  _bootPromise = WebContainer.boot({ coep: 'credentialless' }).then((wc) => {
    _wcInstance = wc
    return wc
  })

  return _bootPromise
}

// ============================================================================
// File tree helpers
// ============================================================================

/**
 * Type-guard: returns true when a tree node is a directory node.
 */
function isDirectoryNode(node: WCFileNode | WCDirectoryNode): node is WCDirectoryNode {
  return 'directory' in node
}

/**
 * Walk a WCFileSystemTree and collect all leaf file paths + contents as a flat
 * map keyed by their absolute path (e.g. "src/App.tsx").
 */
function flattenTree(
  tree: WCFileSystemTree,
  prefix = '',
  result: Map<string, string> = new Map(),
): Map<string, string> {
  for (const [name, node] of Object.entries(tree)) {
    const fullPath = prefix ? `${prefix}/${name}` : name
    if (isDirectoryNode(node)) {
      flattenTree(node.directory, fullPath, result)
    } else {
      result.set(fullPath, node.file.contents)
    }
  }
  return result
}

// ============================================================================
// Visibility-aware timeout
// ============================================================================

/**
 * Returns a promise that rejects after `maxMs` of *visible* time.
 * When the page is hidden (phone locked, tab backgrounded), the countdown
 * pauses so WebContainer processes are not incorrectly timed out.
 */
function visibilityAwareTimeout(maxMs: number, message: string): Promise<never> {
  return new Promise<never>((_, reject) => {
    let elapsed = 0
    let lastTick = Date.now()

    const tick = setInterval(() => {
      const now = Date.now()
      if (!document.hidden) {
        elapsed += now - lastTick
        if (elapsed >= maxMs) {
          cleanup()
          reject(new Error(message))
        }
      }
      lastTick = now
    }, 500)

    const handleVisibility = () => {
      // Reset lastTick on becoming visible so we don't count hidden time
      if (!document.hidden) {
        lastTick = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    function cleanup() {
      clearInterval(tick)
      document.removeEventListener('visibilitychange', handleVisibility)
    }

    // Attach cleanup to the promise so callers can cancel it (best-effort)
    ;(reject as any)._cleanup = cleanup
  })
}

// ============================================================================
// Hook
// ============================================================================

export function useWebContainer(options: UseWebContainerOptions): UseWebContainerReturn {
  const { artifacts, autoStart = false } = options

  const [state, setState] = useState<PreviewState>(INITIAL_STATE)

  /**
   * Track whether this hook instance is still mounted.
   * Prevents state updates after unmount.
   */
  const isMountedRef = useRef(true)

  /**
   * Reference to the active WebContainer instance for this hook session.
   * We keep a ref to avoid stale-closure issues inside callbacks.
   */
  const wcRef = useRef<WebContainer | null>(null)

  /**
   * Cache of the last mounted file tree — used by updateFiles to diff
   * against new artifacts and write only changed files.
   */
  const mountedFilesRef = useRef<Map<string, string>>(new Map())

  /**
   * Guards against concurrent `start()` calls.
   */
  const isStartingRef = useRef(false)

  /**
   * Key used to force iframe remount when we need a hard reload.
   * Incrementing this value causes React to destroy and recreate the iframe,
   * which is the only reliable way to reload the same URL in an iframe.
   */
  const [iframeKey, setIframeKey] = useState(0)

  // ---- helpers ---------------------------------------------------------------

  const safeSetState = useCallback((patch: Partial<PreviewState>) => {
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, ...patch }))
    }
  }, [])

  const setError = useCallback(
    (message: string) => {
      safeSetState({ status: 'error', error: message, progress: 0 })
    },
    [safeSetState],
  )

  // ---- force iframe reload ---------------------------------------------------

  const forceIframeReload = useCallback(() => {
    if (isMountedRef.current) {
      setIframeKey((k) => k + 1)
    }
  }, [])

  // ---- start -----------------------------------------------------------------

  const start = useCallback(async () => {
    if (isStartingRef.current) return
    isStartingRef.current = true

    // --- Browser capability check -------------------------------------------
    if (!canRunWebContainers()) {
      safeSetState({ status: 'unsupported', isFallback: true })
      isStartingRef.current = false
      return
    }

    try {
      // ---- Build merged file system tree (needed for both fast and full path) --
      const template = buildPreviewTemplate()
      const baseTree = buildTemplateFileTree(template)
      const mergedTree = artifactsToFileSystem(artifacts, baseTree)
      const flatFiles = flattenTree(mergedTree)

      // ---- Fast path: container already running, just re-mount files ---------
      // This handles SPA navigation between projects: instead of booting a new
      // container (and attempting a second `npm run dev` on a busy port), we
      // simply mount the new project files and reuse the running Vite server.
      if (_wcInstance && _serverUrl) {
        safeSetState({
          status: 'updating',
          progress: 80,
          progressLabel: 'Загрузка проекта...',
          error: null,
          // Keep url alive during update so iframe doesn't go blank
          url: _serverUrl,
        })

        wcRef.current = _wcInstance

        // Mount the full merged tree — Vite HMR will pick up changed files
        await _wcInstance.mount(mergedTree)
        mountedFilesRef.current = flatFiles

        safeSetState({
          status: 'ready',
          progress: 100,
          progressLabel: 'Готово',
          url: _serverUrl,
        })

        // Force iframe to reload so the new project is visible
        forceIframeReload()

        isStartingRef.current = false
        return
      }

      // ---- Full boot path ----------------------------------------------------
      safeSetState({
        status: 'booting',
        progress: 10,
        progressLabel: 'Загрузка окружения...',
        error: null,
        url: null,
      })

      const wc = await getOrBootWebContainer()
      wcRef.current = wc

      mountedFilesRef.current = flatFiles
      await wc.mount(mergedTree)

      // ---- Phase 2: npm install ----------------------------------------------
      safeSetState({
        status: 'installing',
        progress: 30,
        progressLabel: 'Установка зависимостей...',
      })

      const installProcess = await wc.spawn('npm', ['install'])

      // Track install progress via output parsing
      let installProgress = 30
      const progressCap = 65

      const outputReader = installProcess.output.pipeTo(
        new WritableStream({
          write(chunk: string) {
            if (!isMountedRef.current) return
            // Jump to cap when npm confirms success: "added N packages in Xs"
            if (chunk.includes('added') && chunk.includes('packages')) {
              installProgress = progressCap
            } else {
              // Creep forward one point per chunk, stopping just below the cap
              installProgress = Math.min(installProgress + 1, progressCap - 1)
            }
            safeSetState({ progress: installProgress })
          },
        }),
      )

      // Race the install exit against a visibility-aware timeout
      // (pauses countdown when page is hidden — prevents false failures on phone lock)
      const timeoutPromise = visibilityAwareTimeout(
        NPM_INSTALL_TIMEOUT_MS,
        'Превышено время ожидания установки',
      )

      const exitCode = await Promise.race([installProcess.exit, timeoutPromise])

      // Let the stream finish draining (non-fatal if it errors)
      outputReader.catch(() => undefined)

      if (exitCode !== 0) {
        throw new Error('Ошибка установки зависимостей')
      }

      // ---- Phase 3: npm run dev ----------------------------------------------
      safeSetState({
        status: 'starting',
        progress: 70,
        progressLabel: 'Запуск сервера...',
      })

      const devProcess = await wc.spawn('npm', ['run', 'dev'])

      // Capture dev server stderr/stdout for error detection
      const devErrors: string[] = []
      devProcess.output.pipeTo(
        new WritableStream({
          write(chunk: string) {
            // Collect potential error lines (Vite/PostCSS/TS errors)
            if (
              chunk.includes('ERROR') ||
              chunk.includes('error') ||
              chunk.includes('failed')
            ) {
              devErrors.push(chunk.trim())
            }
          },
        }),
      )

      // Wait for Vite to announce it is ready on a port
      await new Promise<void>((resolve) => {
        const unsubscribe = wc.on('server-ready', (_port: number, url: string) => {
          unsubscribe()
          // Cache URL at module level so fast-path works on next start()
          _serverUrl = url
          safeSetState({
            status: 'ready',
            progress: 100,
            progressLabel: 'Готово',
            url,
          })
          resolve()
        })
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Произошла непредвиденная ошибка'
      setError(message)
    } finally {
      isStartingRef.current = false
    }
  }, [artifacts, safeSetState, setError, forceIframeReload])

  // ---- updateFiles -----------------------------------------------------------

  const updateFiles = useCallback(
    async (nextArtifacts: Artifact[]) => {
      const wc = wcRef.current

      // If not ready, do a full (re-)start which mounts everything from scratch
      if (!wc || state.status !== 'ready') {
        await start()
        return
      }

      safeSetState({ status: 'updating' })

      try {
        // Build the merged tree for the new set of artifacts
        const template = buildPreviewTemplate()
        const baseTree = buildTemplateFileTree(template)
        const nextTree = artifactsToFileSystem(nextArtifacts, baseTree)
        const nextFiles = flattenTree(nextTree)

        // Write only files that have changed or been added
        const writes: Promise<void>[] = []
        for (const [filePath, content] of nextFiles) {
          if (mountedFilesRef.current.get(filePath) !== content) {
            // WebContainer paths are absolute from the workdir root
            writes.push(wc.fs.writeFile(filePath, content))
          }
        }

        await Promise.all(writes)

        // Update cache to reflect the new state
        mountedFilesRef.current = nextFiles
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Ошибка обновления файлов'
        setError(message)
        return
      }

      // Vite HMR should pick up written files automatically.
      // Give it a short window (800ms), then force iframe reload as fallback
      // to handle cases where HMR doesn't trigger (e.g. new component added).
      safeSetState({ status: 'ready' })
      setTimeout(() => {
        forceIframeReload()
      }, 800)
    },
    [state.status, start, safeSetState, setError, forceIframeReload],
  )

  // ---- dispose ---------------------------------------------------------------

  const dispose = useCallback(() => {
    if (wcRef.current) {
      wcRef.current.teardown()
      wcRef.current = null
      // Reset module-level singleton so boot() can be called again if needed
      _wcInstance = null
      _bootPromise = null
      _serverUrl = null
    }
    mountedFilesRef.current = new Map()
    if (isMountedRef.current) {
      setState(INITIAL_STATE)
    }
  }, [])

  // ---- Lifecycle -------------------------------------------------------------

  useEffect(() => {
    isMountedRef.current = true

    if (autoStart) {
      start()
    }

    return () => {
      isMountedRef.current = false
      // Do NOT teardown on unmount — the singleton must survive re-mounts.
      // Only an explicit dispose() call triggers a full teardown.
    }
    // `start` is intentionally omitted from deps — this effect runs once on
    // mount (and when autoStart changes), not on every artifact update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  return { state, start, updateFiles, dispose, iframeKey }
}
