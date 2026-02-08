/**
 * Memory Monitor Hook
 *
 * React hook for continuous memory monitoring with snapshot history.
 * Provides automated memory tracking, statistics computation, and leak detection.
 *
 * @see specs/020-memory-optimization/contracts/memory-monitoring.ts - Contracts
 */

'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { captureMemorySnapshot } from '@/lib/memory/snapshot';
import type {
  MemorySnapshot,
  MemoryStats,
  UseMemoryMonitorResult,
} from '@/lib/memory/types';

// ============================================================================
// Types
// ============================================================================

interface UseMemoryMonitorOptions {
  /** Interval between snapshots in milliseconds (default: 5000) */
  interval?: number;
  /** Maximum number of snapshots to keep in memory (default: 100) */
  maxSnapshots?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<UseMemoryMonitorOptions> = {
  interval: 5000,
  maxSnapshots: 100,
};

/** Threshold for leak detection: MB/minute growth rate */
const LEAK_THRESHOLD_MB_PER_MINUTE = 1.0;

/** Minimum snapshots required for leak detection */
const MIN_SNAPSHOTS_FOR_LEAK_DETECTION = 10;

// ============================================================================
// Hook
// ============================================================================

/**
 * React hook for continuous memory monitoring.
 *
 * This hook captures memory snapshots at regular intervals and provides
 * computed statistics including memory growth rate and leak detection.
 *
 * @param {UseMemoryMonitorOptions} options - Configuration options
 * @returns {UseMemoryMonitorResult} Memory monitor state and control methods
 *
 * @example
 * ```typescript
 * function MemoryMonitor() {
 *   const { stats, isMonitoring, start, stop } = useMemoryMonitor({
 *     interval: 10000, // 10 seconds
 *     maxSnapshots: 50
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={start}>Start Monitoring</button>
 *       <button onClick={stop}>Stop Monitoring</button>
 *       <p>Current: {stats.current.toFixed(2)} MB</p>
 *       <p>Peak: {stats.peak.toFixed(2)} MB</p>
 *       {stats.leakDetected && <p className="text-red-500">Memory leak detected!</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMemoryMonitor(
  options: UseMemoryMonitorOptions = {}
): UseMemoryMonitorResult {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // ============================================================================
  // State
  // ============================================================================

  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // ============================================================================
  // Refs
  // ============================================================================

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Computed Values
  // ============================================================================

  /**
   * Latest snapshot from the history
   */
  const currentSnapshot = useMemo(() => {
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  }, [snapshots]);

  /**
   * Computed memory statistics
   */
  const stats = useMemo((): MemoryStats => {
    if (snapshots.length === 0) {
      return {
        current: 0,
        peak: 0,
        average: 0,
        growthRate: 0,
        leakDetected: false,
      };
    }

    // Convert bytes to MB
    const toMB = (bytes: number) => bytes / (1024 * 1024);

    // Current memory
    const current = toMB(snapshots[snapshots.length - 1].usedJSHeapSize);

    // Peak memory
    const peak = Math.max(
      ...snapshots.map((s) => toMB(s.usedJSHeapSize))
    );

    // Average memory
    const sum = snapshots.reduce(
      (acc, s) => acc + toMB(s.usedJSHeapSize),
      0
    );
    const average = sum / snapshots.length;

    // Growth rate (MB/minute)
    let growthRate = 0;
    if (snapshots.length >= 2) {
      const first = snapshots[0];
      const last = snapshots[snapshots.length - 1];
      const timeDiffMinutes = (last.timestamp - first.timestamp) / (1000 * 60);
      const memoryDiffMB = toMB(last.usedJSHeapSize - first.usedJSHeapSize);
      growthRate = timeDiffMinutes > 0 ? memoryDiffMB / timeDiffMinutes : 0;
    }

    // Leak detection: consistent growth over multiple snapshots
    const leakDetected =
      snapshots.length >= MIN_SNAPSHOTS_FOR_LEAK_DETECTION &&
      growthRate > LEAK_THRESHOLD_MB_PER_MINUTE;

    return {
      current,
      peak,
      average,
      growthRate,
      leakDetected,
    };
  }, [snapshots]);

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * Manually capture a memory snapshot
   */
  const captureSnapshot = useCallback((): MemorySnapshot => {
    const snapshot = captureMemorySnapshot();

    // If Performance API is unavailable, return a fallback snapshot
    if (!snapshot) {
      const fallback: MemorySnapshot = {
        timestamp: Date.now(),
        heapSizeUsed: 0,
        heapSizeLimit: 0,
        totalJSHeapSize: 0,
        usedJSHeapSize: 0,
        jsHeapSizeLimit: 0,
      };
      return fallback;
    }

    setSnapshots((prev) => {
      const updated = [...prev, snapshot];
      // Keep only last maxSnapshots
      return updated.length > opts.maxSnapshots
        ? updated.slice(updated.length - opts.maxSnapshots)
        : updated;
    });

    return snapshot;
  }, [opts.maxSnapshots]);

  /**
   * Start memory monitoring
   */
  const start = useCallback(() => {
    if (isMonitoring) {
      return;
    }

    setIsMonitoring(true);

    // Capture initial snapshot immediately
    captureSnapshot();

    // Start interval
    intervalRef.current = setInterval(() => {
      captureSnapshot();
    }, opts.interval);
  }, [isMonitoring, opts.interval, captureSnapshot]);

  /**
   * Stop memory monitoring
   */
  const stop = useCallback(() => {
    if (!isMonitoring) {
      return;
    }

    setIsMonitoring(false);

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isMonitoring]);

  /**
   * Clear all snapshots
   */
  const clear = useCallback(() => {
    setSnapshots([]);
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    currentSnapshot,
    snapshots,
    stats,
    isMonitoring,
    start,
    stop,
    clear,
    captureSnapshot,
  };
}
