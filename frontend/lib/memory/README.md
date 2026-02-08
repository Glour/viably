# Memory Management Utilities

Comprehensive guide for using memory optimization utilities in the Viably frontend application.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Common Patterns](#common-patterns)
  - [Event Listener Cleanup](#event-listener-cleanup)
  - [Timer and Interval Cleanup](#timer-and-interval-cleanup)
  - [WebSocket Cleanup](#websocket-cleanup)
  - [External Resource Cleanup](#external-resource-cleanup)
- [Anti-Patterns](#anti-patterns)
- [Development Mode Warnings](#development-mode-warnings)
- [API Reference](#api-reference)
- [Testing Cleanup Behavior](#testing-cleanup-behavior)

---

## Overview

The memory management utilities provide a structured approach to preventing memory leaks in React components. These utilities automatically track and cleanup subscriptions, event listeners, timers, and external resources on component unmount.

**Key features**:

- **Automatic cleanup**: Resources are automatically disposed when component unmounts
- **Development warnings**: Uncleaned resources trigger console warnings in dev mode
- **Manual cleanup**: Early disposal methods available for advanced use cases
- **Type-safe**: Full TypeScript support with strict type checking
- **Zero runtime cost in production**: Warning logic is stripped in production builds

**When to use**:

- Components with event listeners on `window` or `document`
- Components with timers (`setTimeout`, `setInterval`)
- Components with WebSocket connections
- Components with external resources (Monaco Editor, Chart.js, etc.)
- Components with React Query subscriptions requiring manual cleanup

---

## Quick Start

### Basic Usage

```typescript
import { useComponentCleanup } from '@/hooks/useComponentCleanup';
import { useEffect } from 'react';

function MyComponent() {
  const { registerSubscription } = useComponentCleanup('MyComponent');

  useEffect(() => {
    const handleResize = () => {
      console.log('Window resized');
    };

    // Register the cleanup function BEFORE adding the listener
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleResize),
      metadata: { event: 'resize', target: 'window' },
    });

    // Add the event listener
    window.addEventListener('resize', handleResize);

    // No need to return cleanup function - useComponentCleanup handles it
  }, [registerSubscription]);

  return <div>Resize the window to test</div>;
}
```

### Hook API

```typescript
const {
  registerSubscription,    // Register cleanup function for subscriptions
  registerResource,        // Register disposal function for external resources
  cleanupSubscription,     // Manually cleanup by ID
  disposeResource,         // Manually dispose by ID
  getActiveSubscriptions,  // Get list of active subscriptions
  getUndisposedResources,  // Get list of undisposed resources
} = useComponentCleanup('ComponentName');
```

---

## Common Patterns

### Event Listener Cleanup

**Window/document events**:

```typescript
function WindowEventComponent() {
  const { registerSubscription } = useComponentCleanup('WindowEventComponent');

  useEffect(() => {
    const handleScroll = () => {
      console.log('Scrolled:', window.scrollY);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('Escape pressed');
      }
    };

    // Register both cleanups
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('scroll', handleScroll),
      metadata: { event: 'scroll' },
    });

    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => document.removeEventListener('keydown', handleKeyDown),
      metadata: { event: 'keydown' },
    });

    // Add listeners
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('keydown', handleKeyDown);
  }, [registerSubscription]);

  return <div>Press Escape or scroll the page</div>;
}
```

**Element events** (with refs):

```typescript
function ElementEventComponent() {
  const { registerSubscription } = useComponentCleanup('ElementEventComponent');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleClick = () => {
      console.log('Button clicked');
    };

    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => button.removeEventListener('click', handleClick),
      metadata: { event: 'click', element: 'button' },
    });

    button.addEventListener('click', handleClick);
  }, [registerSubscription]);

  return <button ref={buttonRef}>Click me</button>;
}
```

---

### Timer and Interval Cleanup

**setTimeout**:

```typescript
function DelayedNotification() {
  const { registerSubscription } = useComponentCleanup('DelayedNotification');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setShow(true);
    }, 5000);

    registerSubscription({
      type: 'timer',
      createdAt: Date.now(),
      cleanupFn: () => clearTimeout(timerId),
      metadata: { delay: 5000, action: 'show notification' },
    });
  }, [registerSubscription]);

  return show ? <div>Notification</div> : null;
}
```

**setInterval**:

```typescript
function LiveClock() {
  const { registerSubscription } = useComponentCleanup('LiveClock');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    registerSubscription({
      type: 'interval',
      createdAt: Date.now(),
      cleanupFn: () => clearInterval(intervalId),
      metadata: { interval: 1000, purpose: 'clock update' },
    });
  }, [registerSubscription]);

  return <div>{time.toLocaleTimeString()}</div>;
}
```

**Multiple timers**:

```typescript
function MultiTimerComponent() {
  const { registerSubscription } = useComponentCleanup('MultiTimerComponent');

  useEffect(() => {
    // Short delay
    const timer1 = setTimeout(() => console.log('1 second'), 1000);
    registerSubscription({
      type: 'timer',
      createdAt: Date.now(),
      cleanupFn: () => clearTimeout(timer1),
      metadata: { delay: 1000 },
    });

    // Medium delay
    const timer2 = setTimeout(() => console.log('5 seconds'), 5000);
    registerSubscription({
      type: 'timer',
      createdAt: Date.now(),
      cleanupFn: () => clearTimeout(timer2),
      metadata: { delay: 5000 },
    });

    // Long delay
    const timer3 = setTimeout(() => console.log('10 seconds'), 10000);
    registerSubscription({
      type: 'timer',
      createdAt: Date.now(),
      cleanupFn: () => clearTimeout(timer3),
      metadata: { delay: 10000 },
    });
  }, [registerSubscription]);

  return <div>Multiple timers running...</div>;
}
```

---

### WebSocket Cleanup

**Basic WebSocket**:

```typescript
function WebSocketComponent({ url }: { url: string }) {
  const { registerResource } = useComponentCleanup('WebSocketComponent');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);

    // Register resource immediately after creation
    registerResource({
      type: 'websocket',
      createdAt: Date.now(),
      disposeFn: () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      },
      metadata: { url },
    });

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [url, registerResource]);

  return (
    <div>
      <h3>Messages:</h3>
      {messages.map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}
    </div>
  );
}
```

**WebSocket with manual cleanup**:

```typescript
function ControlledWebSocket({ url }: { url: string }) {
  const { registerResource, disposeResource } = useComponentCleanup('ControlledWebSocket');
  const [isConnected, setIsConnected] = useState(false);
  const wsIdRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const id = registerResource({
      type: 'websocket',
      createdAt: Date.now(),
      disposeFn: () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      },
      metadata: { url },
    });
    wsIdRef.current = id;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
  };

  const disconnect = () => {
    if (wsIdRef.current) {
      disposeResource(wsIdRef.current); // Manually trigger cleanup
      wsIdRef.current = null;
      wsRef.current = null;
    }
  };

  return (
    <div>
      <button onClick={connect} disabled={isConnected}>
        Connect
      </button>
      <button onClick={disconnect} disabled={!isConnected}>
        Disconnect
      </button>
    </div>
  );
}
```

---

### External Resource Cleanup

**Monaco Editor** (most common):

```typescript
import { loader } from '@monaco-editor/react';

function CodeEditor({ initialCode }: { initialCode: string }) {
  const { registerResource } = useComponentCleanup('CodeEditor');
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const modelRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let editor: any;
    let model: any;

    loader.init().then((monaco) => {
      // Create model
      const uri = monaco.Uri.parse(`inmemory://model-${Date.now()}.tsx`);
      model = monaco.editor.createModel(initialCode, 'typescript', uri);
      modelRef.current = model;

      // Register model cleanup
      registerResource({
        type: 'monaco-model',
        createdAt: Date.now(),
        disposeFn: () => model?.dispose(),
        metadata: { uri: uri.toString() },
      });

      // Create editor
      editor = monaco.editor.create(containerRef.current!, {
        model,
        theme: 'vs-dark',
        automaticLayout: true,
      });
      editorRef.current = editor;

      // Register editor cleanup
      registerResource({
        type: 'monaco-editor',
        createdAt: Date.now(),
        disposeFn: () => editor?.dispose(),
        metadata: { container: 'code-editor' },
      });
    });
  }, [initialCode, registerResource]);

  return <div ref={containerRef} style={{ height: '600px' }} />;
}
```

**Custom library cleanup**:

```typescript
import SomeLibrary from 'some-library';

function CustomLibraryComponent() {
  const { registerResource } = useComponentCleanup('CustomLibraryComponent');
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    // Initialize library
    const instance = new SomeLibrary({
      // options
    });
    instanceRef.current = instance;

    // Register cleanup
    registerResource({
      type: 'custom',
      createdAt: Date.now(),
      disposeFn: () => {
        instance.destroy(); // or instance.cleanup(), etc.
      },
      metadata: { library: 'SomeLibrary' },
    });

    // Use the instance
    instance.doSomething();
  }, [registerResource]);

  return <div>Using custom library</div>;
}
```

---

## Anti-Patterns

### ❌ DON'T: Forget to register cleanup

```typescript
// BAD: Event listener never removed
function BadComponent() {
  useEffect(() => {
    const handleResize = () => {
      console.log('Resized');
    };
    window.addEventListener('resize', handleResize);
    // ❌ No cleanup - memory leak!
  }, []);

  return <div>Bad example</div>;
}
```

**Fix**: Always register cleanup functions.

---

### ❌ DON'T: Register cleanup after adding listener

```typescript
// BAD: Race condition if component unmounts quickly
function BadOrderComponent() {
  const { registerSubscription } = useComponentCleanup('BadOrderComponent');

  useEffect(() => {
    const handleClick = () => console.log('Clicked');

    // ❌ Listener added first
    window.addEventListener('click', handleClick);

    // ❌ Cleanup registered second
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('click', handleClick),
    });
  }, [registerSubscription]);

  return <div>Bad order</div>;
}
```

**Fix**: Register cleanup BEFORE adding listener.

---

### ❌ DON'T: Use cleanup with wrong reference

```typescript
// BAD: Function reference doesn't match
function BadReferenceComponent() {
  const { registerSubscription } = useComponentCleanup('BadReferenceComponent');

  useEffect(() => {
    // ❌ Different function reference
    window.addEventListener('resize', () => console.log('A'));

    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', () => console.log('A')),
      // ❌ This won't work - different function instances
    });
  }, [registerSubscription]);

  return <div>Bad reference</div>;
}
```

**Fix**: Use the same function reference for both add and remove.

---

### ❌ DON'T: Forget to dispose external resources

```typescript
// BAD: Monaco Editor never disposed
function BadMonacoComponent() {
  useEffect(() => {
    const editor = monaco.editor.create(document.getElementById('container')!, {
      value: 'console.log("Hello")',
      language: 'javascript',
    });
    // ❌ No dispose - memory leak!
  }, []);

  return <div id="container" />;
}
```

**Fix**: Always use `registerResource` for external libraries.

---

### ❌ DON'T: Mutate registered metadata

```typescript
// BAD: Mutating metadata object
function BadMutationComponent() {
  const { registerSubscription } = useComponentCleanup('BadMutationComponent');

  useEffect(() => {
    const metadata = { count: 0 };

    registerSubscription({
      type: 'interval',
      createdAt: Date.now(),
      cleanupFn: () => clearInterval(intervalId),
      metadata,
    });

    const intervalId = setInterval(() => {
      metadata.count++; // ❌ Don't mutate registered metadata
    }, 1000);
  }, [registerSubscription]);

  return <div>Bad mutation</div>;
}
```

**Fix**: Metadata is for debugging only - use React state for dynamic values.

---

### ❌ DON'T: Ignore dev mode warnings

```typescript
// BAD: Warnings in console, but code shipped to production
function IgnoredWarningsComponent() {
  const { registerSubscription } = useComponentCleanup('IgnoredWarningsComponent');

  useEffect(() => {
    const timerId = setTimeout(() => {
      // This might take 10 seconds, but component unmounts after 2 seconds
      console.log('Long task');
    }, 10000);

    // Cleanup registered, but developer ignores warning in console
    registerSubscription({
      type: 'timer',
      createdAt: Date.now(),
      cleanupFn: () => clearTimeout(timerId),
    });
    // ⚠️ Warning appears in console on unmount
  }, [registerSubscription]);

  return <div>Check console for warnings</div>;
}
```

**Fix**: Treat dev warnings as errors - investigate and fix all warnings.

---

## Development Mode Warnings

The hook emits warnings in development mode when resources are not cleaned up properly.

### Warning Types

#### Uncleaned Subscription Warning

```
⚠️ Component MyComponent unmounted with active subscription: event
{
  id: "MyComponent-1234567890-abc123",
  createdAt: "2026-02-08T12:34:56.789Z",
  metadata: { event: "resize", target: "window" }
}
```

**What it means**: The component unmounted but the subscription cleanup function was not called before unmount. The hook will automatically cleanup, but this indicates a potential issue.

**Common causes**:
- Cleanup function registered too late
- Conditional effect that didn't run cleanup
- Early component unmount during async operation

**How to fix**: Ensure cleanup is registered immediately after subscription is created.

---

#### Undisposed Resource Warning

```
⚠️ Component CodeEditor unmounted with undisposed resource: monaco-editor
{
  id: "CodeEditor-1234567890-xyz789",
  createdAt: "2026-02-08T12:35:00.123Z",
  metadata: { container: "code-editor" }
}
```

**What it means**: An external resource was not explicitly disposed before unmount. The hook will call the disposal function, but the warning helps identify cleanup issues.

**Common causes**:
- Resource created but disposal not registered
- Async resource creation (resource not ready yet)
- Conditional resource creation

**How to fix**: Register resource disposal immediately after creation.

---

#### Cleanup Error

```
⚠️ Component MyComponent: Error during automatic cleanup of subscription abc123:
TypeError: Cannot read property 'removeEventListener' of null
```

**What it means**: The cleanup function threw an error during execution. This may indicate that the target object no longer exists or was already cleaned up.

**Common causes**:
- DOM element removed before cleanup
- Resource already disposed
- Null reference in cleanup function

**How to fix**: Add null checks in cleanup functions.

---

### Interpreting Warnings

**Workflow**:

1. Run application in development mode
2. Navigate to pages with components using cleanup hooks
3. Monitor browser console for warnings
4. For each warning:
   - Note the component name
   - Check the subscription/resource type
   - Review the metadata for context
   - Locate the component in codebase
   - Fix the cleanup issue

**Example workflow**:

```
# 1. Open browser console
# 2. Navigate to /generation page
# 3. Navigate away (unmount)
# 4. See warning:
⚠️ Component GenerationWorkspace unmounted with active subscription: websocket

