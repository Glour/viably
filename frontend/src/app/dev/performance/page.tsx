"use client"

import { MainLayout } from "@/widgets/layout"
import { PerformanceTester } from "@/shared/components/dev/performance-tester"

// T054: Disable SSR for this page due to browser-specific APIs
export const dynamic = 'force-dynamic'

/**
 * Performance Testing Page
 *
 * Interactive tool for testing virtualization performance with large datasets.
 *
 * Features:
 * - Test templates gallery with 500+ items
 * - Test projects grid/list with 500+ items
 * - Measure FPS, memory usage, scroll performance
 * - Compare across different browsers
 * - Export performance reports
 *
 * Usage:
 * 1. Select test type (templates/projects-grid/projects-list)
 * 2. Choose item count (100, 250, 500, 1000, 2000)
 * 3. Generate test data
 * 4. Run performance test
 * 5. Review metrics and download report
 *
 * Target Performance:
 * - Average FPS: >= 50 (excellent), >= 30 (acceptable)
 * - Minimum FPS: >= 30
 * - Memory Delta: <= 100 MB
 *
 * @see /lib/test-utils/performance.ts - Performance measurement utilities
 * @see /lib/test-utils/mock-data.ts - Test data generators
 */
export default function PerformanceTestPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Virtualization Performance Testing
          </h1>
          <p className="mt-2 text-muted-foreground">
            Test and measure performance of virtualized lists with 500+ items
          </p>
        </div>

        <PerformanceTester />

        {/* Documentation */}
        <div className="prose dark:prose-invert max-w-none">
          <h2>Testing Guidelines</h2>

          <h3>Performance Targets</h3>
          <ul>
            <li>
              <strong>Average FPS:</strong> Should be ≥50 for excellent performance,
              ≥30 for acceptable
            </li>
            <li>
              <strong>Minimum FPS:</strong> Should not drop below 30 during scrolling
            </li>
            <li>
              <strong>Memory Delta:</strong> Should stay under 100MB for the entire test
            </li>
          </ul>

          <h3>Test Scenarios</h3>
          <ol>
            <li>
              <strong>Light Load (100 items):</strong> Baseline test, should achieve
              60 FPS
            </li>
            <li>
              <strong>Medium Load (250 items):</strong> Should maintain 50+ FPS
            </li>
            <li>
              <strong>Heavy Load (500 items):</strong> Target 30+ FPS minimum
            </li>
            <li>
              <strong>Extreme Load (1000-2000 items):</strong> Stress test, should
              remain usable
            </li>
          </ol>

          <h3>Browser Testing</h3>
          <p>Test on multiple browsers to ensure consistent performance:</p>
          <ul>
            <li>
              <strong>Chrome:</strong> Best performance, memory API available
            </li>
            <li>
              <strong>Firefox:</strong> Good performance, different rendering engine
            </li>
            <li>
              <strong>Safari:</strong> WebKit engine, iOS compatibility
            </li>
            <li>
              <strong>Edge:</strong> Chromium-based, similar to Chrome
            </li>
          </ul>

          <h3>Analyzing Results</h3>
          <p>Key metrics to watch:</p>
          <ul>
            <li>
              <strong>FPS drops:</strong> If minimum FPS drops below 30, investigate:
              <ul>
                <li>Reduce overscan value in virtualizer config</li>
                <li>Simplify card rendering (remove animations, heavy components)</li>
                <li>Check for unnecessary re-renders</li>
              </ul>
            </li>
            <li>
              <strong>Memory growth:</strong> If delta exceeds 100MB:
              <ul>
                <li>Check for memory leaks in components</li>
                <li>Ensure proper cleanup of event listeners</li>
                <li>Review image loading and caching</li>
              </ul>
            </li>
            <li>
              <strong>Scroll jank:</strong> Stuttering during scroll indicates:
              <ul>
                <li>Layout thrashing (multiple reflows)</li>
                <li>Expensive calculations in render path</li>
                <li>Non-optimized CSS (box-shadow, backdrop-filter)</li>
              </ul>
            </li>
          </ul>

          <h3>Optimization Tips</h3>
          <ul>
            <li>
              Use <code>contain: strict</code> on scroll container for better
              performance
            </li>
            <li>
              Prefer <code>transform</code> for positioning (GPU-accelerated)
            </li>
            <li>
              Memoize expensive calculations with <code>useMemo</code>
            </li>
            <li>
              Use <code>React.memo</code> on card components to prevent unnecessary
              re-renders
            </li>
            <li>Lazy load images with proper loading states</li>
            <li>Avoid inline styles and complex CSS in hot paths</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  )
}
