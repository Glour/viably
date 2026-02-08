# T038: Enhanced Dev Mode Warnings for Uncleaned Event Listeners

**Status**: ✅ Completed
**Date**: 2026-02-08
**Feature**: 020-memory-optimization
**Related Tasks**: T032 (WebSocket validation)

---

## Overview

Enhanced the `useComponentCleanup` hook to provide specific, actionable warnings for uncleaned event listeners in development mode. These warnings include the event type (click, scroll, resize, etc.), target element, and fix recommendations with working code examples.

---

## Implementation Summary

### Files Modified

1. **`/home/alex/PycharmProjects/viably/frontend/hooks/useComponentCleanup.ts`**
   - Added enhanced event listener warning logic in unmount cleanup effect
   - Extracts event type and target from metadata
   - Uses `console.group()` for better organization
   - Provides contextual fix recommendations with code examples
   - Falls back to standard warnings for non-event subscriptions

2. **`/home/alex/PycharmProjects/viably/frontend/lib/memory/README.md`**
   - Added new "Enhanced Event Listener Warning" section
   - Documented warning format and content
   - Added examples of common event types
   - Explained key improvements over standard warnings

3. **`/home/alex/PycharmProjects/viably/frontend/hooks/__tests__/useComponentCleanup.event-warnings.test.ts`** (NEW)
   - Comprehensive test suite for event listener warnings
   - Tests for various event types (resize, click, scroll, keydown)
   - Tests for different targets (window, document, element)
   - Tests for missing metadata handling
   - Tests for production mode (no warnings)
   - Tests for multiple event listeners

---

## Warning Format

### Enhanced Event Listener Warning

When an event listener is not cleaned up before unmount, the hook now emits:

```
⚠️ Memory Leak Warning: Uncleaned Event Listener in ComponentName
  Event listener was not cleaned up before unmount
  Details: {
    id: "ComponentName-1234567890-abc123",
    eventType: "resize",
    target: "window",
    element: "button#submit",  // Optional, if provided
    registeredAt: "2026-02-08T12:34:56.789Z",
    metadata: { event: "resize", target: "window" }
  }

  💡 How to fix:
  1. Ensure registerSubscription is called BEFORE addEventListener
  2. Use the same function reference for add and remove
  3. Example:

  const { registerSubscription } = useComponentCleanup('ComponentName');

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

### Key Features

1. **Event Type Detection**: Automatically extracts event type from metadata (resize, click, scroll, keydown, etc.)
2. **Target Identification**: Shows whether the listener is on window, document, or a specific element
3. **Element Details**: Optionally includes element selector if provided in metadata
4. **Timestamp**: Shows when the subscription was registered
5. **Fix Recommendations**: Provides numbered steps to fix the issue
6. **Code Example**: Includes working code with the correct event type and target
7. **Grouped Output**: Uses console.group() for better organization in DevTools

---

## Example Scenarios

### Scenario 1: Window Resize Listener

**Code with issue**:
```typescript
useEffect(() => {
  const handleResize = () => console.log('resized');
  window.addEventListener('resize', handleResize);
  // Missing cleanup
}, []);
```

**Warning emitted**:
```
⚠️ Memory Leak Warning: Uncleaned Event Listener in MyComponent
  eventType: "resize"
  target: "window"
```

**Recommended fix** (shown in console):
```typescript
registerSubscription({
  type: 'event',
  createdAt: Date.now(),
  cleanupFn: () => window.removeEventListener('resize', handleResize),
  metadata: { event: 'resize', target: 'window' }
});
```

---

### Scenario 2: Document Keyboard Listener

**Code with issue**:
```typescript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      // handle escape
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  // Missing cleanup
}, []);
```

**Warning emitted**:
```
⚠️ Memory Leak Warning: Uncleaned Event Listener in MyComponent
  eventType: "keydown"
  target: "document"
```

**Recommended fix** (shown in console):
```typescript
registerSubscription({
  type: 'event',
  createdAt: Date.now(),
  cleanupFn: () => document.removeEventListener('keydown', handleKeyDown),
  metadata: { event: 'keydown', target: 'document' }
});
```

---

### Scenario 3: Element Click Listener

**Code with issue**:
```typescript
useEffect(() => {
  const button = buttonRef.current;
  if (!button) return;

  const handleClick = () => console.log('clicked');
  button.addEventListener('click', handleClick);
  // Missing cleanup
}, []);
```

**Warning emitted**:
```
⚠️ Memory Leak Warning: Uncleaned Event Listener in MyComponent
  eventType: "click"
  target: "element"
  element: "button#submit"
