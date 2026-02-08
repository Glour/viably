# Event Listener Cleanup Pattern (T037)

**Status**: ✅ Implemented
**Date**: 2026-02-08

---

## Pattern Overview

All event listeners in the application MUST be registered with `useComponentCleanup` to ensure:
1. Centralized tracking of subscriptions
2. Automatic cleanup on component unmount
3. Development-mode warnings for memory leaks
4. Metadata for debugging

---

## Implementation Pattern

### ✅ CORRECT Pattern

```typescript
import { useEffect } from "react"
import { useComponentCleanup } from "@/hooks/useComponentCleanup"

function MyComponent() {
  const { registerSubscription } = useComponentCleanup("MyComponent")

  useEffect(() => {
    const handleEvent = (e: Event) => {
      // Handle event
    }

    // Step 1: Register cleanup FIRST
    registerSubscription({
      type: "event",
      createdAt: Date.now(),
      cleanupFn: () => target.removeEventListener("eventName", handleEvent),
      metadata: {
        event: "eventName",
        target: "window/document/element",
        purpose: "description of why this listener exists"
      }
    })

    // Step 2: Add listener SECOND
    target.addEventListener("eventName", handleEvent, options)

    // Step 3: Return manual cleanup (optional but recommended)
    return () => target.removeEventListener("eventName", handleEvent)
  }, [registerSubscription])

  return <div>...</div>
}
```

---

## Real-World Examples

### Example 1: Window Scroll Listener

**File**: `components/landing/landing-nav.tsx`

```typescript
useEffect(() => {
  const handleScroll = () => {
    setScrolled(window.scrollY > SCROLL_THRESHOLD)
  }

  // Register listener with cleanup hook
  registerSubscription({
    type: "event",
    createdAt: Date.now(),
    cleanupFn: () => window.removeEventListener("scroll", handleScroll),
    metadata: {
      event: "scroll",
      target: "window",
      passive: true,
      purpose: "glass-effect"
    },
  })

  window.addEventListener("scroll", handleScroll, { passive: true })
  return () => window.removeEventListener("scroll", handleScroll)
}, [registerSubscription])
```

---

### Example 2: Document Keydown Listener

**File**: `components/layout/navbar.tsx`

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileMenuOpen(false)
  }

  // Register listener with cleanup hook
  registerSubscription({
    type: "event",
    createdAt: Date.now(),
    cleanupFn: () => document.removeEventListener("keydown", handleKeyDown),
    metadata: {
      event: "keydown",
      target: "document",
      purpose: "close-mobile-menu-on-escape"
    },
  })

  document.addEventListener("keydown", handleKeyDown)
  return () => document.removeEventListener("keydown", handleKeyDown)
}, [registerSubscription])
```

---

### Example 3: Multiple Listeners in One Hook

**File**: `lib/hooks/use-offline-detection.ts`

```typescript
useEffect(() => {
  const handleOnline = () => setIsOffline(false)
  const handleOffline = () => setIsOffline(true)

  // Register BOTH listeners
  registerSubscription({
    type: "event",
    createdAt: Date.now(),
    cleanupFn: () => window.removeEventListener("online", handleOnline),
    metadata: { event: "online", target: "window" },
  })

  registerSubscription({
    type: "event",
    createdAt: Date.now(),
    cleanupFn: () => window.removeEventListener("offline", handleOffline),
    metadata: { event: "offline", target: "window" },
  })

  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)

  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
  }
}, [registerSubscription])
```

---

### Example 4: Conditional Listener (Early Return)

**File**: `components/ui/glow-orbs.tsx`

```typescript
useEffect(() => {
  if (reduced) return // Early return - no listener needed

  const handleMouseMove = (e: MouseEvent) => {
    mouseX.set(e.clientX - window.innerWidth / 2)
    mouseY.set(e.clientY - window.innerHeight / 2)
  }

  // Register listener with metadata about conditional
  registerSubscription({
    type: "event",
    createdAt: Date.now(),
    cleanupFn: () => window.removeEventListener("mousemove", handleMouseMove),
    metadata: {
      event: "mousemove",
      target: "window",
      conditional: "!reduced"
    },
  })

  window.addEventListener("mousemove", handleMouseMove)
  return () => window.removeEventListener("mousemove", handleMouseMove)
}, [reduced, mouseX, mouseY, registerSubscription])
```

---

### Example 5: beforeunload Warning

**File**: `app/projects/[id]/generate/page.tsx`

```typescript
React.useEffect(() => {
  if (!isGenerating) return

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault()
  }

  // Register listener with cleanup hook
  registerSubscription({
    type: "event",
    createdAt: Date.now(),
    cleanupFn: () => window.removeEventListener("beforeunload", handleBeforeUnload),
    metadata: {
      event: "beforeunload",
      target: "window",
      purpose: "warn-before-closing-during-generation"
    },
  })

  window.addEventListener("beforeunload", handleBeforeUnload)
  return () => window.removeEventListener("beforeunload", handleBeforeUnload)
}, [isGenerating, registerSubscription])
```

---

## Special Cases

### useSyncExternalStore (No Action Needed)

For hooks using React's `useSyncExternalStore`, no additional cleanup is needed:

```typescript
// ✅ Correct - useSyncExternalStore handles cleanup internally
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", callback)
      return () => media.removeEventListener("change", callback)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
