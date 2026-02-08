/**
 * useTimeout Hook
 *
 * Safe wrapper for setTimeout with automatic cleanup on unmount.
 * Prevents memory leaks from forgotten clearTimeout calls.
 *
 * Features:
 * - Automatic cleanup via useComponentCleanup
 * - Manual clear() method for early cancellation
 * - TypeScript type-safe callback
 * - Dev-mode warnings for uncleaned timeouts
 *
 * @example
 * ```tsx
 * function DelayedMessage() {
 *   const [visible, setVisible] = useState(false);
 *
 *   const { clear } = useTimeout(() => {
 *     setVisible(true);
 *   }, 3000);
 *
 *   return (
 *     <div>
 *       {visible && <p>Message appeared!</p>}
 *       <button onClick={clear}>Cancel</button>
 *     </div>
 *   );
 * }
 * ```
 */

"use client";

import { useEffect, useRef } from 'react';
import { useComponentCleanup } from './useComponentCleanup';

/**
 * Return type for useTimeout hook.
 */
export interface UseTimeoutResult {
  /** Manually clear the timeout before it fires */
  clear: () => void;
}

/**
 * Creates a setTimeout that automatically cleans up on unmount.
 *
 * @param callback - Function to execute after delay
 * @param delay - Delay in milliseconds
 * @returns Object with clear() method for manual cancellation
 *
 * @remarks
 * - Timeout starts immediately when hook mounts
 * - Changing delay or callback restarts the timeout
 * - Call clear() to cancel before execution
 * - Automatic cleanup on unmount via useComponentCleanup
 */
export function useTimeout(
  callback: () => void,
  delay: number
): UseTimeoutResult {
  const { registerSubscription, cleanupSubscription } = useComponentCleanup(
    'useTimeout'
  );

  // Store latest callback in ref to avoid re-creating timeout on callback change
  const savedCallback = useRef<() => void>(callback);

  // Store subscription ID for manual cleanup
  const subscriptionIdRef = useRef<string | null>(null);

  // Store timeout ID for manual clearing
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when callback changes (no timeout restart needed)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Manual clear function
  const clear = (): void => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (subscriptionIdRef.current !== null) {
      cleanupSubscription(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
    }
  };

  // Setup timeout effect
  useEffect(() => {
    // Validate delay
    if (delay < 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️ useTimeout: Invalid delay ${delay}ms. Must be >= 0.`
        );
      }
      return;
    }

    // Start timeout
    const timeoutId = setTimeout(() => {
      savedCallback.current();

      // Auto-cleanup after execution
      if (subscriptionIdRef.current !== null) {
        cleanupSubscription(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    }, delay);

    timeoutIdRef.current = timeoutId;

    // Register for automatic cleanup
    const subscriptionId = registerSubscription({
      type: 'timer',
      createdAt: Date.now(),
      cleanupFn: () => {
        if (timeoutIdRef.current !== null) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      },
      metadata: {
        delay,
        timeoutId: timeoutId.toString(),
      },
    });

    subscriptionIdRef.current = subscriptionId;

    // Cleanup function: clear timeout and mark as cleaned
    return () => {
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      if (subscriptionIdRef.current !== null) {
        cleanupSubscription(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [delay, registerSubscription, cleanupSubscription]);

  return { clear };
}
