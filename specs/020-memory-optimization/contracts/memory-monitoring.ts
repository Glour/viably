/**
 * Memory Monitoring API Contracts
 *
 * This file defines TypeScript interfaces for memory monitoring functionality.
 * These contracts are used for development-time memory tracking and do not
 * represent REST API endpoints.
 */

// ============================================================================
// Memory Snapshot
// ============================================================================

export interface MemorySnapshot {
  /** Unix timestamp when snapshot was captured */
  timestamp: number;

  /** Heap size currently used (bytes) */
  heapSizeUsed: number;

  /** Maximum heap size limit (bytes) */
  heapSizeLimit: number;

  /** Total JS heap size (bytes) */
  totalJSHeapSize: number;

  /** Used JS heap size (bytes) */
  usedJSHeapSize: number;

  /** JS heap size limit (bytes) */
  jsHeapSizeLimit: number;

  /** Optional: Number of active React components */
  componentCount?: number;

  /** Optional: Number of active event listeners */
  eventListenerCount?: number;
}

export interface MemoryMonitorOptions {
  /** Interval between snapshots in milliseconds */
  interval: number;

  /** Maximum number of snapshots to keep in memory */
  maxSnapshots: number;

  /** Enable component tracking (dev only) */
  trackComponents: boolean;

  /** Enable event listener tracking (dev only) */
  trackEventListeners: boolean;
}

export interface MemoryStats {
  /** Current memory usage in MB */
  current: number;

  /** Peak memory usage in MB */
  peak: number;

  /** Average memory usage in MB */
  average: number;

  /** Memory growth rate in MB/minute */
  growthRate: number;

  /** Is memory leak detected (consistent growth) */
  leakDetected: boolean;
}

// ============================================================================
// Component Lifecycle Tracking
// ============================================================================

export type SubscriptionType =
  | 'event'
  | 'timer'
  | 'interval'
  | 'websocket'
  | 'query'
  | 'custom';

export interface Subscription {
  /** Unique subscription ID */
  id: string;

  /** Type of subscription */
  type: SubscriptionType;

  /** Timestamp when subscription was created */
  createdAt: number;

  /** Whether cleanup has been executed */
  cleaned: boolean;

  /** Function to cleanup this subscription */
  cleanupFn: () => void;

  /** Optional metadata for debugging */
  metadata?: Record<string, unknown>;
}

export interface ComponentLifecycleTracker {
  /** Component unique identifier */
  componentId: string;

  /** Timestamp when component was mounted */
  mountedAt: number;

  /** Timestamp when component was unmounted (null if active) */
  unmountedAt: number | null;

  /** Active subscriptions requiring cleanup */
  subscriptions: Subscription[];

  /** External resources (WebSocket, Monaco models, etc.) */
  externalResources: ExternalResource[];
}

export interface ExternalResource {
  /** Resource unique identifier */
  id: string;

  /** Resource type */
  type: 'websocket' | 'monaco-model' | 'monaco-editor' | 'custom';

  /** Timestamp when resource was created */
  createdAt: number;

  /** Whether resource has been disposed */
  disposed: boolean;

  /** Function to dispose this resource */
  disposeFn: () => void;

  /** Optional metadata for debugging */
  metadata?: Record<string, unknown>;
}

export interface ComponentCleanupWarning {
  /** Component that had cleanup issues */
  componentId: string;

  /** Subscriptions that were not cleaned up */
  uncleanedSubscriptions: Subscription[];

  /** External resources that were not disposed */
  undisposedResources: ExternalResource[];

  /** Timestamp of warning */
  timestamp: number;
}

// ============================================================================
// Cache Policy
// ============================================================================

export interface CachePolicy {
  /** Time in ms before data becomes stale */
  staleTime: number;

  /** Time in ms before unused data is garbage collected */
  gcTime: number;

  /** Maximum number of queries in cache simultaneously */
  maxQueries: number;

  /** Optional: Maximum cache size in bytes */
  maxSize?: number;

  /** Keys that should not be garbage collected */
  persistKeys: string[];
}

export interface CacheStats {
  /** Current number of queries in cache */
  queryCount: number;

  /** Estimated cache size in bytes */
  sizeBytes: number;

  /** Number of queries eligible for GC */
  gcEligibleCount: number;

  /** Cache hit rate (0-1) */
  hitRate: number;
}

// ============================================================================
// Lazy Module Loading
// ============================================================================

export type ModulePriority = 'high' | 'medium' | 'low';

export interface LazyLoadedModule {
  /** Module unique identifier (file path) */
  moduleId: string;

  /** Timestamp when module was loaded (null if not loaded) */
  loadedAt: number | null;

  /** Timestamp when module was unloaded (null if in memory) */
  unloadedAt: number | null;

  /** Module size in bytes */
  size: number;

  /** Time taken to load module (ms) */
  loadTime: number;

  /** Number of active usages of this module */
  usageCount: number;

  /** Loading priority */
  priority: ModulePriority;
}

export interface ModuleLoadingStats {
  /** Total number of loaded modules */
  totalModules: number;

  /** Total size of loaded modules (bytes) */
  totalSize: number;

  /** Average load time (ms) */
  averageLoadTime: number;

  /** Slowest module to load */
  slowestModule: LazyLoadedModule | null;

  /** Largest module by size */
  largestModule: LazyLoadedModule | null;
}

// ============================================================================
// Memory Monitor Hook Interface
// ============================================================================

export interface UseMemoryMonitorResult {
  /** Latest memory snapshot */
  currentSnapshot: MemorySnapshot | null;

  /** Array of historical snapshots */
  snapshots: MemorySnapshot[];

  /** Computed memory statistics */
  stats: MemoryStats;

  /** Whether monitoring is active */
  isMonitoring: boolean;

  /** Start memory monitoring */
  start: () => void;

  /** Stop memory monitoring */
  stop: () => void;

  /** Clear all snapshots */
  clear: () => void;

  /** Manually capture a snapshot */
  captureSnapshot: () => MemorySnapshot;
}

// ============================================================================
// Component Cleanup Hook Interface
// ============================================================================

export interface UseComponentCleanupResult {
  /** Register a subscription that needs cleanup */
  registerSubscription: (subscription: Omit<Subscription, 'id' | 'cleaned'>) => string;

  /** Register an external resource that needs disposal */
  registerResource: (resource: Omit<ExternalResource, 'id' | 'disposed'>) => string;

  /** Manually cleanup a subscription by ID */
  cleanupSubscription: (id: string) => void;

  /** Manually dispose a resource by ID */
  disposeResource: (id: string) => void;

  /** Get list of active subscriptions */
  getActiveSubscriptions: () => Subscription[];

  /** Get list of undisposed resources */
  getUndisposedResources: () => ExternalResource[];
}

// ============================================================================
// Monaco Editor Hook Interface
// ============================================================================

export interface UseMonacoEditorOptions {
  /** Initial code content */
  value: string;

  /** Programming language */
  language: string;

  /** Editor theme */
  theme?: string;

  /** Editor options */
  options?: Record<string, unknown>;
}

export interface UseMonacoEditorResult {
  /** Editor instance (null if not mounted) */
  editor: unknown | null; // monaco.editor.IStandaloneCodeEditor

  /** Model instance (null if not mounted) */
  model: unknown | null; // monaco.editor.ITextModel

  /** Reference to attach editor container */
  containerRef: React.RefObject<HTMLDivElement>;

  /** Whether editor is ready */
  isReady: boolean;

  /** Get current editor value */
  getValue: () => string;

  /** Set editor value */
  setValue: (value: string) => void;
}