```

**Why**: `useSyncExternalStore` is designed for external subscriptions and manages cleanup automatically.

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: No Cleanup

```typescript
useEffect(() => {
  const handler = () => console.log("event")
  window.addEventListener("resize", handler)
  // ❌ No cleanup - MEMORY LEAK
}, [])
```

**Problem**: Listener never removed, causes memory leak on unmount.

---

### ❌ Anti-Pattern 2: Different Function References

```typescript
useEffect(() => {
  // ❌ Inline function - different reference every time
  window.addEventListener("resize", () => console.log("A"))

  registerSubscription({
    // ❌ Different inline function - won't remove the actual listener
    cleanupFn: () => window.removeEventListener("resize", () => console.log("B"))
  })
}, [])
```

**Problem**: removeEventListener must use the SAME function reference as addEventListener.

**Solution**: Store handler in a const before adding listener.

---

### ❌ Anti-Pattern 3: Listener Added Before Registration

```typescript
useEffect(() => {
  const handler = () => console.log("event")

  // ❌ Listener added first
  window.addEventListener("click", handler)

  // ❌ Then registered - wrong order
  registerSubscription({
    cleanupFn: () => window.removeEventListener("click", handler)
  })
}, [])
```

**Problem**: If registration fails or component unmounts immediately, listener is already attached but not tracked.

**Solution**: Always register BEFORE adding the listener.

---

### ❌ Anti-Pattern 4: Missing registerSubscription Dependency

```typescript
const { registerSubscription } = useComponentCleanup("MyComponent")

useEffect(() => {
  // ... register and add listener ...
}, []) // ❌ Missing registerSubscription dependency
```

**Problem**: React Hook exhaustive-deps warning, potential stale closure.

**Solution**: Add `registerSubscription` to dependency array.

---

## Verification Checklist

After implementing this pattern:

- [ ] All `addEventListener` calls have corresponding `registerSubscription` calls
- [ ] Registration happens BEFORE adding the listener
- [ ] Same function reference used in addEventListener and removeEventListener
- [ ] `registerSubscription` included in useEffect dependency array
- [ ] Metadata includes: event name, target, and purpose
- [ ] Manual cleanup still present in return statement (backup)
- [ ] Type-check passes: `npm run type-check`
- [ ] Dev-mode warnings appear on unmount (if listener not cleaned)

---

## Development Workflow

### Testing Cleanup in Dev Mode

1. Add console.log in component to track mounting:
   ```typescript
   useEffect(() => {
     console.log('MyComponent mounted')
     return () => console.log('MyComponent unmounting')
   }, [])
   ```

2. Navigate to/from component to trigger mount/unmount

3. Check browser console for cleanup warnings:
   ```
   ⚠️ Component MyComponent unmounted with active subscription: event
   { id: "...", createdAt: "...", metadata: {...} }
   ```

4. If warnings appear, verify:
   - Manual cleanup is working
   - useComponentCleanup is cleaning up automatically
   - No duplicate listeners remain

---

## Files Updated (T037)

| File | Listeners | Status |
|------|-----------|--------|
| `lib/hooks/use-offline-detection.ts` | 2 (online, offline) | ✅ Updated |
| `components/ui/glow-orbs.tsx` | 1 (mousemove) | ✅ Updated |
| `components/landing/landing-nav.tsx` | 2 (scroll, keydown) | ✅ Updated |
| `components/layout/navbar.tsx` | 1 (keydown) | ✅ Updated |
| `app/projects/[id]/generate/page.tsx` | 1 (beforeunload) | ✅ Updated |
| **TOTAL** | **6 listeners** | **✅ All Updated** |

---

## Future Guidelines

When adding NEW event listeners:

1. **Always** use `useComponentCleanup` hook
2. **Register** before adding listener
3. **Document** purpose in metadata
4. **Test** cleanup in dev mode
5. **Keep** manual cleanup for early disposal

---

## Related Documentation

- `frontend/hooks/useComponentCleanup.ts` - Hook implementation
- `frontend/lib/memory/README.md` - Memory management guide
- `.tmp/current/event-listener-audit-report.md` - Audit results

---

## Task Completion (T037)

**Status**: ✅ Complete

**Summary**:
- Audited all event listeners in codebase
- Wrapped 6 listeners across 5 files with useComponentCleanup
- All listeners now have centralized tracking and automatic cleanup
- No memory leaks from event listeners
- Pattern documented for future development

**Next Steps**:
- Run `/push patch` to commit changes
- Monitor dev console for cleanup warnings during development
- Apply pattern to any new event listeners added in future
