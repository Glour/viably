# Timer Hooks Documentation

## Overview

Safe wrappers for `setTimeout` and `setInterval` with automatic cleanup via `useComponentCleanup`. These hooks prevent memory leaks from forgotten `clearInterval`/`clearTimeout` calls.

## Files Created

- `/frontend/hooks/useInterval.ts` - Auto-cleanup interval hook
- `/frontend/hooks/useTimeout.ts` - Auto-cleanup timeout hook with manual clear
- `/frontend/hooks/__tests__/useInterval.test.tsx` - Comprehensive tests
- `/frontend/hooks/__tests__/useTimeout.test.tsx` - Comprehensive tests
- `/frontend/hooks/__examples__/timer-hooks-example.tsx` - Real-world examples

---

## useInterval

### API

```typescript
useInterval(callback: () => void, delay: number | null): void
```

### Parameters

- **callback**: Function to execute on each interval tick
- **delay**: Delay in milliseconds, or `null` to pause

### Features

- ✅ Automatic cleanup on unmount
- ✅ Pause/resume by setting `delay = null`
- ✅ No stale closures (always uses latest callback)
- ✅ Restarts interval when delay changes
- ✅ Dev-mode warnings for invalid delays
- ✅ Integrated with `useComponentCleanup` for tracking

### Usage Examples

#### Basic Countdown Timer

```tsx
function CountdownTimer() {
  const [count, setCount] = useState(10);

  useInterval(() => {
    setCount((c) => c - 1);
  }, count > 0 ? 1000 : null); // Auto-pause at 0

  return <div>{count}</div>;
}
```

#### Real-Time Clock

```tsx
function Clock() {
  const [time, setTime] = useState(new Date());

  useInterval(() => {
    setTime(new Date());
  }, 1000);

  return <div>{time.toLocaleTimeString()}</div>;
}
```

#### Auto-Save with Conditional Interval

```tsx
function AutoSaveEditor() {
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Only auto-save when there are changes
  useInterval(
    () => {
      saveContent(content);
      setIsDirty(false);
    },
    isDirty ? 30000 : null // Save every 30s if dirty
  );

  return (
    <textarea
      value={content}
      onChange={(e) => {
        setContent(e.target.value);
        setIsDirty(true);
      }}
    />
  );
}
```

#### Dynamic Polling

```tsx
function DataFetcher() {
  const [pollInterval, setPollInterval] = useState<number | null>(5000);

  useInterval(
    () => {
      fetchLatestData();
    },
    pollInterval
  );

  return (
    <div>
      <button onClick={() => setPollInterval(1000)}>Poll Fast</button>
      <button onClick={() => setPollInterval(5000)}>Poll Slow</button>
      <button onClick={() => setPollInterval(null)}>Stop</button>
    </div>
  );
}
```

---

## useTimeout

### API

```typescript
useTimeout(callback: () => void, delay: number): { clear: () => void }
```

### Parameters

- **callback**: Function to execute after delay
- **delay**: Delay in milliseconds

### Returns

- **clear**: Function to manually cancel the timeout

### Features

- ✅ Automatic cleanup on unmount
- ✅ Manual `clear()` for early cancellation
- ✅ No stale closures (always uses latest callback)
- ✅ Restarts timeout when delay changes
- ✅ Dev-mode warnings for invalid delays
- ✅ Integrated with `useComponentCleanup` for tracking

### Usage Examples

#### Delayed Message Display

```tsx
function DelayedMessage() {
  const [visible, setVisible] = useState(false);

  const { clear } = useTimeout(() => {
    setVisible(true);
  }, 3000);

  return (
    <div>
      {visible && <p>Message appeared after 3s!</p>}
      <button onClick={clear}>Cancel</button>
    </div>
  );
}
```

#### Auto-Dismiss Toast Notification

```tsx
function Toast({ message, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  const { clear } = useTimeout(() => {
    setIsVisible(false);
  }, duration);

  const dismissNow = () => {
    setIsVisible(false);
    clear(); // Cancel auto-dismiss
  };

  if (!isVisible) return null;

  return (
    <div className="toast">
      {message}
      <button onClick={dismissNow}>Dismiss</button>
    </div>
  );
}
```

#### Delayed Search (Alternative to useDebounce)

```tsx
function SearchInput() {
  const [query, setQuery] = useState('');

  const { clear } = useTimeout(() => {
    performSearch(query);
  }, 500);

  const handleChange = (value: string) => {
    setQuery(value);
    clear(); // Cancel previous timeout
  };

  return <input value={query} onChange={(e) => handleChange(e.target.value)} />;
}
```

---

## Memory Management

Both hooks integrate with `useComponentCleanup` for automatic tracking:

### Subscription Tracking

```typescript
// useInterval registers with type: 'interval'
{
  type: 'interval',
  createdAt: Date.now(),
  cleanupFn: () => clearInterval(intervalId),
  metadata: { delay, intervalId }
}

// useTimeout registers with type: 'timer'
{
  type: 'timer',
  createdAt: Date.now(),
  cleanupFn: () => clearTimeout(timeoutId),
  metadata: { delay, timeoutId }
}
```

### Dev Mode Warnings

In development, you'll see warnings if:
- Interval/timeout is still active on unmount
- Invalid delay values are provided (negative numbers)