# 5. Fix:
# - Open GenerationWorkspace.tsx
# - Find WebSocket creation
# - Add registerResource call
# - Test: navigate away again
# - Verify: warning is gone
```

---

## API Reference

### useComponentCleanup

```typescript
function useComponentCleanup(componentName: string): UseComponentCleanupResult
```

Hook for managing component lifecycle cleanup.

**Parameters**:

- `componentName` (string): Name of the component for debugging purposes. Should match the component's function name.

**Returns**: Object with registration and cleanup methods.

---

### registerSubscription

```typescript
function registerSubscription(
  subscription: Omit<Subscription, 'id' | 'cleaned'>
): string
```

Registers a subscription that requires cleanup on unmount.

**Parameters**:

```typescript
{
  type: SubscriptionType;        // 'event' | 'timer' | 'interval' | 'websocket' | 'query' | 'custom'
  createdAt: number;             // Date.now()
  cleanupFn: () => void;         // Function to cleanup subscription
  metadata?: Record<string, unknown>;  // Optional debugging metadata
}
```

**Returns**: Unique ID string for manual cleanup (if needed).

**Example**:

```typescript
const id = registerSubscription({
  type: 'event',
  createdAt: Date.now(),
  cleanupFn: () => window.removeEventListener('scroll', handleScroll),
  metadata: { event: 'scroll' },
});
```

---

### registerResource

```typescript
function registerResource(
  resource: Omit<ExternalResource, 'id' | 'disposed'>
): string
```

Registers an external resource that requires disposal on unmount.

**Parameters**:

```typescript
{
  type: 'websocket' | 'monaco-model' | 'monaco-editor' | 'custom';
  createdAt: number;             // Date.now()
  disposeFn: () => void;         // Function to dispose resource
  metadata?: Record<string, unknown>;  // Optional debugging metadata
}
```

**Returns**: Unique ID string for manual disposal (if needed).

**Example**:

```typescript
const id = registerResource({
  type: 'monaco-editor',
  createdAt: Date.now(),
  disposeFn: () => editor?.dispose(),
  metadata: { language: 'typescript' },
});
```

---

### cleanupSubscription

```typescript
function cleanupSubscription(id: string): void
```

Manually cleanup a subscription by ID. Calls the cleanup function and marks the subscription as cleaned.

**Parameters**:

- `id` (string): The unique ID returned by `registerSubscription`

**Use case**: Early cleanup before component unmount (e.g., user clicks "disconnect" button).

**Example**:

```typescript
const id = registerSubscription({...});

