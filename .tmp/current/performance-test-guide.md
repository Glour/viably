# Virtualization Performance Testing Guide

## Overview

This guide documents the performance testing infrastructure for virtualized lists in the Viably frontend application. Tests verify that template galleries and project lists maintain >30 FPS with 500+ items.

## Testing Infrastructure

### Core Utilities

**Location:** `/frontend/lib/test-utils/`

1. **performance.ts** - Performance measurement tools
   - `FPSMonitor` - Real-time FPS tracking
   - `MemoryMonitor` - Memory usage tracking (Chrome only)
   - `ScrollPerformanceTester` - Automated scroll tests
   - `generatePerformanceReport()` - Report generation
   - `formatPerformanceReport()` - Markdown export
   - `getBrowserInfo()` - Browser detection

2. **mock-data.ts** - Test data generators
   - `generateMockTemplates(count)` - Generate template test data
   - `generateMockProjects(count)` - Generate project test data
   - `seedTemplatesStore(count)` - Persist templates to sessionStorage
   - `seedProjectsStore(count)` - Persist projects to sessionStorage
   - `clearMockData()` - Clean up test data

### Interactive Tester

**Location:** `/frontend/components/dev/performance-tester.tsx`

**Test Page:** `/dev/performance`

Interactive UI for running performance tests with configurable parameters:
- Test type selection (templates, projects-grid, projects-list)
- Item count (100, 250, 500, 1000, 2000)
- Test duration (3s, 5s, 10s, 15s)
- Scroll speed (5, 10, 20, 30 px/frame)

## Performance Targets

### FPS Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Average FPS | ≥50 | ✅ Excellent |
| Average FPS | ≥30 | ✓ Acceptable |
| Minimum FPS | ≥30 | Required |
| Maximum FPS | ~60 | Expected |

### Memory Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Memory Delta | ≤100 MB | Required |
| Memory Delta | ≤50 MB | Ideal |

### Rendering Metrics

| Metric | Expected |
|--------|----------|
| Items Rendered | 5-20 (visible + overscan) |
| Total Items | 500+ |
| Virtualization Ratio | >95% |

## Test Scenarios

### 1. Baseline Test (100 items)

**Purpose:** Verify basic functionality and establish performance baseline

**Expected Results:**
- Average FPS: 60
- Minimum FPS: 60
- Memory Delta: <20 MB

**Command:**
```bash
# Access: http://localhost:3000/dev/performance
# Config: 100 items, 5s duration, normal scroll
```

### 2. Medium Load Test (250 items)

**Purpose:** Test typical production load

**Expected Results:**
- Average FPS: 55-60
- Minimum FPS: 50+
- Memory Delta: <40 MB

### 3. Heavy Load Test (500 items) ⭐ PRIMARY TEST

**Purpose:** Verify performance requirements (>30 FPS with 500+ items)

**Expected Results:**
- Average FPS: 45-55
- Minimum FPS: 30+
- Memory Delta: <80 MB

### 4. Extreme Load Test (1000-2000 items)

**Purpose:** Stress test, identify performance limits

**Expected Results:**
- Average FPS: 35-45
- Minimum FPS: 25+
- Memory Delta: <100 MB

## Browser Testing Matrix

### Chrome (Recommended)

**Features:**
- Memory API available
- Best performance
- GPU acceleration

**Known Issues:**
- None

### Firefox

**Features:**
- Good performance
- Different rendering engine (Gecko)

**Known Issues:**
- `measureElement` disabled due to layout thrashing
- Slightly lower FPS than Chrome (~5-10 FPS difference)

### Safari

**Features:**
- WebKit engine
- iOS compatibility validation

**Known Issues:**
- Memory API not available
- Slower image rendering

### Edge

**Features:**
- Chromium-based (similar to Chrome)
- Windows platform validation

**Known Issues:**
- None

## Test Execution

### Manual Testing

1. **Access Test Page**
   ```bash
   npm run dev
   # Navigate to: http://localhost:3000/dev/performance
   ```

2. **Configure Test**
   - Select test type (templates/projects-grid/projects-list)
   - Choose item count (recommend starting with 500)
   - Set duration (5 seconds recommended)
   - Set scroll speed (10 px/frame = normal)

3. **Generate Data**
   - Click "Generate Test Data"
   - Wait for data to load (~1 second)

4. **Run Test**
   - Click "Run Performance Test"
   - Do not interact during test
   - Wait for completion (~6 seconds)

5. **Review Results**
   - Check FPS metrics (avg, min, max)
   - Check memory delta
   - Review analysis notes
   - Download report if needed

### Automated Testing (Future)

```typescript
// Example Playwright test (to be implemented)
test('templates gallery maintains 30+ FPS with 500 items', async ({ page }) => {
  await page.goto('/dev/performance')

  // Configure test
  await page.selectOption('[data-testid="test-type"]', 'templates')
  await page.selectOption('[data-testid="item-count"]', '500')

  // Generate data
  await page.click('text=Generate Test Data')
  await page.waitForTimeout(1000)

  // Run test
  await page.click('text=Run Performance Test')
  await page.waitForSelector('[data-testid="performance-report"]')

  // Verify results
  const avgFps = await page.textContent('[data-testid="avg-fps"]')
  const minFps = await page.textContent('[data-testid="min-fps"]')

  expect(parseFloat(avgFps)).toBeGreaterThanOrEqual(30)
  expect(parseFloat(minFps)).toBeGreaterThanOrEqual(30)
})
```

## Performance Analysis

### Interpreting Results

#### Excellent Performance (50+ FPS)

```
✅ Average FPS: 55 FPS
✅ Minimum FPS: 52 FPS
✅ Memory Delta: 35 MB
```

