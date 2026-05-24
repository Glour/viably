# Component Cleanup Patterns

Comprehensive guide for implementing memory-safe component cleanup in the Viably frontend application.

## Table of Contents

- [Overview](#overview)
- [Quick Reference](#quick-reference)
- [Core Patterns](#core-patterns)
  - [Event Listener Cleanup](#event-listener-cleanup)
  - [Timer Cleanup](#timer-cleanup)
  - [Interval Cleanup](#interval-cleanup)
  - [WebSocket Cleanup](#websocket-cleanup)
  - [External Resource Cleanup](#external-resource-cleanup)
- [Specialized Hooks](#specialized-hooks)
  - [useInterval](#useinterval)
  - [useTimeout](#usetimeout)
  - [useMonacoEditor](#usemonacoeditor)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Development Mode Warnings](#development-mode-warnings)
- [Troubleshooting](#troubleshooting)
- [Testing Cleanup](#testing-cleanup)

---

## Overview

**Purpose**: Prevent memory leaks by ensuring all component subscriptions, event listeners, timers, and external resources are properly cleaned up on unmount.

**Key utilities**:
- `useComponentCleanup` - Core hook for tracking and cleaning up resources
- `useInterval` - Safe wrapper for setInterval
- `useTimeout` - Safe wrapper for setTimeout
- `useMonacoEditor` - Monaco Editor with automatic cleanup

**Benefits**:
- ✅ Automatic cleanup on component unmount
- ✅ Development-mode warnings for uncleaned resources
- ✅ Manual cleanup methods for advanced use cases
- ✅ Full TypeScript support
- ✅ Zero runtime cost in production

---

## Quick Reference

### Basic Pattern

```typescript
import { useComponentCleanup } from '@/hooks/useComponentCleanup';

function MyComponent() {
  const { registerSubscription } = useComponentCleanup('MyComponent');

  useEffect(() => {
    const handler = () => { /* ... */ };

    // 1. Register cleanup FIRST
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handler),
      metadata: { event: 'resize', target: 'window' }
    });

    // 2. Add listener SECOND
    window.addEventListener('resize', handler);

    // 3. No need to return cleanup - hook handles it
  }, [registerSubscription]);

  return <div>Component content</div>;
}
```

### When to Use

| Scenario | Solution |
|----------|----------|
| Window/document events | `useComponentCleanup` with `registerSubscription` |
| Element events (with refs) | `useComponentCleanup` with `registerSubscription` |
| setTimeout | `useTimeout` hook |
| setInterval | `useInterval` hook |
| WebSocket connections | `useComponentCleanup` with `registerResource` |
| Monaco Editor | `useMonacoEditor` hook |
| Other external libs | `useComponentCleanup` with `registerResource` |

---

## Core Patterns

### Event Listener Cleanup

#### Window Events

```typescript
function WindowEventComponent() {
  const { registerSubscription } = useComponentCleanup('WindowEventComponent');

  useEffect(() => {
    const handleResize = () => {
      console.log('Window resized:', window.innerWidth);
    };

    // Register cleanup BEFORE adding listener
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleResize),
      metadata: { event: 'resize', target: 'window' }
    });

    window.addEventListener('resize', handleResize);
  }, [registerSubscription]);

  return <div>Resize the window</div>;
}
```

#### Document Events

```typescript
function KeyboardShortcuts() {
  const { registerSubscription } = useComponentCleanup('KeyboardShortcuts');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('Escape pressed');
      }
    };

    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => document.removeEventListener('keydown', handleKeyDown),
      metadata: { event: 'keydown', target: 'document' }
    });

    document.addEventListener('keydown', handleKeyDown);
  }, [registerSubscription]);

  return <div>Press Escape</div>;
}
```

#### Multiple Event Listeners

**Real-world example from `use-offline-detection.ts`:**

```typescript
function useOfflineDetection(): boolean {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof window !== "undefined" ? !navigator.onLine : false
  );
  const { registerSubscription } = useComponentCleanup("useOfflineDetection");

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Register both listeners with cleanup hook
    registerSubscription({
      type: "event",
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener("online", handleOnline),
      metadata: { event: "online", target: "window" },
    });

    registerSubscription({
      type: "event",
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener("offline", handleOffline),
      metadata: { event: "offline", target: "window" },
    });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [registerSubscription]);

  return isOffline;
}
```

**Key points**:
- Register both subscriptions before adding listeners
- Return cleanup function for immediate unmount scenarios
- Hook will also cleanup automatically on unmount

#### Element Events (with refs)

```typescript
function ButtonComponent() {
  const { registerSubscription } = useComponentCleanup('ButtonComponent');
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
      metadata: { event: 'click', element: 'button' }
    });

    button.addEventListener('click', handleClick);
  }, [registerSubscription]);

  return <button ref={buttonRef}>Click me</button>;
}
```

---

### Timer Cleanup

#### Using useTimeout Hook (Recommended)

```typescript
import { useTimeout } from '@/hooks/useTimeout';

function DelayedNotification() {
  const [show, setShow] = useState(false);

  const { clear } = useTimeout(() => {
    setShow(true);
  }, 3000);

  return (
    <div>
      {show && <p>Notification appeared!</p>}
      <button onClick={clear}>Cancel</button>
    </div>
  );
}
```

**Features**:
- Automatic cleanup on unmount
- Manual `clear()` method for early cancellation
- No need to track timeout IDs

#### Manual Timer Cleanup

```typescript
function ManualTimerComponent() {
  const { registerSubscription } = useComponentCleanup('ManualTimerComponent');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setShow(true);
    }, 5000);

    registerSubscription({
      type: 'timer',
      createdAt: Date.now(),
      cleanupFn: () => clearTimeout(timerId),
      metadata: { delay: 5000, action: 'show notification' }
    });
  }, [registerSubscription]);

  return show ? <div>Notification</div> : null;
}
```

---

### Interval Cleanup

#### Using useInterval Hook (Recommended)

```typescript
import { useInterval } from '@/hooks/useInterval';

function LiveClock() {
  const [time, setTime] = useState(new Date());

  // Auto-cleanup on unmount
  useInterval(() => {
    setTime(new Date());
  }, 1000);

  return <div>{time.toLocaleTimeString()}</div>;
}
```

**Features**:
- Automatic cleanup on unmount
- Pause/resume via `delay = null`
- Latest callback reference (no stale closures)

#### Conditional Intervals

```typescript
function Countdown() {
  const [count, setCount] = useState(10);

  // Pauses when count reaches 0
  useInterval(() => {
    setCount((c) => c - 1);
  }, count > 0 ? 1000 : null);

  return <div>{count > 0 ? count : 'Done!'}</div>;
}
```

#### Manual Interval Cleanup

```typescript
function ManualIntervalComponent() {
  const { registerSubscription } = useComponentCleanup('ManualIntervalComponent');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    registerSubscription({
      type: 'interval',
      createdAt: Date.now(),
      cleanupFn: () => clearInterval(intervalId),
      metadata: { interval: 1000, purpose: 'clock update' }
    });
  }, [registerSubscription]);

  return <div>{time.toLocaleTimeString()}</div>;
}
```

---

### WebSocket Cleanup

#### Basic WebSocket Pattern

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
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      },
      metadata: { url, readyState: ws.readyState }
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

#### WebSocket with Manual Control

**Real-world example from `use-generation.ts`:**

```typescript
export function useGeneration(projectId: string) {
  const { registerResource, disposeResource } = useComponentCleanup('useGeneration');
  const didUnmount = useRef(false);

  // Register WebSocket lifecycle with useComponentCleanup for tracking
  useEffect(() => {
    // Register WebSocket connection as external resource
    const resourceId = registerResource({
      type: 'websocket',
      createdAt: Date.now(),
      disposeFn: () => {
        // This runs on unmount to ensure WebSocket is tracked
        console.log('WebSocket lifecycle disposed');
      },
      metadata: {
        projectId,
        url: wsUrl,
      },
    });

    return () => {
      didUnmount.current = true;
      disposeResource(resourceId);
    };
  }, [registerResource, disposeResource, projectId]);

  // ... WebSocket connection logic ...
}
```

#### react-use-websocket Integration

```typescript
import useWebSocket from 'react-use-websocket';

function ReconnectingWebSocket() {
  const { registerResource } = useComponentCleanup('ReconnectingWebSocket');
  const didUnmount = useRef(false);

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    'ws://localhost:8000',
    {
      shouldReconnect: () => !didUnmount.current,
      reconnectAttempts: 5,
      reconnectInterval: 3000,
    }
  );

  useEffect(() => {
    const resourceId = registerResource({
      type: 'websocket',
      createdAt: Date.now(),
      disposeFn: () => {
        console.log('WebSocket disposed');
      },
      metadata: { library: 'react-use-websocket' }
    });

    return () => {
      didUnmount.current = true;
      disposeResource(resourceId);
    };
  }, [registerResource, disposeResource]);

  return <div>WebSocket status: {readyState}</div>;
}
```

**Key points**:
- Use `didUnmount` ref to prevent reconnection after unmount
- Register resource for tracking even when using libraries
- Set `shouldReconnect: () => !didUnmount.current`

---

### External Resource Cleanup

#### Monaco Editor (Using Hook)

**Recommended approach:**

```typescript
import { useMonacoEditor } from '@/hooks/useMonacoEditor';

function CodeEditor({ initialCode }: { initialCode: string }) {
  const { containerRef, isReady, getValue, setValue } = useMonacoEditor({
    value: initialCode,
    language: 'typescript',
    theme: 'vs-dark',
    options: {
      readOnly: false,
      minimap: { enabled: false },
    }
  });

  return <div ref={containerRef} style={{ height: '600px' }} />;
}
```

**Features**:
- Automatic editor and model disposal
- Proper URI management (no collisions)
- Integrated with `useComponentCleanup`

#### Monaco Editor (Manual)

```typescript
import { loader } from '@monaco-editor/react';

function ManualCodeEditor({ initialCode }: { initialCode: string }) {
  const { registerResource } = useComponentCleanup('ManualCodeEditor');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let editor: any;
    let model: any;

    loader.init().then((monaco) => {
      // Create model
      const uri = monaco.Uri.parse(`inmemory://model-${Date.now()}.tsx`);
      model = monaco.editor.createModel(initialCode, 'typescript', uri);

      // Register model cleanup
      registerResource({
        type: 'monaco-model',
        createdAt: Date.now(),
        disposeFn: () => model?.dispose(),
        metadata: { uri: uri.toString() }
      });

      // Create editor
      editor = monaco.editor.create(containerRef.current!, {
        model,
        theme: 'vs-dark',
        automaticLayout: true,
      });

      // Register editor cleanup
      registerResource({
        type: 'monaco-editor',
        createdAt: Date.now(),
        disposeFn: () => editor?.dispose(),
        metadata: { container: 'code-editor' }
      });
    });
  }, [initialCode, registerResource]);

  return <div ref={containerRef} style={{ height: '600px' }} />;
}
```

#### Custom Library Cleanup

```typescript
import SomeLibrary from 'some-library';

function CustomLibraryComponent() {
  const { registerResource } = useComponentCleanup('CustomLibraryComponent');
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    // Initialize library
    const instance = new SomeLibrary({
      option1: 'value1',
      option2: 'value2',
    });
    instanceRef.current = instance;

    // Register cleanup
    registerResource({
      type: 'custom',
      createdAt: Date.now(),
      disposeFn: () => {
        instance.destroy(); // or cleanup(), dispose(), close()
      },
      metadata: { library: 'SomeLibrary' }
    });

    // Use the instance
    instance.doSomething();
  }, [registerResource]);

  return <div>Using custom library</div>;
}
```

---

## Specialized Hooks

### useInterval

**Location**: `frontend/hooks/useInterval.ts`

**Purpose**: Safe wrapper for `setInterval` with automatic cleanup on unmount.

**API**:

```typescript
useInterval(
  callback: () => void,
  delay: number | null
): void
```

**Features**:
- Automatic cleanup via `useComponentCleanup`
- Pause/resume via `delay = null`
- Latest callback reference (no stale closures)
- Dev-mode warnings for uncleaned intervals

**Example**:

```typescript
function CountdownTimer() {
  const [count, setCount] = useState(10);

  useInterval(() => {
    setCount((c) => c - 1);
  }, count > 0 ? 1000 : null); // Pauses when count reaches 0

  return <div>{count}</div>;
}
```

**When to use**:
- Polling (e.g., check server status every 5s)
- Animations (e.g., progress bar updates)
- Auto-save (e.g., save draft every 30s)
- Live updates (e.g., clock, timer, countdown)

---

### useTimeout

**Location**: `frontend/hooks/useTimeout.ts`

**Purpose**: Safe wrapper for `setTimeout` with automatic cleanup on unmount.

**API**:

```typescript
useTimeout(
  callback: () => void,
  delay: number
): { clear: () => void }
```

**Features**:
- Automatic cleanup via `useComponentCleanup`
- Manual `clear()` method for early cancellation
- Latest callback reference (no stale closures)
- Dev-mode warnings for uncleaned timeouts

**Example**:

```typescript
function DelayedMessage() {
  const [visible, setVisible] = useState(false);

  const { clear } = useTimeout(() => {
    setVisible(true);
  }, 3000);

  return (
    <div>
      {visible && <p>Message appeared!</p>}
      <button onClick={clear}>Cancel</button>
    </div>
  );
}
```

**When to use**:
- Delayed actions (e.g., show notification after 3s)
- Debouncing (prefer `use-debounce` hook for this)
- Auto-hide (e.g., toast notifications)
- Retry logic (e.g., retry failed request after 5s)

---

### useMonacoEditor

**Location**: `frontend/hooks/useMonacoEditor.ts`

**Purpose**: Monaco Editor integration with automatic memory management.

**API**:

```typescript
useMonacoEditor(
  options: UseMonacoEditorOptions
): UseMonacoEditorResult

interface UseMonacoEditorOptions {
  value: string;
  language: string;
  theme?: string;
  options?: Monaco.editor.IStandaloneEditorConstructionOptions;
}

interface UseMonacoEditorResult {
  editor: Monaco.editor.IStandaloneCodeEditor | null;
  model: Monaco.editor.ITextModel | null;
  containerRef: React.RefObject<HTMLDivElement>;
  isReady: boolean;
  getValue: () => string;
  setValue: (value: string) => void;
}
```

**Features**:
- Automatic editor and model disposal on unmount
- Proper URI management (no collisions)
- Integrated with `useComponentCleanup`
- Only recreates editor on language or theme changes

**Example**:

```typescript
function CodeEditor({ code }: { code: string }) {
  const { containerRef, isReady, getValue, setValue } = useMonacoEditor({
    value: code,
    language: 'typescript',
    theme: 'vs-dark',
    options: {
      readOnly: false,
      minimap: { enabled: false },
      fontSize: 14,
    }
  });

  const handleSave = () => {
    const currentCode = getValue();
    console.log('Saving code:', currentCode);
  };

  return (
    <div>
      <div ref={containerRef} style={{ height: '600px' }} />
      <button onClick={handleSave} disabled={!isReady}>
        Save Code
      </button>
    </div>
  );
}
```

**Critical for preventing leaks**:
- Editor instances must call `dispose()` when no longer needed
- Text models must call `dispose()` to free up memory and URI
- Models with the same URI should be reused, not recreated

---

## Anti-Patterns to Avoid

### ❌ DON'T: Forget to register cleanup

```typescript
// BAD: Event listener never removed
function BadComponent() {
  useEffect(() => {
    const handleResize = () => console.log('Resized');
    window.addEventListener('resize', handleResize);
    // ❌ No cleanup - memory leak!
  }, []);

  return <div>Bad example</div>;
}
```

**Fix**: Always register cleanup functions.

```typescript
// GOOD
function GoodComponent() {
  const { registerSubscription } = useComponentCleanup('GoodComponent');

  useEffect(() => {
    const handleResize = () => console.log('Resized');

    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleResize),
    });

    window.addEventListener('resize', handleResize);
  }, [registerSubscription]);

  return <div>Good example</div>;
}
```

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

```typescript
// GOOD
function GoodOrderComponent() {
  const { registerSubscription } = useComponentCleanup('GoodOrderComponent');

  useEffect(() => {
    const handleClick = () => console.log('Clicked');

    // ✅ Cleanup registered first
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('click', handleClick),
    });

    // ✅ Listener added second
    window.addEventListener('click', handleClick);
  }, [registerSubscription]);

  return <div>Good order</div>;
}
```

---

### ❌ DON'T: Use different function references

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

```typescript
// GOOD
function GoodReferenceComponent() {
  const { registerSubscription } = useComponentCleanup('GoodReferenceComponent');

  useEffect(() => {
    const handleResize = () => console.log('A');

    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleResize),
    });

    window.addEventListener('resize', handleResize);
  }, [registerSubscription]);

  return <div>Good reference</div>;
}
```

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

```typescript
// GOOD
function GoodMonacoComponent() {
  const { registerResource } = useComponentCleanup('GoodMonacoComponent');

  useEffect(() => {
    const editor = monaco.editor.create(document.getElementById('container')!, {
      value: 'console.log("Hello")',
      language: 'javascript',
    });

    registerResource({
      type: 'monaco-editor',
      createdAt: Date.now(),
      disposeFn: () => editor?.dispose(),
    });
  }, [registerResource]);

  return <div id="container" />;
}
```

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

```typescript
// GOOD
function GoodMutationComponent() {
  const { registerSubscription } = useComponentCleanup('GoodMutationComponent');
  const [count, setCount] = useState(0);

  useEffect(() => {
    registerSubscription({
      type: 'interval',
      createdAt: Date.now(),
      cleanupFn: () => clearInterval(intervalId),
      metadata: { purpose: 'counter' }, // Static metadata
    });

    const intervalId = setInterval(() => {
      setCount((c) => c + 1); // ✅ Use React state
    }, 1000);
  }, [registerSubscription]);

  return <div>Count: {count}</div>;
}
```

---

### ❌ DON'T: Ignore dev mode warnings

```typescript
// BAD: Warnings in console, but code shipped to production
function IgnoredWarningsComponent() {
  const { registerSubscription } = useComponentCleanup('IgnoredWarningsComponent');

  useEffect(() => {
    const timerId = setTimeout(() => {
      console.log('Long task');
    }, 10000);

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

The `useComponentCleanup` hook emits warnings in development mode when resources are not cleaned up properly.

### Enhanced Event Listener Warning (T038)

```
⚠️ Memory Leak Warning: Uncleaned Event Listener in MyComponent
  Event listener was not cleaned up before unmount
  Details: {
    id: "MyComponent-1234567890-abc123",
    eventType: "resize",
    target: "window",
    registeredAt: "2026-02-08T12:34:56.789Z"
  }

  💡 How to fix:
  1. Ensure registerSubscription is called BEFORE addEventListener
  2. Use the same function reference for add and remove
  3. Example:

  const { registerSubscription } = useComponentCleanup('MyComponent');

  useEffect(() => {
    const handleEvent = (e) => { /* handler */ };

    // Register cleanup FIRST
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleEvent),
      metadata: { event: 'resize', target: 'window' }
    });

    // Then add listener
    window.addEventListener('resize', handleEvent);
  }, [registerSubscription]);
```

**What it means**: An event listener was registered but not cleaned up before component unmount.

**Common causes**:
- Cleanup function registered too late (after addEventListener)
- Different function references used for add and remove
- Conditional effect that didn't run cleanup
- Early component unmount during async operation

---

### WebSocket Leak Warning (T032)

```
⚠️ WEBSOCKET LEAK: Component MyComponent unmounted with UNCLOSED WebSocket connection!
{
  id: "MyComponent-1234567890-abc123",
  url: "ws://localhost:8000",
  readyState: 1,
  readyStateLabel: "OPEN",
  createdAt: "2026-02-08T12:34:56.789Z",
  recommendation: "WebSocket connections should be closed in cleanup function or useEffect return."
}
```

**What it means**: A WebSocket connection was not closed before component unmount.

**Common causes**:
- WebSocket created but `ws.close()` not called in cleanup
- Async WebSocket creation (not registered yet)
- Missing `didUnmount` ref to prevent reconnection

**How to fix**:
1. Always call `ws.close()` in cleanup function
2. Check `readyState` before closing
3. Use `didUnmount` ref to prevent reconnection after unmount

---

### Uncleaned Subscription Warning

```
⚠️ Component MyComponent unmounted with active subscription: timer
{
  id: "MyComponent-1234567890-abc123",
  createdAt: "2026-02-08T12:34:56.789Z",
  metadata: { delay: 5000 }
}
```

**What it means**: A non-event subscription (timer, interval, query, custom) was not cleaned up before unmount.

---

### Undisposed Resource Warning

```
⚠️ Component CodeEditor unmounted with undisposed resource: monaco-editor
{
  id: "CodeEditor-1234567890-xyz789",
  createdAt: "2026-02-08T12:35:00.123Z",
  metadata: { container: "code-editor" }
}
```

**What it means**: An external resource was not explicitly disposed before unmount.

---

## Troubleshooting

### Issue: Event listener not removed

**Symptoms**:
- Warning in console: "Uncleaned Event Listener"
- Event handler continues to fire after unmount
- Memory usage grows with each component mount/unmount

**Diagnosis**:
1. Check console for warning with event type and target
2. Verify function references match in add and remove
3. Confirm `registerSubscription` is called BEFORE `addEventListener`

**Solution**:
```typescript
const { registerSubscription } = useComponentCleanup('MyComponent');

useEffect(() => {
  const handler = () => { /* ... */ };

  // Register FIRST
  registerSubscription({
    type: 'event',
    createdAt: Date.now(),
    cleanupFn: () => window.removeEventListener('resize', handler),
  });

  // Add listener SECOND
  window.addEventListener('resize', handler);
}, [registerSubscription]);
```

---

### Issue: Timer/interval continues after unmount

**Symptoms**:
- Warning in console: "Uncleaned subscription: timer"
- State updates on unmounted component
- Error: "Can't perform a React state update on an unmounted component"

**Diagnosis**:
1. Check console for timer/interval warning
2. Verify `clearTimeout` or `clearInterval` is registered
3. Confirm cleanup runs on unmount

**Solution (option 1 - use hook)**:
```typescript
import { useTimeout } from '@/hooks/useTimeout';

const { clear } = useTimeout(() => {
  setState(newValue);
}, 5000);
```

**Solution (option 2 - manual)**:
```typescript
const { registerSubscription } = useComponentCleanup('MyComponent');

useEffect(() => {
  const timerId = setTimeout(() => {
    setState(newValue);
  }, 5000);

  registerSubscription({
    type: 'timer',
    createdAt: Date.now(),
    cleanupFn: () => clearTimeout(timerId),
  });
}, [registerSubscription]);
```

---

### Issue: WebSocket reconnects after unmount

**Symptoms**:
- Warning in console: "WEBSOCKET LEAK: UNCLOSED WebSocket"
- WebSocket continues reconnecting after navigation
- Multiple concurrent WebSocket connections

**Diagnosis**:
1. Check console for WebSocket warning with readyState
2. Verify `ws.close()` is called in cleanup
3. Check `shouldReconnect` logic (if using library)

**Solution**:
```typescript
const { registerResource } = useComponentCleanup('MyComponent');
const didUnmount = useRef(false);

const { sendMessage } = useWebSocket(url, {
  shouldReconnect: () => !didUnmount.current, // Prevent reconnect after unmount
});

useEffect(() => {
  const resourceId = registerResource({
    type: 'websocket',
    createdAt: Date.now(),
    disposeFn: () => {
      console.log('WebSocket disposed');
    },
  });

  return () => {
    didUnmount.current = true;
    disposeResource(resourceId);
  };
}, [registerResource, disposeResource]);
```

---

### Issue: Monaco Editor not disposed

**Symptoms**:
- Warning in console: "Undisposed resource: monaco-editor"
- Memory grows significantly when navigating between editor pages
- Multiple editor instances visible in heap snapshot

**Diagnosis**:
1. Check console for monaco-editor or monaco-model warning
2. Take heap snapshot and search for "StandaloneCodeEditor"
3. Verify dispose is called on editor and model

**Solution (option 1 - use hook)**:
```typescript
import { useMonacoEditor } from '@/hooks/useMonacoEditor';

const { containerRef } = useMonacoEditor({
  value: code,
  language: 'typescript',
  theme: 'vs-dark',
});

return <div ref={containerRef} style={{ height: '600px' }} />;
```

**Solution (option 2 - manual)**:
```typescript
const { registerResource } = useComponentCleanup('MyComponent');

useEffect(() => {
  loader.init().then((monaco) => {
    const model = monaco.editor.createModel(code, 'typescript');
    const editor = monaco.editor.create(containerRef.current!, { model });

    registerResource({
      type: 'monaco-model',
      createdAt: Date.now(),
      disposeFn: () => model?.dispose(),
    });

    registerResource({
      type: 'monaco-editor',
      createdAt: Date.now(),
      disposeFn: () => editor?.dispose(),
    });
  });
}, [registerResource]);
```

---

### Issue: Warning shows but cleanup is registered

**Symptoms**:
- Warning in console despite having cleanup code
- Cleanup function seems correct
- Issue is intermittent

**Diagnosis**:
1. Check order: cleanup must be registered BEFORE subscription
2. Verify function references match
3. Check for conditional effects

**Solution**:
```typescript
// ❌ BAD: Listener added first
window.addEventListener('resize', handler);
registerSubscription({ cleanupFn: () => window.removeEventListener('resize', handler) });

// ✅ GOOD: Cleanup registered first
registerSubscription({ cleanupFn: () => window.removeEventListener('resize', handler) });
window.addEventListener('resize', handler);
```

---

## Testing Cleanup

### Unit Testing

```typescript
import { renderHook } from '@testing-library/react';
import { useComponentCleanup } from '@/hooks/useComponentCleanup';

describe('Component cleanup', () => {
  it('should cleanup subscriptions on unmount', () => {
    const cleanupFn = vi.fn();

    const { result, unmount } = renderHook(() =>
      useComponentCleanup('TestComponent')
    );

    result.current.registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn,
    });

    expect(cleanupFn).not.toHaveBeenCalled();

    unmount();

    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing

```typescript
import { test, expect } from '@playwright/test';

test('should cleanup on navigation', async ({ page }) => {
  await page.goto('/generation');

  const initialListeners = await page.evaluate(() => {
    return (window as any).getEventListeners?.(window).resize?.length || 0;
  });

  await page.goto('/dashboard');

  const finalListeners = await page.evaluate(() => {
    return (window as any).getEventListeners?.(window).resize?.length || 0;
  });

  expect(finalListeners).toBeLessThanOrEqual(initialListeners);
});
```

### Manual Testing Checklist

- [ ] Open browser console
- [ ] Enable "Preserve log"
- [ ] Navigate to page with cleanup hooks
- [ ] Navigate away
- [ ] Verify no warnings in console
- [ ] Take heap snapshot before navigation
- [ ] Navigate 10 times back and forth
- [ ] Take heap snapshot after
- [ ] Compare snapshots (memory growth < 20%)

---

## Related Documentation

- [Memory Management Utilities](./README.md) - Complete memory optimization guide
- [Memory Monitoring Types](./types.ts) - TypeScript type definitions
- [Memory Snapshot API](./snapshot.ts) - Performance API utilities
- [Lifecycle Tracker](./lifecycle-tracker.ts) - Component lifecycle monitoring

---

## Quick Checklist

When adding cleanup to a component:

- [ ] Import `useComponentCleanup` from `@/hooks/useComponentCleanup`
- [ ] Call hook with component name: `useComponentCleanup('MyComponent')`
- [ ] Register cleanup BEFORE adding subscription
- [ ] Use same function reference for add and remove
- [ ] Include metadata for debugging (event type, target, etc.)
- [ ] Test in dev mode and verify no warnings
- [ ] For timers/intervals: consider using `useTimeout`/`useInterval` hooks
- [ ] For Monaco Editor: consider using `useMonacoEditor` hook
- [ ] For WebSocket: use `didUnmount` ref to prevent reconnection

---

**Last Updated**: 2026-02-08
**Feature**: 020-memory-optimization
**Task**: T041
