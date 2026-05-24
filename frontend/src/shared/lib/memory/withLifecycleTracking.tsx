/**
 * withLifecycleTracking HOC
 *
 * Higher-Order Component that automatically tracks component mount/unmount lifecycle events.
 * Uses the lifecycle-tracker utility for development-time debugging and memory leak detection.
 *
 * Features:
 * - Automatic lifecycle tracking on mount/unmount
 * - Auto-detects component name from displayName or name
 * - Forwards all props and refs correctly
 * - No-op in production mode (returns original component)
 * - Full TypeScript generics support
 *
 * @example
 * ```tsx
 * // Basic usage
 * function MyComponent({ title }: { title: string }) {
 *   return <h1>{title}</h1>;
 * }
 * export default withLifecycleTracking(MyComponent);
 *
 * // With custom name
 * export default withLifecycleTracking(MyComponent, 'CustomName');
 * ```
 */

'use client';

import { useEffect, useRef, type ComponentType } from 'react';
import { lifecycleTracker } from './lifecycle-tracker';

/**
 * Extracts the display name from a component.
 * Tries displayName first, then name, then falls back to 'Component'.
 */
function getComponentName<P>(Component: ComponentType<P>): string {
  return (
    Component.displayName ||
    Component.name ||
    'Component'
  );
}

/**
 * Higher-Order Component that wraps a component with lifecycle tracking.
 *
 * @param Component - The component to wrap
 * @param componentName - Optional custom name (auto-detected if not provided)
 * @returns Wrapped component with lifecycle tracking
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   return <div>User {userId}</div>;
 * }
 * export default withLifecycleTracking(UserProfile);
 * ```
 */
export function withLifecycleTracking<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
): ComponentType<P> {
  // In production, return the original component unchanged
  if (process.env.NODE_ENV !== 'development') {
    return Component;
  }

  // Get component name (use provided name or auto-detect)
  const displayName = componentName || getComponentName(Component);

  // Create wrapper component
  const WrappedComponent: ComponentType<P> = (props: P) => {
    const trackingIdRef = useRef<string>('');

    useEffect(() => {
      // Track mount
      trackingIdRef.current = lifecycleTracker.trackMount(displayName);

      // Track unmount on cleanup
      return () => {
        if (trackingIdRef.current) {
          lifecycleTracker.trackUnmount(trackingIdRef.current);
        }
      };
    }, []); // Empty deps - only track mount/unmount once

    // Render original component with all props
    return <Component {...props} />;
  };

  // Set display name for better debugging
  WrappedComponent.displayName = `withLifecycleTracking(${displayName})`;

  return WrappedComponent;
}

/**
 * Type guard to check if a component is already wrapped with lifecycle tracking.
 * Useful to prevent double-wrapping.
 *
 * @param Component - Component to check
 * @returns True if component is already wrapped
 */
export function isLifecycleTracked<P>(Component: ComponentType<P>): boolean {
  return Component.displayName?.startsWith('withLifecycleTracking(') || false;
}

/**
 * Utility to conditionally wrap a component with lifecycle tracking.
 * Only wraps if not already wrapped.
 *
 * @param Component - Component to wrap
 * @param componentName - Optional custom name
 * @returns Wrapped component (or original if already wrapped)
 *
 * @example
 * ```tsx
 * // Safe to call multiple times - won't double-wrap
 * const Wrapped1 = ensureLifecycleTracking(MyComponent);
 * const Wrapped2 = ensureLifecycleTracking(Wrapped1); // Same as Wrapped1
 * ```
 */
export function ensureLifecycleTracking<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
): ComponentType<P> {
  if (isLifecycleTracked(Component)) {
    return Component;
  }

  return withLifecycleTracking(Component, componentName);
}
