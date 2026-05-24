/**
 * useComponentCleanup Hook
 *
 * Provides automatic tracking and cleanup of component subscriptions and external resources.
 * Prevents memory leaks by ensuring all registered items are cleaned up on unmount.
 *
 * Features:
 * - Automatic cleanup on component unmount
 * - Dev-mode warnings for uncleaned resources
 * - **WebSocket-specific leak detection** with readyState validation
 * - Manual cleanup methods for early disposal
 * - Unique ID generation per registration
 *
 * WebSocket Cleanup Best Practices:
 * 1. Always register WebSocket subscriptions with readyState metadata
 * 2. Close WebSocket connections in cleanup function (ws.close())
 * 3. Use react-use-websocket for automatic reconnection management
 * 4. Avoid manual WebSocket instantiation unless necessary
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { registerSubscription, registerResource } = useComponentCleanup('MyComponent');
 *
 *   // Example: Event listener
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
 *
 *   // Example: WebSocket (with readyState tracking)
 *   useEffect(() => {
 *     const ws = new WebSocket('ws://localhost:8000');
 *
 *     const id = registerSubscription({
 *       type: 'websocket',
 *       createdAt: Date.now(),
 *       cleanupFn: () => {
 *         if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
 *           ws.close();
 *         }
 *       },
 *       metadata: {
 *         url: 'ws://localhost:8000',
 *         readyState: ws.readyState, // Track initial state
 *       }
 *     });
 *
 *     // Update readyState on state changes
 *     ws.onopen = () => {
 *       // Update metadata if needed (optional)
 *     };
 *
 *     return () => {}; // Hook handles cleanup
 *   }, []);
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import type {
  Subscription,
  ExternalResource,
  UseComponentCleanupResult,
} from '@/shared/lib/memory/types';

/**
 * Extended metadata for WebSocket subscriptions.
 * Tracks connection state to detect unclosed connections.
 */
interface WebSocketMetadata {
  url?: string;
  readyState?: number; // WebSocket.CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3
  protocols?: string[];
  [key: string]: unknown;
}

/**
 * Converts WebSocket readyState number to human-readable label.
 *
 * @param readyState - WebSocket readyState value (0-3)
 * @returns Human-readable label
 */
function getReadyStateLabel(readyState: number | undefined): string {
  switch (readyState) {
    case 0:
      return 'CONNECTING';
    case 1:
      return 'OPEN';
    case 2:
      return 'CLOSING';
    case 3:
      return 'CLOSED';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Validates WebSocket cleanup to detect unclosed connections.
 * Returns true if WebSocket appears to be unclosed (OPEN or CONNECTING state).
 *
 * @param subscription - The subscription to validate
 * @returns True if WebSocket is unclosed, false otherwise
 */
function validateWebSocketCleanup(subscription: Subscription): boolean {
  if (subscription.type !== 'websocket') return false;

  const metadata = subscription.metadata as WebSocketMetadata | undefined;
  if (!metadata || metadata.readyState === undefined) return false;

  // WebSocket.OPEN = 1, WebSocket.CONNECTING = 0
  // If readyState is 0 or 1, connection is still active
  return metadata.readyState === 0 || metadata.readyState === 1;
}

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
    subscription: Omit<Subscription, 'id' | 'cleanedUp'>
  ): string => {
    const id = generateId();
    const fullSubscription: Subscription = {
      ...subscription,
      id,
      cleanedUp: false,
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

    if (!subscription.cleanedUp) {
      try {
        subscription.cleanupFn();
        subscription.cleanedUp = true;
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
      (sub) => !sub.cleanedUp
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
        if (!subscription.cleanedUp) {
          if (process.env.NODE_ENV === 'development') {
            // T038: Enhanced warnings for event listeners
            // T032: WebSocket-specific validation and warnings
            const isUncloseWebSocket = validateWebSocketCleanup(subscription);

            if (isUncloseWebSocket) {
              const metadata = subscription.metadata as WebSocketMetadata | undefined;
              console.warn(
                `⚠️ WEBSOCKET LEAK: Component ${componentName} unmounted with UNCLOSED WebSocket connection!`,
                {
                  id,
                  url: metadata?.url || 'unknown',
                  readyState: metadata?.readyState,
                  readyStateLabel: getReadyStateLabel(metadata?.readyState),
                  createdAt: new Date(subscription.createdAt).toISOString(),
                  recommendation: 'WebSocket connections should be closed in cleanup function or useEffect return.',
                }
              );
            } else if (subscription.type === 'event') {
              // T038: Enhanced warnings for event listeners with fix recommendations
              const eventType = subscription.metadata?.event || 'unknown';
              const target = subscription.metadata?.target || 'unknown';
              const element = subscription.metadata?.element;

              console.group(
                `⚠️ Memory Leak Warning: Uncleaned Event Listener in ${componentName}`
              );
              console.warn('Event listener was not cleaned up before unmount');
              const details: Record<string, unknown> = {
                id,
                eventType,
                target,
                registeredAt: new Date(subscription.createdAt).toISOString(),
                metadata: subscription.metadata,
              };
              if (element) {
                details.element = element;
              }
              console.log('Details:', details);
              console.log('\n💡 How to fix:');
              console.log('1. Ensure registerSubscription is called BEFORE addEventListener');
              console.log('2. Use the same function reference for add and remove');
              console.log('3. Example:');
              console.log(`
  const { registerSubscription } = useComponentCleanup('${componentName}');

  useEffect(() => {
    const handleEvent = (e) => { /* handler */ };

    // Register cleanup FIRST
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => ${target}.removeEventListener('${eventType}', handleEvent),
      metadata: { event: '${eventType}', target: '${target}' }
    });

    // Then add listener
    ${target}.addEventListener('${eventType}', handleEvent);
  }, [registerSubscription]);
              `);
              console.groupEnd();
            } else {
              console.warn(
                `⚠️ Component ${componentName} unmounted with active subscription: ${subscription.type}`,
                {
                  id,
                  createdAt: new Date(subscription.createdAt).toISOString(),
                  metadata: subscription.metadata,
                }
              );
            }
          }

          try {
            subscription.cleanupFn();
            subscription.cleanedUp = true;
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
