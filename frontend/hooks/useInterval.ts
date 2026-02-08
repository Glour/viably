/**
 * useInterval Hook
 *
 * Safe wrapper for setInterval with automatic cleanup on unmount.
 * Prevents memory leaks from forgotten clearInterval calls.
 *
 * Features:
 * - Automatic cleanup via useComponentCleanup
 * - Pause/resume via delay=null
 * - TypeScript type-safe callback
 * - Dev-mode warnings for uncleaned intervals
 *
 * @example
 * ```tsx
 * function CountdownTimer() {
 *   const [count, setCount] = useState(10);
 *
 *   // Auto-cleanup on unmount
 *   useInterval(() => {
 *     setCount((c) => c - 1);
 *   }, count > 0 ? 1000 : null); // Pauses when count reaches 0
 *
 *   return <div>{count}</div>;
 * }
 * ```
 */

"use client";

import { useEffect, useRef } from 'react';
import { useComponentCleanup } from './useComponentCleanup';

/**
 * Creates a setInterval that automatically cleans up on unmount.
 *
 * @param callback - Function to execute on each interval tick
 * @param delay - Delay in milliseconds (null to pause)
 *
 * @remarks
 * - Setting delay to null pauses the interval without cleanup
 * - Changing delay restarts the interval with new timing
 * - Callback is always the latest version (no stale closures)
 */
export function useInterval(
  callback: () => void,
  delay: number | null
): void {
  const { registerSubscription, cleanupSubscription } = useComponentCleanup(
    'useInterval'
  );

  // Store latest callback in ref to avoid re-creating interval on callback change
  const savedCallback = useRef<() => void>(callback);

  // Update ref when callback changes (no interval restart needed)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup interval effect
  useEffect(() => {
    // Don't start interval if delay is null (paused state)
    if (delay === null) {
      return;
    }

    // Validate delay
    if (delay < 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️ useInterval: Invalid delay ${delay}ms. Must be >= 0 or null.`
        );
      }
      return;
    }

    // Start interval
    const intervalId = setInterval(() => {
      savedCallback.current();
    }, delay);

    // Register for automatic cleanup
    const subscriptionId = registerSubscription({
      type: 'interval',
      createdAt: Date.now(),
      cleanupFn: () => clearInterval(intervalId),
      metadata: {
        delay,
        intervalId: intervalId.toString(),
      },
    });

    // Cleanup function: clear interval and mark as cleaned
    return () => {
      clearInterval(intervalId);
      cleanupSubscription(subscriptionId);
    };
  }, [delay, registerSubscription, cleanupSubscription]);
}
