/**
 * useShakeAnimation Hook
 *
 * Reusable hook for shake animations with automatic timer cleanup.
 * Prevents memory leaks from setTimeout calls in shake animations.
 *
 * Features:
 * - Automatic cleanup via useTimeout hook
 * - Configurable duration
 * - Simple trigger API
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { isShaking, triggerShake } = useShakeAnimation();
 *
 *   const onError = () => {
 *     toast.error("Invalid credentials");
 *     triggerShake();
 *   };
 *
 *   return (
 *     <div className={isShaking ? "animate-shake" : ""}>
 *       {/* form content *\/}
 *     </div>
 *   );
 * }
 * ```
 */

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseShakeAnimationOptions {
  /** Duration of shake animation in milliseconds (default: 300) */
  duration?: number;
}

export interface UseShakeAnimationResult {
  /** Whether the shake animation is currently active */
  isShaking: boolean;
  /** Trigger the shake animation */
  triggerShake: () => void;
}

/**
 * Hook for managing shake animations with automatic timer cleanup.
 *
 * @param options - Configuration options
 * @returns Object with isShaking state and triggerShake method
 */
export function useShakeAnimation(
  options: UseShakeAnimationOptions = {}
): UseShakeAnimationResult {
  const { duration = 300 } = options;
  const [isShaking, setIsShaking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Trigger shake animation
  const triggerShake = useCallback(() => {
    // Clear any existing timeout
    cleanup();

    // Start shake
    setIsShaking(true);

    // Auto-reset after duration
    timeoutRef.current = setTimeout(() => {
      setIsShaking(false);
      timeoutRef.current = null;
    }, duration);
  }, [duration, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isShaking,
    triggerShake,
  };
}
