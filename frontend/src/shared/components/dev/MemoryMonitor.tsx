/**
 * Memory Monitor Dev Panel
 *
 * Development-only component for visualizing memory usage in real-time.
 * Displays current, peak, and average memory consumption with leak detection.
 *
 * @see frontend/hooks/useMemoryMonitor.ts - Memory monitoring hook
 * @see specs/020-memory-optimization/contracts/memory-monitoring.ts - Contracts
 */

'use client';

import { useMemoryMonitor } from '@/shared/hooks/useMemoryMonitor';

// ============================================================================
// Component
// ============================================================================

/**
 * Memory Monitor dev panel component.
 *
 * Renders a fixed-position panel in the bottom-right corner showing real-time
 * memory statistics. Only visible in development mode.
 *
 * Features:
 * - Current/Peak/Average memory display
 * - Memory growth rate
 * - Leak detection warning
 * - Start/Stop/Clear controls
 *
 * @example
 * ```tsx
 * // In your root layout or app component (dev only):
 * import { MemoryMonitor } from '@/components/dev/MemoryMonitor';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <MemoryMonitor />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function MemoryMonitor() {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { stats, isMonitoring, start, stop, clear } = useMemoryMonitor({
    interval: 5000, // 5 seconds
    maxSnapshots: 100,
  });

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-lg bg-black/80 p-4 text-sm text-white shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
        <h3 className="font-semibold">Memory Monitor</h3>
        <div
          className={`h-2 w-2 rounded-full ${
            isMonitoring ? 'animate-pulse bg-green-500' : 'bg-gray-500'
          }`}
        />
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {/* Current Memory */}
        <div className="flex justify-between">
          <span className="text-gray-400">Current:</span>
          <span className="font-mono font-medium">
            {stats?.current.toFixed(2) ?? '0.00'} MB
          </span>
        </div>

        {/* Peak Memory */}
        <div className="flex justify-between">
          <span className="text-gray-400">Peak:</span>
          <span className="font-mono font-medium text-yellow-400">
            {stats?.peak.toFixed(2) ?? '0.00'} MB
          </span>
        </div>

        {/* Average Memory */}
        <div className="flex justify-between">
          <span className="text-gray-400">Average:</span>
          <span className="font-mono font-medium">
            {stats?.average.toFixed(2) ?? '0.00'} MB
          </span>
        </div>

        {/* Growth Rate */}
        {stats && stats.growthRate > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Growth:</span>
            <span
              className={`font-mono font-medium ${
                stats?.leakDetected ? 'text-red-500' : 'text-blue-400'
              }`}
            >
              +{stats?.growthRate?.toFixed(2) ?? '0.00'} MB/min
            </span>
          </div>
        )}
      </div>

      {/* Leak Warning */}
      {stats?.leakDetected && (
        <div className="mt-3 rounded bg-red-500/20 p-2 text-xs text-red-400">
          ⚠️ Potential memory leak detected!
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        {/* Start/Stop Button */}
        <button
          onClick={isMonitoring ? stop : start}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            isMonitoring
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isMonitoring ? 'Stop' : 'Start'}
        </button>

        {/* Clear Button */}
        <button
          onClick={clear}
          disabled={!stats || stats.current === 0}
          className="rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 enabled:bg-gray-700 enabled:hover:bg-gray-600"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