// Later: manually cleanup before unmount
const handleDisconnect = () => {
  cleanupSubscription(id);
};
```

---

### disposeResource

```typescript
function disposeResource(id: string): void
```

Manually dispose a resource by ID. Calls the dispose function and marks the resource as disposed.

**Parameters**:

- `id` (string): The unique ID returned by `registerResource`

**Use case**: Early disposal before component unmount (e.g., switching editor tabs).

**Example**:

```typescript
const id = registerResource({...});

// Later: manually dispose before unmount
const handleCloseEditor = () => {
  disposeResource(id);
};
```

---

### getActiveSubscriptions

```typescript
function getActiveSubscriptions(): Subscription[]
```

Returns all active (uncleaned) subscriptions.

**Returns**: Array of `Subscription` objects that have not been cleaned up yet.

**Use case**: Debugging, testing, or building custom cleanup logic.

**Example**:

```typescript
const active = getActiveSubscriptions();
console.log(`${active.length} subscriptions still active`);
```

---

### getUndisposedResources

```typescript
function getUndisposedResources(): ExternalResource[]
```

Returns all undisposed resources.

**Returns**: Array of `ExternalResource` objects that have not been disposed yet.

**Use case**: Debugging, testing, or building custom disposal logic.

**Example**:

```typescript
const undisposed = getUndisposedResources();
console.log(`${undisposed.length} resources not disposed`);
```

---

## Testing Cleanup Behavior

### Unit Testing with Jest/Vitest

```typescript
import { renderHook } from '@testing-library/react';
import { useComponentCleanup } from '@/hooks/useComponentCleanup';

