/**
 * Memory Snapshot Utility
 *
 * Provides utilities for capturing memory snapshots using the Performance API.
 * Supports comparison and formatting of memory metrics.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
 * @note performance.memory is non-standard and only available in Chrome/Edge
 */

import type { MemorySnapshot } from './types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Performance.memory interface (Chrome/Edge only)
 * @see https://webplatform.github.io/docs/apis/timing/properties/memory/
 */
interface PerformanceMemory {
  /** Total allocated heap size in bytes */
  totalJSHeapSize: number;
  /** Currently used heap size in bytes */
  usedJSHeapSize: number;
  /** Maximum heap size limit in bytes */
  jsHeapSizeLimit: number;
}

/**
 * Extended Performance interface with memory property
 */
interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

/**
 * Result of comparing two memory snapshots
 */
export interface MemoryComparison {
  /** Memory growth in megabytes */
  growthMB: number;
  /** Memory growth as a percentage (0-100) */
  growthPercent: number;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Captures a memory snapshot using the Performance API.
 *
 * This function attempts to capture memory metrics from the browser's performance API.
 * The API is non-standard and only available in Chrome/Edge browsers.
 *
 * @returns {MemorySnapshot | null} Memory snapshot if API is available, null otherwise
 *
 * @example
 * ```typescript
 * const snapshot = captureMemorySnapshot();
 * if (snapshot) {
 *   console.log(`Memory used: ${formatBytes(snapshot.usedJSHeapSize)}`);
 * } else {
 *   console.warn('Performance.memory API not available');
 * }
 * ```
 */
export function captureMemorySnapshot(): MemorySnapshot | null {
  const perf = performance as PerformanceWithMemory;

  // Check if memory API is available
  if (!perf.memory) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Performance.memory API is not available. ' +
          'This API is non-standard and only available in Chrome/Edge browsers.'
      );
    }
    return null;
  }

  const { memory } = perf;

  return {
    timestamp: Date.now(),
    heapSizeUsed: memory.usedJSHeapSize,
    heapSizeLimit: memory.jsHeapSizeLimit,
    totalJSHeapSize: memory.totalJSHeapSize,
    usedJSHeapSize: memory.usedJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}

/**
 * Compares two memory snapshots and calculates the memory growth.
 *
 * @param {MemorySnapshot} before - The earlier snapshot
 * @param {MemorySnapshot} after - The later snapshot
 * @returns {MemoryComparison} Growth metrics in MB and percentage
 *
 * @example
 * ```typescript
 * const before = captureMemorySnapshot();
 * // ... perform operations ...
 * const after = captureMemorySnapshot();
 *
 * if (before && after) {
 *   const { growthMB, growthPercent } = compareSnapshots(before, after);
 *   console.log(`Memory grew by ${growthMB.toFixed(2)} MB (${growthPercent.toFixed(1)}%)`);
 * }
 * ```
 */
export function compareSnapshots(
  before: MemorySnapshot,
  after: MemorySnapshot
): MemoryComparison {
  const growthBytes = after.usedJSHeapSize - before.usedJSHeapSize;
  const growthMB = growthBytes / (1024 * 1024);

  // Calculate percentage growth (handle division by zero)
  const growthPercent =
    before.usedJSHeapSize > 0
      ? (growthBytes / before.usedJSHeapSize) * 100
      : 0;

  return {
    growthMB,
    growthPercent,
  };
}

/**
 * Formats byte values to human-readable strings.
 *
 * @param {number} bytes - The byte value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted string with appropriate unit (B, KB, MB, GB)
 *
 * @example
 * ```typescript
 * formatBytes(1024);           // "1.00 KB"
 * formatBytes(1536);           // "1.50 KB"
 * formatBytes(1048576);        // "1.00 MB"
 * formatBytes(1073741824);     // "1.00 GB"
 * formatBytes(1024, 0);        // "1 KB"
 * formatBytes(1536, 1);        // "1.5 KB"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(dm)} ${sizes[i]}`;
}
