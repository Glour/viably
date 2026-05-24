/**
 * Production Preview System — barrel export
 * Feature: 002-production-preview
 */

// Types
export type {
  PreviewStatus,
  PreviewState,
  WCFileSystemTree,
  WCFileNode,
  WCDirectoryNode,
  PreviewTemplateConfig,
  UseWebContainerOptions,
  UseWebContainerReturn,
  ProductionPreviewProps,
  DeviceSize,
  PreviewLoaderProps,
  PreviewErrorProps,
  ArtifactsToFsOptions,
  BrowserCapabilities,
} from './types'

// Feature detection
export { canRunWebContainers, canRunSandpack, getBrowserCapabilities } from './browser-capabilities'

// Template
export { buildPreviewTemplate, buildTemplateFileTree } from './preview-template'

// Artifacts → FS conversion
export { artifactsToFileSystem } from './artifacts-to-fs'
export { artifactsToSandpackFiles } from './artifacts-to-sandpack'

// Hook
export { useWebContainer } from './use-webcontainer'

// UI components
export { PreviewLoader } from './PreviewLoader'
export { PreviewError } from './PreviewError'
export { WebContainerPreview } from './WebContainerPreview'
export { SandpackPreview } from './SandpackPreview'
export { BabelPreview } from './BabelPreview'
