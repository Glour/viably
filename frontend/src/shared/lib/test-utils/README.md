# Test Utilities

Performance testing utilities for virtualized lists in the Viably frontend.

## Overview

This directory contains tools for measuring and analyzing performance of React components with large datasets (500+ items). Specifically designed for testing virtualized lists using TanStack Virtual.

## Files

### `performance.ts`

Performance measurement and reporting utilities.

**Classes:**
- `FPSMonitor` - Real-time frames-per-second tracking
- `MemoryMonitor` - JavaScript heap memory usage tracking (Chrome only)
- `ScrollPerformanceTester` - Automated scroll performance testing

**Functions:**
- `generatePerformanceReport()` - Create structured performance report
- `formatPerformanceReport()` - Format report as markdown
- `downloadPerformanceReport()` - Trigger browser download
- `getBrowserInfo()` - Detect browser and version

**Example:**
```typescript
import { ScrollPerformanceTester, generatePerformanceReport } from '@/lib/test-utils/performance'

const tester = new ScrollPerformanceTester()
const metrics = await tester.test(containerRef.current, {
  duration: 5000,      // 5 second test
  scrollSpeed: 10,     // 10px per frame
})

const report = generatePerformanceReport('my-test', metrics, {
  minFPS: 30,          // Minimum acceptable FPS
  maxMemoryDelta: 100, // Maximum memory growth in MB
})

console.log(report.passed) // true/false
console.log(`Average FPS: ${report.metrics.avgFps}`)
console.log(`Memory Delta: ${report.metrics.memoryDelta} MB`)
```

### `mock-data.ts`

Test data generators for creating large datasets.

**Functions:**
- `generateMockTemplates(count)` - Generate N template items
- `generateMockProjects(count)` - Generate N project items
- `seedTemplatesStore(count)` - Generate and persist templates
- `seedProjectsStore(count)` - Generate and persist projects
- `clearMockData()` - Clear all test data

**Example:**
```typescript
import { generateMockTemplates, seedTemplatesStore } from '@/lib/test-utils/mock-data'

// Generate in-memory data
const templates = generateMockTemplates(500)

// Generate and persist to sessionStorage
const persistedTemplates = seedTemplatesStore(500)

// Clean up
clearMockData()
```

## Usage

### Interactive Testing

Visit the test page: `http://localhost:3000/dev/performance`

Features:
- Select test type (templates/projects)
- Choose item count (100-2000)
- Configure test duration and scroll speed
- Run tests and view results
- Download performance reports

### Programmatic Testing

```typescript
import { useRef } from 'react'
import { ScrollPerformanceTester } from '@/lib/test-utils/performance'
import { generateMockTemplates } from '@/lib/test-utils/mock-data'

function MyPerformanceTest() {
  const containerRef = useRef<HTMLDivElement>(null)
  const tester = useRef(new ScrollPerformanceTester())

  const runTest = async () => {
    const metrics = await tester.current.test(containerRef.current!, {
      duration: 5000,
      scrollSpeed: 10,
    })

    console.log('Test complete:', metrics)
    return metrics
  }

  return (
    <div ref={containerRef} className="h-screen overflow-auto">
      {/* Your virtualized list */}
    </div>
  )
}
```

### CLI Testing

```bash
# Interactive menu
./scripts/test-performance.sh

# CI mode (type check only)
./scripts/test-performance.sh --ci
```

## Performance Targets

### Required (Test Pass Criteria)

- **Average FPS:** ≥30
- **Minimum FPS:** ≥30
- **Memory Delta:** ≤100 MB

### Aspirational

- **Average FPS:** ≥50 (excellent), ≥40 (good)
- **Memory Delta:** ≤50 MB (ideal)

## Browser Support

| Browser | FPS Tracking | Memory Tracking | Notes |
|---------|--------------|-----------------|-------|
| Chrome | ✅ | ✅ | Full support |
| Firefox | ✅ | ❌ | No memory API |
| Safari | ✅ | ❌ | No memory API |
| Edge | ✅ | ✅ | Chromium-based |

## Performance Analysis

### Interpreting Results

**Excellent (50+ FPS):**
- No optimization needed
- Virtualization working perfectly
- GPU acceleration active

**Good (40-49 FPS):**
- Acceptable performance
- Consider minor optimizations
- Monitor on slower devices

**Acceptable (30-39 FPS):**
- Meets minimum requirements
- May feel slightly sluggish
- Optimize if possible

**Poor (<30 FPS):**
- Fails performance target
- Requires optimization
- User experience degraded

### Common Issues

**Low FPS:**
- Too many DOM nodes rendered (increase virtualization ratio)
- Heavy component rendering (use React.memo)
- Expensive CSS (reduce shadows, gradients)
- Layout thrashing (avoid reading then writing layout)

**High Memory:**
- Memory leaks (check cleanup in useEffect)
- Images not garbage collected (use proper lazy loading)
- Event listeners not removed (ensure cleanup)
- Data stored in closures (avoid capturing large objects)

## See Also

- [Performance Test Guide](../../../.tmp/current/performance-test-guide.md) - Full documentation
- [TanStack Virtual Docs](https://tanstack.com/virtual/latest) - Virtualization library
- [Test Page](/dev/performance) - Interactive testing UI

## Changelog

### 2024-02-08
- Initial release
- FPS monitoring with requestAnimationFrame
- Memory tracking with Chrome API
- Automated scroll testing
- Test data generators
- Interactive UI component
- Comprehensive documentation