**Analysis:**
- No optimization needed
- Virtualization working perfectly
- GPU acceleration active

#### Acceptable Performance (30-50 FPS)

```
✓ Average FPS: 42 FPS
✓ Minimum FPS: 35 FPS
✓ Memory Delta: 65 MB
```

**Analysis:**
- Meets requirements
- Consider minor optimizations
- Monitor on older devices

#### Poor Performance (<30 FPS)

```
❌ Average FPS: 25 FPS
❌ Minimum FPS: 18 FPS
⚠️ Memory Delta: 120 MB
```

**Analysis:**
- Performance degraded
- Requires immediate optimization
- See troubleshooting guide below

### Common Performance Issues

#### Issue: FPS drops below 30

**Symptoms:**
- Stuttering during scroll
- Visible frame skips
- Slow response to input

**Causes:**
1. Heavy component rendering
2. Layout thrashing
3. Too many DOM nodes rendered
4. Expensive CSS operations

**Solutions:**
1. **Reduce overscan:**
   ```typescript
   const rowVirtualizer = useVirtualizer({
     overscan: 1, // Reduce from 2 to 1
   })
   ```

2. **Memoize components:**
   ```typescript
   const TemplateCard = memo(({ template }: TemplateCardProps) => {
     // Component code
   })
   ```

3. **Simplify card rendering:**
   - Remove complex animations
   - Reduce number of child elements
   - Optimize images

4. **Use CSS containment:**
   ```css
   .scroll-container {
     contain: strict; /* Already applied */
   }
   ```

#### Issue: Memory grows excessively

**Symptoms:**
- Memory delta >100 MB
- Browser slows down over time
- Page crashes on mobile

**Causes:**
1. Memory leaks in components
2. Event listeners not cleaned up
3. Images not garbage collected
4. Data stored in closures

**Solutions:**
1. **Check for leaks:**
   ```typescript
   useEffect(() => {
     const listener = () => {}
     window.addEventListener('scroll', listener)

     return () => {
       window.removeEventListener('scroll', listener) // Cleanup
     }
   }, [])
   ```

2. **Optimize images:**
   - Use Next.js Image component
   - Set proper sizes
   - Enable lazy loading

3. **Profile memory:**
   - Use Chrome DevTools Memory Profiler
   - Take heap snapshots before/after test
   - Identify retained objects

#### Issue: Scroll jank (stuttering)

**Symptoms:**
- Inconsistent scroll speed
- Visible pauses during scroll
- FPS spikes up and down

**Causes:**
1. Layout recalculation during scroll
2. JavaScript blocking main thread
3. Heavy animations
4. Synchronous API calls

**Solutions:**
1. **Use transform for positioning:**
   ```typescript
   // Already implemented
   style={{
     transform: `translateY(${virtualRow.start}px)`
   }}
   ```

2. **Defer heavy operations:**
   ```typescript
   useEffect(() => {
     requestIdleCallback(() => {
       // Heavy operation
     })
   }, [])
   ```

3. **Use CSS animations:**
   ```css
   /* Prefer CSS over JavaScript animations */
   .card {
     transition: transform 0.2s ease;
   }
   ```

## Optimization Checklist

### Virtualization Config

- [ ] Overscan set to 2-5 rows
- [ ] `estimateSize` matches actual row height
- [ ] `measureElement` enabled (except Firefox)
- [ ] Scroll container has fixed height

### Component Optimization

- [ ] Cards wrapped in `React.memo()`
- [ ] Expensive calculations use `useMemo()`
- [ ] Event handlers use `useCallback()`
- [ ] No inline object/array creation in render

### CSS Optimization

- [ ] `contain: strict` on scroll container
- [ ] `transform` for positioning (not `top`/`left`)
- [ ] Minimal box-shadows and gradients
- [ ] No `backdrop-filter` in virtual items
- [ ] Images have explicit width/height

### Data Optimization

- [ ] Filter/sort operations memoized
- [ ] Large lists paginated or virtualized
- [ ] Images lazy loaded
- [ ] API responses cached properly

## Performance Report Format

When exporting reports, the following markdown format is used:

```markdown
# Performance Test Report: templates-500-items

**Status**: ✅ PASSED
**Date**: 2024-01-15 14:30:00
**Browser**: Chrome 120

## FPS Metrics
- **Current**: 55 FPS
- **Average**: 54 FPS
- **Minimum**: 48 FPS (threshold: 30)
- **Maximum**: 60 FPS

## Memory Metrics
- **Used**: 125.50 MB
- **Delta**: 45.20 MB (threshold: 100 MB)

## Rendering Metrics
- **Items Rendered**: 12
- **Total Items**: 500
- **Scroll Duration**: 5000 ms

## Notes
- ✅ Excellent performance (60+ FPS)
```

## CI/CD Integration (Future)

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    paths:
      - 'frontend/components/**'
      - 'frontend/lib/**'

jobs:
  performance:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend

      - name: Run performance tests
        run: npm run test:performance
        working-directory: ./frontend

      - name: Upload reports
        uses: actions/upload-artifact@v4
        with:
          name: performance-reports
          path: .tmp/current/performance-*.md
```

## Results Archive

Performance test results should be stored in:

```
docs/reports/frontend/performance/YYYY-MM/
├── 2024-01/
│   ├── templates-500-baseline.md
│   ├── projects-grid-500.md
│   └── projects-list-500.md
└── 2024-02/
    └── ...
```

## References

- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web Performance Metrics](https://web.dev/vitals/)
- [CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment)

## Changelog

### 2024-02-08
- Initial performance testing infrastructure
- Created FPSMonitor, MemoryMonitor, ScrollPerformanceTester
- Added interactive test UI at /dev/performance
- Documented testing procedures and optimization guide
