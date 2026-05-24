/**
 * Component Lifecycle Tracker
 *
 * Dev-mode only utility for tracking component mount/unmount events and
 * detecting potential memory leaks by monitoring component lifecycle.
 *
 * Features:
 * - Track component mount/unmount with timestamps
 * - Calculate mount duration and memory usage
 * - Warn about long-lived components (>1 hour)
 * - Provide statistics for dev tools
 *
 * @example
 * ```typescript
 * // In a React component
 * useEffect(() => {
 *   const id = lifecycleTracker.trackMount('MyComponent');
 *   return () => lifecycleTracker.trackUnmount(id);
 * }, []);
 *
 * // Check stats in dev tools
 * console.table(lifecycleTracker.getStats());
 * ```
 */

import { captureMemorySnapshot, formatBytes } from './snapshot';
import type { MemorySnapshot } from './types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Information about a tracked component instance
 */
export interface ComponentInfo {
  /** Unique identifier for this component instance */
  id: string;

  /** Component display name */
  name: string;

  /** Timestamp when component mounted */
  mountedAt: number;

  /** Timestamp when component unmounted (null if still active) */
  unmountedAt: number | null;

  /** Memory snapshot at mount time (null if API unavailable) */
  memoryAtMount: MemorySnapshot | null;

  /** Memory snapshot at unmount time (null if still active or API unavailable) */
  memoryAtUnmount: MemorySnapshot | null;

  /** Duration component was mounted in milliseconds (null if still active) */
  duration: number | null;

  /** Memory growth during component lifetime in bytes (null if unavailable) */
  memoryGrowth: number | null;
}

/**
 * Aggregated statistics about component lifecycles
 */
export interface LifecycleStats {
  /** Total number of components tracked (ever) */
  totalTracked: number;

  /** Number of currently active components */
  activeCount: number;

  /** Number of unmounted components */
  unmountedCount: number;

  /** Average mount duration in milliseconds */
  averageDuration: number;

  /** Total memory growth across all components in bytes */
  totalMemoryGrowth: number;

  /** Average memory growth per component in bytes */
  averageMemoryGrowth: number;

  /** Components mounted for more than 1 hour */
  longLivedComponents: ComponentInfo[];

  /** Components with highest memory growth */
  highMemoryGrowthComponents: ComponentInfo[];
}

// ============================================================================
// Constants
// ============================================================================

/** Warn if component is mounted for more than 1 hour */
const LONG_LIVED_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/** Consider memory growth significant if > 10MB */
const HIGH_MEMORY_GROWTH_THRESHOLD = 10 * 1024 * 1024; // 10MB

/** Maximum number of components to track in memory (prevent memory leak in tracker itself) */
const MAX_TRACKED_COMPONENTS = 1000;

// ============================================================================
// ComponentLifecycleTracker Class
// ============================================================================

/**
 * Singleton class for tracking component lifecycles in development mode.
 *
 * This tracker is automatically disabled in production to avoid performance overhead.
 */
export class ComponentLifecycleTracker {
  /** Map of active component instances */
  private activeComponents: Map<string, ComponentInfo> = new Map();

  /** Map of unmounted component instances (for stats) */
  private unmountedComponents: Map<string, ComponentInfo> = new Map();

  /** Counter for generating unique component IDs */
  private idCounter = 0;

  /** Whether tracker is enabled */
  private enabled: boolean;

  constructor() {
    // Only enable in development mode
    this.enabled = process.env.NODE_ENV === 'development';

    if (this.enabled) {
      // Log warning for long-lived components every 5 minutes
      setInterval(() => this.checkLongLivedComponents(), 5 * 60 * 1000);
    }
  }

