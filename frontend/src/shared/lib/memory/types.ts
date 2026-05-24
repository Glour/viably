/**
 * Memory Monitoring Types
 *
 * TypeScript interfaces for memory monitoring functionality.
 * These types are used for development-time memory tracking and performance optimization.
 */

// ============================================================================
// Core Memory Monitoring
// ============================================================================

export interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  usedJSHeapSize?: number
  totalJSHeapSize?: number
  componentCount?: number
  eventListenerCount?: number
}

export interface MemoryMonitorOptions {
  enabled?: boolean
  snapshotInterval?: number
  maxSnapshots?: number
  trackComponents?: boolean
  trackEventListeners?: boolean
}

export interface MemoryStats {
  current: number
  peak: number
  average: number
  growthRate: number
  potentialLeak: boolean
  leakDetected: boolean
}

// ============================================================================
// Component Lifecycle Tracking
// ============================================================================

export type SubscriptionType = 'event' | 'timer' | 'interval' | 'websocket' | 'query' | 'custom'

export interface Subscription {
  id: string
  type: SubscriptionType
  createdAt: number
  cleanedUp: boolean
  cleanupFn: () => void
  metadata?: Record<string, unknown>
}

export interface ExternalResource {
  id: string
  type: string
  createdAt: number
  disposed: boolean
  disposeFn: () => void
  metadata?: Record<string, unknown>
}

export interface ComponentLifecycleTracker {
  componentName: string
  mountedAt: number
  unmountedAt?: number
  subscriptions: Subscription[]
  externalResources: ExternalResource[]
}

export interface ComponentCleanupWarning {
  componentName: string
  uncleanedSubscriptions: Array<{ id: string; type: string; metadata?: Record<string, unknown> }>
  undisposedResources: Array<{ id: string; type: string; metadata?: Record<string, unknown> }>
}

// ============================================================================
// Cache Policy & Stats
// ============================================================================

export interface CachePolicy {
  staleTime?: number
  cacheTime?: number
  maxSize?: number
  persistKey?: string
}

export interface CacheStats {
  queryCount: number
  totalSize: number
  gcEligible: number
  hitRate: number
}

// ============================================================================
// Lazy Module Loading
// ============================================================================

export type ModulePriority = 'high' | 'medium' | 'low'

export interface LazyLoadedModule {
  name: string
  loadTime: number
  size: number
  priority: ModulePriority
  usageCount: number
  firstLoadedAt: number
  lastUsedAt: number
}

export interface ModuleLoadingStats {
  totalModules: number
  totalSize: number
  averageLoadTime: number
  slowestModule?: string
  largestModule?: string
}

// ============================================================================
// Hook Interfaces
// ============================================================================

export interface UseMemoryMonitorResult {
  snapshots: MemorySnapshot[]
  stats: MemoryStats | null
  isMonitoring: boolean
  currentSnapshot: MemorySnapshot | null
  start: () => void
  stop: () => void
  clear: () => void
  startMonitoring: () => void
  stopMonitoring: () => void
  clearSnapshots: () => void
}

export interface UseComponentCleanupResult {
  registerSubscription: (subscription: Omit<Subscription, 'id' | 'cleanedUp'>) => string
  registerResource: (resource: Omit<ExternalResource, 'id' | 'disposed'>) => string
  cleanupSubscription: (id: string) => void
  disposeResource: (id: string) => void
  getActiveSubscriptions: () => Subscription[]
  getUndisposedResources: () => ExternalResource[]
}

export interface UseMonacoEditorOptions {
  language: string
  value?: string
  theme?: string
  readOnly?: boolean
  options?: Record<string, unknown>
  onMount?: (editor: unknown, monaco: unknown) => void
}

export interface UseMonacoEditorResult {
  editor: unknown
  model: unknown
  isReady: boolean
  editorRef: React.RefObject<unknown>
  modelRef: React.RefObject<unknown>
  containerRef: React.RefObject<HTMLDivElement>
  getValue: () => string
  setValue: (value: string) => void
}