```

**Recommended fix** (shown in console):
```typescript
registerSubscription({
  type: 'event',
  createdAt: Date.now(),
  cleanupFn: () => button.removeEventListener('click', handleClick),
  metadata: { event: 'click', target: 'element', element: 'button#submit' }
});
```

---

## Testing

### Test Coverage

The test suite validates:

1. ✅ Enhanced warnings are emitted for event listeners
2. ✅ Event type is extracted and displayed correctly
3. ✅ Target is extracted and displayed correctly
4. ✅ Element metadata is included when provided
5. ✅ Fix recommendations are displayed
6. ✅ Code examples include correct event type and target
7. ✅ Unknown event type/target handled gracefully
8. ✅ Standard warnings used for non-event subscriptions
9. ✅ No warnings in production mode
10. ✅ Multiple event listeners emit separate warnings

### Running Tests

```bash
cd frontend
npm test -- hooks/__tests__/useComponentCleanup.event-warnings.test.ts
```

---

## Benefits

### For Developers

1. **Faster Debugging**: Immediately see which event listener is leaking
2. **Actionable Guidance**: Get specific steps to fix the issue
3. **Copy-Paste Examples**: Working code examples with correct event type/target
4. **Better Organization**: Grouped console output is easier to read
5. **Pattern Learning**: Developers learn the correct pattern from the examples

### For Code Quality

1. **Prevents Memory Leaks**: Catches event listeners that weren't cleaned up
2. **Enforces Best Practices**: Encourages registering cleanup before adding listeners
3. **Consistent Patterns**: All event listeners follow the same cleanup pattern
4. **Early Detection**: Issues found during development, not production

---

## Integration with Existing Features

### T032: WebSocket Validation

The event listener warnings work alongside WebSocket-specific warnings:

```typescript
// WebSocket warning (T032)
if (isUncloseWebSocket) {
  // ... WebSocket-specific warning
}
// Event listener warning (T038)
else if (subscription.type === 'event') {
  // ... Enhanced event listener warning
}
// Standard warning (fallback)
else {
  // ... Standard subscription warning
}
```

### Memory Optimization (020)

The enhanced warnings are part of the broader memory optimization feature:

- **T032**: WebSocket cleanup validation
- **T038**: Event listener warnings (this task)
- **Future**: Timer/interval warnings, resource disposal warnings

---

## Limitations

1. **Requires Metadata**: Event type and target must be provided in metadata
2. **Dev Mode Only**: Warnings only appear in development mode
3. **Manual Registration**: Developers must manually register subscriptions
4. **No Auto-Detection**: Cannot automatically detect addEventListener calls

---

## Future Enhancements

1. **Timer Warnings**: Similar enhanced warnings for setTimeout/setInterval
2. **Interval Warnings**: Specific warnings for setInterval with recommended patterns
3. **Query Warnings**: React Query subscription cleanup guidance
4. **Auto-Detection**: Babel plugin to auto-inject cleanup registration (advanced)

---

## Documentation

### Updated Files

- ✅ `/frontend/lib/memory/README.md` - Added "Enhanced Event Listener Warning" section
- ✅ `/frontend/hooks/useComponentCleanup.ts` - Enhanced JSDoc comments
- ✅ `/frontend/hooks/__tests__/useComponentCleanup.event-warnings.test.ts` - Comprehensive test suite

### Usage Examples

The README.md includes updated examples for:
- Window event listeners (resize, scroll)
- Document event listeners (keydown, keyup)
- Element event listeners (click, focus, blur)
- Multiple event listeners in one component

---

## Checklist

- [x] Implement enhanced event listener warnings
- [x] Extract event type from metadata
- [x] Extract target from metadata
- [x] Include element metadata when provided
- [x] Provide fix recommendations
- [x] Generate contextual code examples
- [x] Use console.group() for better organization
- [x] Handle missing metadata gracefully
- [x] Maintain backward compatibility with standard warnings
- [x] Add comprehensive test coverage
- [x] Update documentation with examples
- [x] Verify TypeScript compilation
- [x] Test in development mode
- [x] Verify no warnings in production mode

---

## Deployment

### Rollout Steps

1. ✅ Merge changes to main branch
2. ⏳ Deploy to development environment
3. ⏳ Monitor console output during manual testing
4. ⏳ Verify warnings appear for uncleaned event listeners
5. ⏳ Verify fix recommendations are helpful
6. ⏳ Deploy to production (warnings are dev-only)

### Monitoring

- Monitor console output in development builds
- Track occurrences of event listener warnings
- Identify components that frequently trigger warnings
- Prioritize fixing components with most warnings

---

## Related Documentation

- [Memory Optimization Quickstart](/specs/020-memory-optimization/quickstart.md)
- [useComponentCleanup Hook](/frontend/hooks/useComponentCleanup.ts)
- [Memory Management Utilities](/frontend/lib/memory/README.md)
- [Component Lifecycle Tracking](/specs/020-memory-optimization/contracts/memory-monitoring.ts)

---

**Last Updated**: 2026-02-08
**Reviewed By**: Task T038 Implementation
**Status**: Ready for Review
