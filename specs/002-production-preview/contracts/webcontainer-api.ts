/**
 * TypeScript interfaces для Production Preview System
 * Feature: 002-production-preview
 *
 * Эти типы описывают контракты между компонентами preview-подсистемы.
 * Используются в: WebContainerPreview, SandpackPreview, use-webcontainer, artifacts-to-fs
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

/** Плоский маппинг путь → содержимое, как входной формат */
export type WebContainerFiles = Record<string, string>

/** Узел файловой системы WebContainer */
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
  /** JSON строка для package.json (с зависимостями) */
  packageJson: string
  /** Содержимое vite.config.ts */
  viteConfig: string
  /** Содержимое index.html */
  indexHtml: string
  /** Содержимое tsconfig.json */
  tsconfigJson: string
  /** Содержимое src/main.tsx */
  mainTsx: string
  /** Содержимое src/index.css */
  indexCss: string
  /** Pre-generated shadcn/ui компоненты: путь → содержимое */
  uiComponents: Record<string, string>
}

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseWebContainerOptions {
  /** Артефакты из AI для отображения */
  artifacts: Artifact[]
  /** Автоматически запустить превью при монтировании компонента */
  autoStart?: boolean
}

export interface UseWebContainerReturn {
  /** Текущее состояние превью */
  state: PreviewState
  /** Запустить/перезапустить превью */
  start: () => Promise<void>
  /** Обновить файлы в существующем WebContainer (HMR) */
  updateFiles: (artifacts: Artifact[]) => Promise<void>
  /** Остановить WebContainer и освободить ресурсы */
  dispose: () => void
}

// ============================================================================
// Component Props
// ============================================================================

export type DeviceSize = 'desktop' | 'tablet' | 'mobile'

export interface ProductionPreviewProps {
  /** Артефакты из AI для отображения в превью */
  artifacts: Artifact[]
  /** Режим устройства для имитации ширины экрана */
  deviceSize?: DeviceSize
  /** CSS класс для контейнера */
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
  /** Если true — перезаписывает src/index.css пользовательским CSS из артефактов */
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
}