describe('useComponentCleanup', () => {
  it('should cleanup subscriptions on unmount', () => {
    const cleanupFn = vi.fn();

    const { result, unmount } = renderHook(() =>
      useComponentCleanup('TestComponent')
    );

    // Register subscription
    result.current.registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn,
    });

    // Verify cleanup not called yet
    expect(cleanupFn).not.toHaveBeenCalled();

    // Unmount component
    unmount();

    // Verify cleanup was called
    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it('should track active subscriptions', () => {
    const { result } = renderHook(() => useComponentCleanup('TestComponent'));

    // Initially no subscriptions
    expect(result.current.getActiveSubscriptions()).toHaveLength(0);

    // Register subscription
    result.current.registerSubscription({
      type: 'timer',
      createdAt: Date.now(),
      cleanupFn: () => {},
    });

    // Verify subscription tracked
    expect(result.current.getActiveSubscriptions()).toHaveLength(1);
  });

  it('should manually cleanup subscription by ID', () => {
    const cleanupFn = vi.fn();

    const { result } = renderHook(() => useComponentCleanup('TestComponent'));

    const id = result.current.registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn,
    });

    // Manually cleanup
    result.current.cleanupSubscription(id);

    // Verify cleanup called
    expect(cleanupFn).toHaveBeenCalledTimes(1);

    // Verify no longer active
    expect(result.current.getActiveSubscriptions()).toHaveLength(0);
  });
});
```

---

### Integration Testing with Playwright

```typescript
import { test, expect } from '@playwright/test';