Example warning:
```
⚠️ Component MyComponent unmounted with active subscription: interval
{
  id: "MyComponent-1234567890-abc123",
  createdAt: "2024-01-01T12:00:00.000Z",
  metadata: { delay: 1000, intervalId: "123" }
}
```

---

## Best Practices

### ✅ DO

```tsx
// Use delay=null to pause interval
useInterval(callback, isActive ? 1000 : null);

// Clear timeouts manually when needed
const { clear } = useTimeout(callback, 1000);
// Later: clear();

// Update callbacks without restarting timers
const handleTick = useCallback(() => {
  // Latest logic here
}, [dependencies]);
useInterval(handleTick, 1000);
```

### ❌ DON'T

```tsx
// Don't use native setInterval (no auto-cleanup)
useEffect(() => {
  const id = setInterval(callback, 1000);
  // Easy to forget: return () => clearInterval(id);
}, []);

// Don't try to pause by unmounting/remounting
{isActive && <ComponentWithInterval />}
// Instead: useInterval(callback, isActive ? 1000 : null)

// Don't create interval inside callback (infinite loop)
useInterval(() => {
  useInterval(anotherCallback, 500); // ERROR!
}, 1000);
```

---

## Testing

Both hooks are fully tested. See test files for examples:

- `/frontend/hooks/__tests__/useInterval.test.tsx`
- `/frontend/hooks/__tests__/useTimeout.test.tsx`

### Key Test Scenarios

- ✅ Execute callback at correct intervals
- ✅ Pause/resume functionality
- ✅ Update callback without restarting
- ✅ Automatic cleanup on unmount
- ✅ Manual clear() cancellation
- ✅ Invalid delay handling
- ✅ Zero delay edge cases

---

## Performance Considerations

### useInterval

- **No re-renders**: Hook doesn't cause component re-renders
- **Callback updates**: Changing callback doesn't restart interval (uses ref)
- **Delay changes**: Changing delay DOES restart interval (by design)

### useTimeout

- **No re-renders**: Hook doesn't cause component re-renders
- **Callback updates**: Changing callback doesn't restart timeout (uses ref)
- **Delay changes**: Changing delay DOES restart timeout (by design)

### Memory Impact

Both hooks have minimal memory overhead:
- Single ref for callback
- Single ref for timer ID
- Single subscription registration in `useComponentCleanup`

---

## Migration Guide

### From Native setInterval

```tsx
// Before
useEffect(() => {
  const id = setInterval(() => {
    doSomething();
  }, 1000);

  return () => clearInterval(id);
}, []);

// After
useInterval(() => {
  doSomething();
}, 1000);
```

### From Native setTimeout

```tsx
// Before
useEffect(() => {
  const id = setTimeout(() => {
    doSomething();
  }, 3000);

  return () => clearTimeout(id);
}, []);

// After
useTimeout(() => {
  doSomething();
}, 3000);
```

---

## Related Hooks

- **useComponentCleanup**: Base hook for subscription tracking
- **useDebounce**: For debouncing values (different use case)
- **useMemoryMonitor**: For monitoring memory usage

---

## Implementation Details

### Why useRef for Callbacks?

Both hooks store callbacks in refs to avoid restarting timers on every render:

```typescript
const savedCallback = useRef<() => void>(callback);

useEffect(() => {
  savedCallback.current = callback;
}, [callback]);

useEffect(() => {
  const id = setInterval(() => {
    savedCallback.current(); // Always latest callback
  }, delay);
  // ...
}, [delay]); // Only restart when delay changes
```

### Why Separate Cleanup Effects?

Each hook has two effects:
1. **Callback ref update**: Updates on every callback change (no cleanup)
2. **Timer setup**: Only runs when delay changes (includes cleanup)

This separation ensures optimal performance and prevents unnecessary timer restarts.

---

## Troubleshooting

### Interval Not Firing

**Problem**: Interval doesn't execute
```tsx
useInterval(callback, isPaused ? null : 1000);
```

**Solution**: Check if `delay` is `null` (paused state)

### Timeout Fires Multiple Times

**Problem**: Timeout executes more than once
```tsx
useEffect(() => {
  useTimeout(callback, 1000); // Creates new timeout on every render!
}, [dependency]);
```

**Solution**: Move `useTimeout` to component body, not inside `useEffect`
```tsx
useTimeout(callback, 1000); // Correct
```

### Stale Closure in Callback

**Problem**: Callback uses old state/props
```tsx
const [count, setCount] = useState(0);
useInterval(() => {
  console.log(count); // Always logs 0
}, 1000);
```

**Solution**: Use setState callback form
```tsx
useInterval(() => {
  setCount(c => c + 1); // Always correct
}, 1000);
```

---

## TypeScript Types

### useInterval

```typescript
function useInterval(
  callback: () => void,
  delay: number | null
): void;
```

### useTimeout

```typescript
interface UseTimeoutResult {
  clear: () => void;
}

function useTimeout(
  callback: () => void,
  delay: number
): UseTimeoutResult;
```

---

## Examples

See `/frontend/hooks/__examples__/timer-hooks-example.tsx` for 6 real-world examples:

1. **Countdown Timer** - Auto-pause at zero
2. **Auto-Save Editor** - Conditional interval based on dirty state
3. **Toast Notification** - Auto-dismiss with manual clear
4. **Real-Time Clock** - Simple interval usage
5. **Delayed Search** - Alternative to useDebounce
6. **Dynamic Polling** - Interval speed control

Run the examples to see the hooks in action!
