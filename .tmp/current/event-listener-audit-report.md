# Event Listener Audit Report (T037)

**Date**: 2026-02-08
**Status**: ✅ All listeners have cleanup, now wrapping with useComponentCleanup for tracking

---

## Executive Summary

- **Total Event Listeners Found**: 9 instances across 7 files
- **Already Have Cleanup**: 9/9 (100%)
- **Need useComponentCleanup Registration**: 5 files (excluding useSyncExternalStore hooks)
- **Memory Leak Risk**: ❌ None currently, but no centralized tracking

---

## Detailed Findings

### Category A: useSyncExternalStore Hooks (No Action Needed)

These hooks use React's built-in `useSyncExternalStore` which handles cleanup automatically:

| File | Lines | Event | Status |
|------|-------|-------|--------|
| `hooks/use-media-query.ts` | 7-10 | `matchMedia.change` | ✅ Native cleanup |
| `hooks/use-reduced-motion.ts` | 5-9 | `matchMedia.change` | ✅ Native cleanup |

**Reason**: `useSyncExternalStore` is designed for this exact use case and handles cleanup internally.

---

### Category B: Custom useEffect Hooks (Need useComponentCleanup)

These hooks use custom `useEffect` cleanup:

#### 1. **lib/hooks/use-offline-detection.ts**

```typescript
// Lines 21-32
useEffect(() => {
  const handleOnline = () => setIsOffline(false)
  const handleOffline = () => setIsOffline(true)

  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)

  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
  }
}, [])
```

**Status**: ✅ Has cleanup, ⚠️ Not tracked
**Action**: Wrap with useComponentCleanup registration

---

#### 2. **components/ui/glow-orbs.tsx**

```typescript
// Lines 23-31
useEffect(() => {
  if (reduced) return
  const handleMouseMove = (e: MouseEvent) => {
    mouseX.set(e.clientX - window.innerWidth / 2)
    mouseY.set(e.clientY - window.innerHeight / 2)
  }
  window.addEventListener("mousemove", handleMouseMove)
  return () => window.removeEventListener("mousemove", handleMouseMove)
}, [reduced, mouseX, mouseY])
```

**Status**: ✅ Has cleanup, ⚠️ Not tracked
**Action**: Wrap with useComponentCleanup registration

---

#### 3. **components/landing/landing-nav.tsx**

```typescript
// Lines 26-34 (scroll listener)
useEffect(() => {
  const handleScroll = () => {
    setScrolled(window.scrollY > SCROLL_THRESHOLD)
  }
  handleScroll()
  window.addEventListener("scroll", handleScroll, { passive: true })
  return () => window.removeEventListener("scroll", handleScroll)
}, [])

// Lines 37-43 (keydown listener)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileMenuOpen(false)
  }
  document.addEventListener("keydown", handleKeyDown)
  return () => document.removeEventListener("keydown", handleKeyDown)
}, [])
```

**Status**: ✅ Has cleanup, ⚠️ Not tracked
**Count**: 2 listeners
**Action**: Wrap both with useComponentCleanup registration

---

#### 4. **components/layout/navbar.tsx**

```typescript
// Lines 34-40 (keydown listener)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileMenuOpen(false)
  }
  document.addEventListener("keydown", handleKeyDown)
  return () => document.removeEventListener("keydown", handleKeyDown)
}, [])
```

**Status**: ✅ Has cleanup, ⚠️ Not tracked
**Action**: Wrap with useComponentCleanup registration

---

#### 5. **app/projects/[id]/generate/page.tsx**

```typescript
// Lines 96-105 (beforeunload listener)
React.useEffect(() => {
  if (!isGenerating) return

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault()
  }

  window.addEventListener("beforeunload", handleBeforeUnload)
  return () => window.removeEventListener("beforeunload", handleBeforeUnload)
}, [isGenerating])
```

**Status**: ✅ Has cleanup, ⚠️ Not tracked
**Action**: Wrap with useComponentCleanup registration

---

## Implementation Plan

### Phase 1: Update Components with useComponentCleanup

For each file in Category B:

1. Import `useComponentCleanup` hook
2. Call hook at component level: `const { registerSubscription } = useComponentCleanup('ComponentName')`
3. Register listener BEFORE adding it:
   ```typescript
   registerSubscription({
     type: 'event',
     createdAt: Date.now(),
     cleanupFn: () => target.removeEventListener(event, handler),
     metadata: { event: 'eventName' }
   })

   target.addEventListener(event, handler)
   ```
4. Keep existing cleanup return (useComponentCleanup provides backup)

### Phase 2: Verification

1. Run type-check: `cd frontend && npm run type-check`
2. Test each component in dev mode
3. Check console for dev-mode warnings on unmount
4. Verify no duplicate listeners (using Chrome DevTools → Event Listeners)

---

## Benefits of useComponentCleanup

1. **Centralized Tracking**: All listeners tracked in one place
2. **Dev Warnings**: Automatic warnings for uncleaned listeners on unmount
3. **Debugging**: Easy to see which component has which listeners
4. **Backup Cleanup**: If manual cleanup fails, hook provides backup
5. **Metadata**: Can track when listener was created, what it does

---

## Pattern Documentation

### ✅ CORRECT Pattern (After T037)

```typescript
function MyComponent() {
  const { registerSubscription } = useComponentCleanup('MyComponent')

  useEffect(() => {
    const handleResize = () => console.log('resized')

    // Register FIRST
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleResize),
      metadata: { event: 'resize', target: 'window' }
    })

    // Add listener SECOND
    window.addEventListener('resize', handleResize)

    // Optional: Keep manual cleanup for early disposal
    return () => window.removeEventListener('resize', handleResize)
  }, [registerSubscription])

  return <div>...</div>
}
```

### ❌ INCORRECT Patterns

**Pattern 1: No tracking at all**
```typescript
useEffect(() => {
  const handler = () => {}
  window.addEventListener('resize', handler)
  // ❌ No cleanup, no tracking - memory leak
}, [])
```

**Pattern 2: Cleanup but no tracking**
```typescript
useEffect(() => {
  const handler = () => {}
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
  // ✅ Has cleanup, ❌ Not tracked - no dev warnings
}, [])
```

**Pattern 3: Different function references**
```typescript
useEffect(() => {
  window.addEventListener('resize', () => console.log('A'))

  registerSubscription({
    cleanupFn: () => window.removeEventListener('resize', () => console.log('B'))
    // ❌ Different function - won't remove the actual listener
  })
}, [])
```

---

## Files to Update

1. `/home/alex/PycharmProjects/viably/frontend/lib/hooks/use-offline-detection.ts` (1 listener)
2. `/home/alex/PycharmProjects/viably/frontend/components/ui/glow-orbs.tsx` (1 listener)
3. `/home/alex/PycharmProjects/viably/frontend/components/landing/landing-nav.tsx` (2 listeners)
4. `/home/alex/PycharmProjects/viably/frontend/components/layout/navbar.tsx` (1 listener)
5. `/home/alex/PycharmProjects/viably/frontend/app/projects/[id]/generate/page.tsx` (1 listener)

**Total**: 5 files, 6 event listeners

---

## Next Steps

1. ✅ Create audit report (this document)
2. ⏳ Update each file with useComponentCleanup
3. ⏳ Run type-check verification
4. ⏳ Test in development mode
5. ⏳ Document pattern in README
6. ⏳ Commit changes with `/push patch`

---

## References

- useComponentCleanup implementation: `frontend/hooks/useComponentCleanup.ts`
- Pattern guide: `frontend/lib/memory/README.md`
- Task: T037 (Wrap all addEventListener with useComponentCleanup)
