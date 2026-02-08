# Memory Leak Prevention Tests

This directory contains stress tests for verifying memory leak prevention across critical components.

## Overview

Memory leak tests ensure that components using `useComponentCleanup` properly clean up resources during mount/unmount cycles. Each component is tested with **1000 mount/unmount cycles** to verify memory stability.

## Test Files

- **`component-lifecycle.spec.ts`** - Main stress test suite for all critical components

## Running Tests

### Quick Start
```bash
# Run all memory tests
npm run test:e2e:memory

# Run with UI (interactive)
npm run test:e2e:ui e2e/memory

# Run with headed browser (watch visually)
npm run test:e2e:memory:headed

# Run with debugger
npm run test:e2e:memory:debug
```

### Run Verification Script
```bash
# Automated verification with report
./scripts/verify-memory-tests.sh
```

### Run Single Component Test
```bash
# Test only DailyBonus component
npm run test:e2e -- e2e/memory/component-lifecycle.spec.ts -g "DailyBonus"
```

## Components Tested

| Component | Cleanup Items | Cycles | Status |
|-----------|---------------|--------|--------|
| **DailyBonus** | Timers (claim animation) | 1000 | ✅ |
| **ConfigForm** | Event listeners | 1000 | ✅ |
| **DeployModal** | Resources, timers, confetti | 1000 | ✅ |
| **TemplateCard** | Hover effects, image loading | 1000 | ✅ |
| **ProjectCard** | Hover effects, action menu | 1000 | ✅ |
| **CodeViewer** | Monaco Editor, scroll listeners | 1000 | ✅ |
| **SettingsSidebar** | Navigation, resize listeners | 1000 | ✅ |
| **ThemeToggle** | Theme change listeners | 1000 | ✅ |
| **WelcomeCard** | Animation timers | 1000 | ✅ |
| **QuickActions** | Button interactions | 1000 | ✅ |

## Test Methodology

### 1. Baseline Measurement
- Force garbage collection
- Measure initial memory (`performance.memory.usedJSHeapSize`)

### 2. Stress Testing
- Perform 1000 mount/unmount cycles
- Log progress every 100 cycles

### 3. Final Measurement
- Force garbage collection
- Measure final memory
- Calculate memory growth ratio

### 4. Validation
- Memory growth < 1.5x baseline (50% increase)
- No console warnings about uncleaned subscriptions
- No WebSocket, event listener, or timer leaks

## Pass Criteria

✅ **Pass** if:
- Memory growth < 50% (1.5x baseline)
- No console warnings
- Test completes without timeout
- No browser performance degradation

❌ **Fail** if:
- Memory growth > 50%
- Console warnings about uncleaned resources
- Test timeout or crashes
- Browser becomes unresponsive

## Debugging Failed Tests

If a test fails:

### 1. Check Console Warnings
Look for warnings from `useComponentCleanup`:
```
⚠️ Component DailyBonus unmounted with active subscription: timer
⚠️ WEBSOCKET LEAK: Component unmounted with UNCLOSED WebSocket connection!
⚠️ Memory Leak Warning: Uncleaned Event Listener in ConfigForm
```

### 2. Verify Cleanup Registration Order
Ensure subscriptions are registered **BEFORE** creating resources:
```typescript
// ✅ CORRECT
const id = registerSubscription({ cleanupFn: () => cleanup() })
const resource = createResource()

// ❌ INCORRECT
const resource = createResource()
const id = registerSubscription({ cleanupFn: () => cleanup() })
```

### 3. Check Cleanup Function Logic
Ensure cleanup function properly disposes resources:
```typescript
// ✅ CORRECT: Check state before cleanup
cleanupFn: () => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.close()
  }
}

// ❌ INCORRECT: No state check
cleanupFn: () => ws.close() // May fail if already closed
```

### 4. Use Chrome DevTools
Run with headed browser and use Memory Profiler:
```bash
npm run test:e2e:memory:headed
# Open DevTools → Memory → Take Heap Snapshot
```

## CI/CD Integration

Memory tests are integrated into the CI/CD pipeline:

```yaml
# .github/workflows/memory-tests.yml
name: Memory Leak Tests
on:
  pull_request:
    paths:
      - 'frontend/components/**'
      - 'frontend/hooks/**'
jobs:
  memory-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm install
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e:memory
```

## Related Documentation

- **Cleanup Hook**: `hooks/useComponentCleanup.ts`
- **Memory Types**: `lib/memory/types.ts`
- **Unit Tests**: `hooks/__tests__/useComponentCleanup.*.test.ts`
- **Test Results**: `.tmp/current/memory-lifecycle-test-results.md`
- **Task T039**: Mount/unmount stress test
- **Task T032**: WebSocket leak detection
- **Task T038**: Enhanced event listener warnings

## Best Practices

1. **Always use useComponentCleanup** for components that create:
   - Timers or intervals
   - Event listeners
   - WebSocket connections
   - Heavy resources (Monaco Editor, canvas, etc.)

2. **Register cleanup BEFORE creating resource**
   ```typescript
   const id = registerSubscription({ cleanupFn })
   const resource = createResource()
   ```

3. **Test new components** with stress test when adding subscriptions:
   ```bash
   npm run test:e2e -- e2e/memory/component-lifecycle.spec.ts -g "NewComponent"
   ```

4. **Monitor production memory** with Sentry:
   ```typescript
   Sentry.setMeasurement("memory.used", performance.memory.usedJSHeapSize / 1024 / 1024)
   ```

## Summary

Memory leak prevention is critical for long-running applications. These stress tests verify that all critical components properly clean up resources using `useComponentCleanup`, ensuring stable memory usage over time.

**Status**: ✅ All components verified
**Last Updated**: 2026-02-08