  /**
   * Track a component mount event.
   *
   * @param componentName - Display name of the component
   * @returns {string} Unique ID for this component instance (pass to trackUnmount)
   *
   * @example
   * ```typescript
   * const id = tracker.trackMount('UserProfile');
   * // Later, in cleanup:
   * tracker.trackUnmount(id);
   * ```
   */
  trackMount(componentName: string): string {
    if (!this.enabled) {
      return '';
    }

    const id = `${componentName}-${++this.idCounter}`;
    const memoryAtMount = captureMemorySnapshot();

    const info: ComponentInfo = {
      id,
      name: componentName,
      mountedAt: Date.now(),
      unmountedAt: null,
      memoryAtMount,
      memoryAtUnmount: null,
      duration: null,
      memoryGrowth: null,
    };

    this.activeComponents.set(id, info);

    // Prevent memory leak in tracker itself
    if (this.activeComponents.size > MAX_TRACKED_COMPONENTS) {
      console.warn(
        `[LifecycleTracker] More than ${MAX_TRACKED_COMPONENTS} active components tracked. ` +
          'This may indicate a memory leak. Clearing oldest entries.'
      );
      // Remove oldest half
      const entriesToRemove = Array.from(this.activeComponents.entries())
        .sort((a, b) => a[1].mountedAt - b[1].mountedAt)
        .slice(0, Math.floor(MAX_TRACKED_COMPONENTS / 2));

      for (const [key] of entriesToRemove) {
        this.activeComponents.delete(key);
      }
    }

    return id;
  }

  /**
   * Track a component unmount event.
   *
   * @param id - The ID returned from trackMount
   *
   * @example
   * ```typescript
   * useEffect(() => {
   *   const id = tracker.trackMount('MyComponent');
   *   return () => tracker.trackUnmount(id);
   * }, []);
   * ```
   */
  trackUnmount(id: string): void {
    if (!this.enabled || !id) {
      return;
    }

    const info = this.activeComponents.get(id);
    if (!info) {
      console.warn(`[LifecycleTracker] Attempted to unmount unknown component: ${id}`);
      return;
    }

    const now = Date.now();
    const memoryAtUnmount = captureMemorySnapshot();

    // Calculate metrics
    info.unmountedAt = now;
    info.duration = now - info.mountedAt;
    info.memoryAtUnmount = memoryAtUnmount;

    if (info.memoryAtMount && memoryAtUnmount &&
        memoryAtUnmount.usedJSHeapSize !== undefined &&
        info.memoryAtMount.usedJSHeapSize !== undefined) {
      info.memoryGrowth =
        memoryAtUnmount.usedJSHeapSize - info.memoryAtMount.usedJSHeapSize;

      // Log warning for high memory growth
      if (info.memoryGrowth > HIGH_MEMORY_GROWTH_THRESHOLD) {
        console.warn(
          `[LifecycleTracker] Component "${info.name}" (${id}) caused significant memory growth: ` +
            `${formatBytes(info.memoryGrowth)} over ${(info.duration / 1000).toFixed(1)}s`
        );
      }
    }

    // Move to unmounted map
    this.activeComponents.delete(id);
    this.unmountedComponents.set(id, info);

    // Prevent unbounded growth of unmounted components
    if (this.unmountedComponents.size > MAX_TRACKED_COMPONENTS) {
      // Remove oldest half
      const entriesToRemove = Array.from(this.unmountedComponents.entries())
        .sort((a, b) => a[1].mountedAt - b[1].mountedAt)
        .slice(0, Math.floor(MAX_TRACKED_COMPONENTS / 2));

      for (const [key] of entriesToRemove) {
        this.unmountedComponents.delete(key);
      }
    }
  }

  /**
   * Get list of currently active components.
   *
   * @returns {ComponentInfo[]} Array of active component information
   *
   * @example
   * ```typescript
   * const active = tracker.getActiveComponents();
   * console.log(`Active components: ${active.length}`);
   * active.forEach(c => console.log(`- ${c.name}: ${c.mountedAt}ms`));
   * ```
   */
  getActiveComponents(): ComponentInfo[] {
    if (!this.enabled) {
      return [];
    }

    return Array.from(this.activeComponents.values());
  }