test.describe('Component Cleanup', () => {
  test('should not leak memory on navigation', async ({ page }) => {
    // Go to page with cleanup hooks
    await page.goto('/generation');

    // Capture initial memory
    const initialMemory = await page.evaluate(
      () => (performance as any).memory?.usedJSHeapSize || 0
    );

    // Navigate away and back 10 times
    for (let i = 0; i < 10; i++) {
      await page.goto('/dashboard');
      await page.goto('/generation');
    }

    // Wait for GC
    await page.waitForTimeout(2000);

    // Capture final memory
    const finalMemory = await page.evaluate(
      () => (performance as any).memory?.usedJSHeapSize || 0
    );

    // Calculate growth
    const growthPercent = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Assert reasonable growth (<20%)
    expect(growthPercent).toBeLessThan(20);
  });

  test('should cleanup event listeners', async ({ page }) => {
    await page.goto('/generation');

    // Check initial listener count
    const initialListeners = await page.evaluate(() => {
      return (window as any).getEventListeners?.(window).resize?.length || 0;
    });

    // Navigate away (should trigger cleanup)
    await page.goto('/dashboard');

    // Check final listener count
    const finalListeners = await page.evaluate(() => {
      return (window as any).getEventListeners?.(window).resize?.length || 0;
    });

    // Assert listeners were removed
    expect(finalListeners).toBeLessThanOrEqual(initialListeners);
  });
});
```

---

### Manual Testing Checklist

When manually testing cleanup behavior:

- [ ] Open browser console
- [ ] Enable "Preserve log" in console settings
- [ ] Navigate to page with cleanup hooks
- [ ] Check console for any warnings
- [ ] Navigate away from page
- [ ] Verify cleanup warnings (should see warnings if cleanup not registered)
- [ ] Fix any issues
- [ ] Navigate away again
- [ ] Verify no warnings (cleanup working correctly)
- [ ] Take heap snapshot before navigation
- [ ] Navigate 10 times back and forth
- [ ] Take heap snapshot after navigation
- [ ] Compare snapshots for memory growth

---

## Related Documentation

- [Memory Optimization Quickstart](../../../specs/020-memory-optimization/quickstart.md) - Complete memory optimization guide
- [Memory Monitoring Contracts](../../../specs/020-memory-optimization/contracts/memory-monitoring.ts) - TypeScript type definitions
- [Memory Snapshot API](./snapshot.ts) - Performance API utilities

---

## Support

If you encounter issues:

1. Check console for dev mode warnings
2. Review anti-patterns section above
3. Verify cleanup functions are registered before subscriptions
4. Test with heap snapshots in Chrome DevTools
5. Contact the frontend team if issues persist

---

**Last Updated**: 2026-02-08
**Feature**: 020-memory-optimization
**Phase**: 2 - Foundational
