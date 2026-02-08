/**
 * useComponentCleanup Hook
 *
 * Provides automatic tracking and cleanup of component subscriptions and external resources.
 * Prevents memory leaks by ensuring all registered items are cleaned up on unmount.
 *
 * Features:
 * - Automatic cleanup on component unmount
 * - Dev-mode warnings for uncleaned resources
 * - Manual cleanup methods for early disposal
 * - Unique ID generation per registration
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { registerSubscription, registerResource } = useComponentCleanup('MyComponent');
 *
 *   useEffect(() => {
 *     const id = registerSubscription({
 *       type: 'event',
 *       createdAt: Date.now(),
 *       cleanupFn: () => window.removeEventListener('resize', handleResize),
 *       metadata: { event: 'resize' }
 *     });
 *
 *     window.addEventListener('resize', handleResize);
 *
 *     return () => {}; // useComponentCleanup handles cleanup automatically
 *   }, []);
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import type {
  Subscription,
  ExternalResource,
  UseComponentCleanupResult,
} from '@/lib/memory/types';

/**
 * Hook for managing component lifecycle cleanup.
 *
 * @param componentName - Name of the component for debugging purposes
 * @returns Object with registration and cleanup methods
 */
export function useComponentCleanup(
  componentName: string
): UseComponentCleanupResult {
  // Use refs to persist across renders without triggering re-renders
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const resourcesRef = useRef<Map<string, ExternalResource>>(new Map());

  /**
   * Generates a unique ID for subscriptions/resources.
   * Format: {componentName}-{timestamp}-{random}
   */
  const generateId = (): string => {
    return `${componentName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  /**
   * Registers a subscription that requires cleanup.
   * Returns a unique ID for manual cleanup if needed.
   */
  const registerSubscription = (
    subscription: Omit<Subscription, 'id' | 'cleaned'>
  ): string => {
    const id = generateId();
    const fullSubscription: Subscription = {
      ...subscription,
      id,
      cleaned: false,
    };

    subscriptionsRef.current.set(id, fullSubscription);
    return id;
  };

  /**
   * Registers an external resource that requires disposal.
   * Returns a unique ID for manual disposal if needed.
   */
  const registerResource = (
    resource: Omit<ExternalResource, 'id' | 'disposed'>
  ): string => {
    const id = generateId();
    const fullResource: ExternalResource = {
      ...resource,
      id,
      disposed: false,
    };

    resourcesRef.current.set(id, fullResource);
    return id;
  };

  /**
   * Manually cleanup a subscription by ID.
   * Calls the cleanup function and marks as cleaned.
   */
  const cleanupSubscription = (id: string): void => {
    const subscription = subscriptionsRef.current.get(id);
    if (!subscription) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️ Component ${componentName}: Attempted to cleanup non-existent subscription with ID ${id}`
        );
      }
      return;
    }

    if (!subscription.cleaned) {
      try {
        subscription.cleanupFn();
        subscription.cleaned = true;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            `⚠️ Component ${componentName}: Error cleaning up subscription ${id}:`,
            error
          );
        }
      }
    }
  };

  /**
   * Manually dispose a resource by ID.
   * Calls the dispose function and marks as disposed.
   */
  const disposeResource = (id: string): void => {
    const resource = resourcesRef.current.get(id);
    if (!resource) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️ Component ${componentName}: Attempted to dispose non-existent resource with ID ${id}`
        );
      }
      return;
    }

    if (!resource.disposed) {
      try {
        resource.disposeFn();
        resource.disposed = true;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            `⚠️ Component ${componentName}: Error disposing resource ${id}:`,
            error
          );
        }
      }
    }
  };

  /**
   * Returns all active (uncleaned) subscriptions.
   */
  const getActiveSubscriptions = (): Subscription[] => {
    return Array.from(subscriptionsRef.current.values()).filter(
      (sub) => !sub.cleaned
    );
  };

  /**
   * Returns all undisposed resources.
   */
  const getUndisposedResources = (): ExternalResource[] => {
    return Array.from(resourcesRef.current.values()).filter(
      (res) => !res.disposed
    );
  };

  /**
   * Cleanup effect that runs on component unmount.
   * Automatically cleans up all subscriptions and disposes all resources.
   * Emits warnings in development mode for any uncleaned items.
   */
  useEffect(() => {
    // Capture refs in closure to satisfy exhaustive-deps
    const subscriptions = subscriptionsRef.current;
    const resources = resourcesRef.current;

    return () => {
      // Cleanup all subscriptions
      Array.from(subscriptions.entries()).forEach(([id, subscription]) => {
        if (!subscription.cleaned) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `⚠️ Component ${componentName} unmounted with active subscription: ${subscription.type}`,
              {
                id,
                createdAt: new Date(subscription.createdAt).toISOString(),
                metadata: subscription.metadata,
              }
            );
          }

          try {
            subscription.cleanupFn();
            subscription.cleaned = true;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(
                `⚠️ Component ${componentName}: Error during automatic cleanup of subscription ${id}:`,
                error
              );
            }
          }
        }
      });

      // Dispose all resources
      Array.from(resources.entries()).forEach(([id, resource]) => {
        if (!resource.disposed) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `⚠️ Component ${componentName} unmounted with undisposed resource: ${resource.type}`,
              {
                id,
                createdAt: new Date(resource.createdAt).toISOString(),
                metadata: resource.metadata,
              }
            );
          }

          try {
            resource.disposeFn();
            resource.disposed = true;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(
                `⚠️ Component ${componentName}: Error during automatic disposal of resource ${id}:`,
                error
              );
            }
          }
        }
      });

      // Clear all maps
      subscriptions.clear();
      resources.clear();
    };
  }, [componentName]); // Include componentName to satisfy exhaustive-deps

  return {
    registerSubscription,
    registerResource,
    cleanupSubscription,
    disposeResource,
    getActiveSubscriptions,
    getUndisposedResources,
  };
}