  /**
   * Get aggregated statistics about component lifecycles.
   *
   * @returns {LifecycleStats} Computed statistics
   *
   * @example
   * ```typescript
   * const stats = tracker.getStats();
   * console.log(`Active: ${stats.activeCount}, Avg duration: ${stats.averageDuration}ms`);
   * console.table(stats.longLivedComponents);
   * ```
   */
  getStats(): LifecycleStats {
    if (!this.enabled) {
      return {
        totalTracked: 0,
        activeCount: 0,
        unmountedCount: 0,
        averageDuration: 0,
        totalMemoryGrowth: 0,
        averageMemoryGrowth: 0,
        longLivedComponents: [],
        highMemoryGrowthComponents: [],
      };
    }

    const allComponents = [
      ...Array.from(this.activeComponents.values()),
      ...Array.from(this.unmountedComponents.values()),
    ];

    // Calculate averages
    const unmountedOnly = allComponents.filter((c) => c.unmountedAt !== null);
    const totalDuration = unmountedOnly.reduce((sum, c) => sum + (c.duration || 0), 0);
    const averageDuration =
      unmountedOnly.length > 0 ? totalDuration / unmountedOnly.length : 0;

    const withMemoryGrowth = unmountedOnly.filter((c) => c.memoryGrowth !== null);
    const totalMemoryGrowth = withMemoryGrowth.reduce(
      (sum, c) => sum + (c.memoryGrowth || 0),
      0
    );
    const averageMemoryGrowth =
      withMemoryGrowth.length > 0 ? totalMemoryGrowth / withMemoryGrowth.length : 0;

    // Find long-lived components
    const now = Date.now();
    const longLivedComponents = Array.from(this.activeComponents.values()).filter(
      (c) => now - c.mountedAt > LONG_LIVED_THRESHOLD_MS
    );

    // Find high memory growth components
    const highMemoryGrowthComponents = unmountedOnly
      .filter((c) => c.memoryGrowth && c.memoryGrowth > HIGH_MEMORY_GROWTH_THRESHOLD)
      .sort((a, b) => (b.memoryGrowth || 0) - (a.memoryGrowth || 0))
      .slice(0, 10); // Top 10

    return {
      totalTracked: allComponents.length,
      activeCount: this.activeComponents.size,
      unmountedCount: this.unmountedComponents.size,
      averageDuration,
      totalMemoryGrowth,
      averageMemoryGrowth,
      longLivedComponents,
      highMemoryGrowthComponents,
    };
  }

  /**
   * Clear all tracked data (useful for testing or resetting stats).
   */
  clear(): void {
    if (!this.enabled) {
      return;
    }

    this.activeComponents.clear();
    this.unmountedComponents.clear();
    this.idCounter = 0;
  }

  /**
   * Check for long-lived components and log warnings.
   * Called periodically by internal timer.
   */
  private checkLongLivedComponents(): void {
    if (!this.enabled) {
      return;
    }

    const now = Date.now();
    const longLived = Array.from(this.activeComponents.values()).filter(
      (c) => now - c.mountedAt > LONG_LIVED_THRESHOLD_MS
    );

    if (longLived.length > 0) {
      console.warn(
        `[LifecycleTracker] Found ${longLived.length} component(s) mounted for >1 hour:`
      );
      longLived.forEach((c) => {
        const duration = now - c.mountedAt;
        const hours = (duration / (60 * 60 * 1000)).toFixed(1);
        console.warn(`  - ${c.name} (${c.id}): ${hours}h`);
      });
    }
  }

  /**
   * Check if tracker is enabled (development mode only).
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global singleton instance of the lifecycle tracker.
 *
 * Use this instance throughout your application to track component lifecycles.
 *
 * @example
 * ```typescript
 * import { lifecycleTracker } from '@/lib/memory/lifecycle-tracker';
 *
 * function MyComponent() {
 *   useEffect(() => {
 *     const id = lifecycleTracker.trackMount('MyComponent');
 *     return () => lifecycleTracker.trackUnmount(id);
 *   }, []);
 *
 *   return <div>Content</div>;
 * }
 * ```
 */
export const lifecycleTracker = new ComponentLifecycleTracker();

// Expose to window in development for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__lifecycleTracker = lifecycleTracker;
}
