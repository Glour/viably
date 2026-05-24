/**
 * TypeScript interfaces для Production Preview System
 * Feature: 002-production-preview
 */

import type { Artifact } from '@/features/generation/types/conversation'

// ============================================================================
// Preview Status & State
// ============================================================================

export type PreviewStatus =
  | 'idle'
  | 'booting'
  | 'installing'
  | 'starting'
  | 'ready'
  | 'updating'
  | 'error'
  | 'unsupported'

export interface PreviewState {
  status: PreviewStatus
  url: string | null
  progress: number
  progressLabel: string
  error: string | null
  isFallback: boolean
}

// ============================================================================
// File System
// ============================================================================

export type WebContainerFiles = Record<string, string>

export type WCFileNode = {
  file: { contents: string }
}

export type WCDirectoryNode = {
  directory: WCFileSystemTree
}

export type WCFileSystemTree = {
  [name: string]: WCFileNode | WCDirectoryNode
}

// ============================================================================
// Template Configuration
// ============================================================================

export interface PreviewTemplateConfig {
  packageJson: string
  viteConfig: string
  indexHtml: string
  tsconfigJson: string
  mainTsx: string
  indexCss: string
  postcssConfig: string
  tailwindConfig: string
  uiComponents: Record<string, string>
}

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseWebContainerOptions {
  artifacts: Artifact[]
  autoStart?: boolean
}

export interface UseWebContainerReturn {
  state: PreviewState
  start: () => Promise<void>
  updateFiles: (artifacts: Artifact[]) => Promise<void>
  dispose: () => void
  /** Increment to force iframe remount (hard reload without changing URL) */
  iframeKey: number
}

// ============================================================================
// Component Props
// ============================================================================

export type DeviceSize = 'desktop' | 'tablet' | 'mobile'

export interface ProductionPreviewProps {
  onReady?: () => void
  artifacts: Artifact[]
  deviceSize?: DeviceSize
  className?: string
}

export interface PreviewLoaderProps {
  status: PreviewStatus
  progress: number
  progressLabel: string
}

export interface PreviewErrorProps {
  error: string
  onRetry: () => void
}

// ============================================================================
// Artifacts → FileSystem Conversion
// ============================================================================

export interface ArtifactsToFsOptions {
  mergeUserCss?: boolean
}

// ============================================================================
// Feature Detection
// ============================================================================

export interface BrowserCapabilities {
  supportsWebContainers: boolean
  supportsSharedArrayBuffer: boolean
  supportsCrossOriginIsolation: boolean
  supportsAtomicsWaitAsync: boolean
  supportsSandpack: boolean
}
