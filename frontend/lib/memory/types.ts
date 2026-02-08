/**
 * Memory Monitoring Types
 *
 * Re-exports TypeScript interfaces for memory monitoring functionality.
 * These types are used for development-time memory tracking and performance optimization.
 *
 * @see specs/020-memory-optimization/contracts/memory-monitoring.ts - Source contracts
 */

// ============================================================================
// Core Memory Monitoring
// ============================================================================

export type {
  /**
   * Snapshot of memory state at a specific point in time.
   * Captures heap usage, component count, and event listener count.
   */
  MemorySnapshot,

  /**
   * Configuration options for memory monitoring.
   * Controls snapshot frequency, retention, and tracking features.
   */
  MemoryMonitorOptions,

  /**
   * Computed statistics from memory snapshots.
   * Includes current/peak/average usage, growth rate, and leak detection.
   */
  MemoryStats,
} from '../../../specs/020-memory-optimization/contracts/memory-monitoring';

// ============================================================================
// Component Lifecycle Tracking
// ============================================================================

export type {
  /**
   * Type of subscription requiring cleanup on unmount.
   * Examples: 'event', 'timer', 'interval', 'websocket', 'query', 'custom'
   */
  SubscriptionType,

  /**
   * Represents a subscription with its cleanup function.
   * Tracks creation time, cleanup status, and provides disposal method.
   */
  Subscription,

  /**
   * Tracks component lifecycle and associated resources.
   * Monitors mount/unmount times, active subscriptions, and external resources.
   */
  ComponentLifecycleTracker,

  /**
   * Represents an external resource requiring explicit disposal.
   * Examples: WebSocket connections, Monaco editor instances/models.
   */
  ExternalResource,

  /**
   * Warning emitted when component cleanup is incomplete.
   * Lists uncleaned subscriptions and undisposed resources.
   */
  ComponentCleanupWarning,
} from '../../../specs/020-memory-optimization/contracts/memory-monitoring';

// ============================================================================
// Cache Policy & Stats
// ============================================================================

export type {
  /**
   * Cache configuration for React Query or similar libraries.
   * Defines stale times, GC times, size limits, and persist keys.
   */
  CachePolicy,

  /**
   * Statistics about current cache state.
   * Tracks query count, size, GC-eligible items, and hit rate.
   */
  CacheStats,
} from '../../../specs/020-memory-optimization/contracts/memory-monitoring';

// ============================================================================
// Lazy Module Loading
// ============================================================================

export type {
  /**
   * Priority level for module loading.
   * Options: 'high', 'medium', 'low'
   */
  ModulePriority,

  /**
   * Represents a lazily-loaded module with its metrics.
   * Tracks load time, size, usage count, and lifecycle timestamps.
   */
  LazyLoadedModule,

  /**
   * Aggregated statistics about module loading.
   * Includes totals, averages, and identifies slowest/largest modules.
   */
  ModuleLoadingStats,
} from '../../../specs/020-memory-optimization/contracts/memory-monitoring';

// ============================================================================
// Hook Interfaces
// ============================================================================

export type {
  /**
   * Return type for useMemoryMonitor hook.
   * Provides snapshots, stats, and control methods (start/stop/clear).
   */
  UseMemoryMonitorResult,

  /**
   * Return type for useComponentCleanup hook.
   * Registers subscriptions/resources and provides manual cleanup methods.
   */
  UseComponentCleanupResult,

  /**
   * Options for useMonacoEditor hook.
   * Configuration for Monaco editor instances with proper cleanup.
   */
  UseMonacoEditorOptions,

  /**
   * Return type for useMonacoEditor hook.
   * Provides editor/model instances, container ref, and value methods.
   */
  UseMonacoEditorResult,
} from '../../../specs/020-memory-optimization/contracts/memory-monitoring';
