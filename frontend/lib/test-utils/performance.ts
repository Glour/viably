/**
 * Performance Testing Utilities
 *
 * Provides tools for measuring FPS, memory usage, and scroll performance
 * in virtualized lists with large datasets (500+ items).
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PerformanceMetrics {
  fps: number
  avgFps: number
  minFps: number
  maxFps: number
  memoryUsed: number // MB
  memoryDelta: number // MB (change during test)
  scrollDuration: number // ms
  itemsRendered: number
  totalItems: number
  timestamp: number
}

export interface PerformanceTestConfig {
  duration?: number // Test duration in ms (default: 5000)
  scrollDistance?: number // Pixels to scroll (default: full container)
  scrollSpeed?: number // Pixels per frame (default: 10)
  sampleInterval?: number // FPS sample interval in ms (default: 100)
}

/* ------------------------------------------------------------------ */
/*  FPS Monitor                                                        */
/* ------------------------------------------------------------------ */

export class FPSMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 0
  private samples: number[] = []
  private rafId: number | null = null

  start() {
    this.frameCount = 0
    this.lastTime = performance.now()
    this.samples = []
    this.measure()
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private measure = () => {
    const now = performance.now()
    const delta = now - this.lastTime

    this.frameCount++

    // Calculate FPS every 100ms
    if (delta >= 100) {
      this.fps = Math.round((this.frameCount * 1000) / delta)
      this.samples.push(this.fps)
      this.frameCount = 0
      this.lastTime = now
    }

    this.rafId = requestAnimationFrame(this.measure)
  }

  getCurrentFPS(): number {
    return this.fps
  }

  getMetrics() {
    if (this.samples.length === 0) {
      return { avg: 0, min: 0, max: 0, current: 0 }
    }

    return {
      avg: Math.round(
        this.samples.reduce((a, b) => a + b, 0) / this.samples.length
      ),
      min: Math.min(...this.samples),
      max: Math.max(...this.samples),
      current: this.fps,
    }
  }

  reset() {
    this.frameCount = 0
    this.lastTime = performance.now()
    this.samples = []
    this.fps = 0
  }
}

/* ------------------------------------------------------------------ */
/*  Memory Monitor                                                     */
/* ------------------------------------------------------------------ */

export class MemoryMonitor {
  private initialMemory = 0

  start() {
    if ('memory' in performance) {
      // @ts-expect-error - memory is Chrome-specific
      this.initialMemory = performance.memory.usedJSHeapSize / 1024 / 1024
    }
  }

  getUsage(): { used: number; delta: number } {
    if ('memory' in performance) {
      // @ts-expect-error - memory is Chrome-specific
      const current = performance.memory.usedJSHeapSize / 1024 / 1024
      return {
        used: current,
        delta: current - this.initialMemory,
      }
    }
    return { used: 0, delta: 0 }
  }

  reset() {
    this.initialMemory = 0
  }
}

/* ------------------------------------------------------------------ */
/*  Scroll Performance Tester                                          */
/* ------------------------------------------------------------------ */

export class ScrollPerformanceTester {
  private fpsMonitor = new FPSMonitor()
  private memoryMonitor = new MemoryMonitor()

  async test(
    container: HTMLElement,
    config: PerformanceTestConfig = {}
  ): Promise<PerformanceMetrics> {
    const {
      duration = 5000,
      scrollDistance = container.scrollHeight - container.clientHeight,
      scrollSpeed = 10,
    } = config

    // Start monitoring
    this.fpsMonitor.start()
    this.memoryMonitor.start()

    const startTime = performance.now()
    let scrolled = 0

    // Scroll animation
    await new Promise<void>((resolve) => {
      const scroll = () => {
        if (
          scrolled >= scrollDistance ||
          performance.now() - startTime >= duration
        ) {
          resolve()
          return
        }

        container.scrollTop += scrollSpeed
        scrolled += scrollSpeed

        requestAnimationFrame(scroll)
      }

      scroll()
    })

    // Stop monitoring
    this.fpsMonitor.stop()

    // Collect metrics
    const fpsMetrics = this.fpsMonitor.getMetrics()
    const memoryMetrics = this.memoryMonitor.getUsage()

    // Count rendered items (data-index attributes)
    const renderedItems = container.querySelectorAll('[data-index]').length

    // Get total items from virtual container height
    const virtualContainer = container.querySelector('[style*="height"]')
    const totalHeight = virtualContainer
      ? parseInt(
          getComputedStyle(virtualContainer).height.replace('px', '')
        )
      : 0

    return {
      fps: fpsMetrics.current,
      avgFps: fpsMetrics.avg,
      minFps: fpsMetrics.min,
      maxFps: fpsMetrics.max,
      memoryUsed: memoryMetrics.used,
      memoryDelta: memoryMetrics.delta,
      scrollDuration: performance.now() - startTime,
      itemsRendered: renderedItems,
      totalItems: 0, // Will be set by test caller
      timestamp: Date.now(),
    }
  }

  reset() {
    this.fpsMonitor.reset()
    this.memoryMonitor.reset()
  }
}

/* ------------------------------------------------------------------ */
/*  Performance Report Generator                                       */
/* ------------------------------------------------------------------ */

export interface PerformanceReport {
  testName: string
  passed: boolean
  metrics: PerformanceMetrics
  thresholds: {
    minFPS: number
    maxMemoryDelta: number
  }
  browser: string
  timestamp: number
  notes: string[]
}

export function generatePerformanceReport(
  testName: string,
  metrics: PerformanceMetrics,
  thresholds = { minFPS: 30, maxMemoryDelta: 100 }
): PerformanceReport {
  const passed = metrics.minFps >= thresholds.minFPS &&
                 metrics.memoryDelta <= thresholds.maxMemoryDelta

  const notes: string[] = []

  if (metrics.minFps < thresholds.minFPS) {
    notes.push(
      `⚠️ Minimum FPS (${metrics.minFps}) below threshold (${thresholds.minFPS})`
    )
  }

  if (metrics.avgFps < thresholds.minFPS) {
    notes.push(
      `⚠️ Average FPS (${metrics.avgFps}) below threshold (${thresholds.minFPS})`
    )
  }

  if (metrics.memoryDelta > thresholds.maxMemoryDelta) {
    notes.push(
      `⚠️ Memory delta (${metrics.memoryDelta.toFixed(2)}MB) exceeds threshold (${thresholds.maxMemoryDelta}MB)`
    )
  }

  if (metrics.avgFps >= 60) {
    notes.push('✅ Excellent performance (60+ FPS)')
  } else if (metrics.avgFps >= 50) {
    notes.push('✅ Good performance (50+ FPS)')
  } else if (metrics.avgFps >= 30) {
    notes.push('✓ Acceptable performance (30+ FPS)')
  }

  return {
    testName,
    passed,
    metrics,
    thresholds,
    browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
    timestamp: Date.now(),
    notes,
  }
}

/* ------------------------------------------------------------------ */
/*  Browser Detection                                                  */
/* ------------------------------------------------------------------ */

export function getBrowserInfo() {
  if (typeof navigator === 'undefined') {
    return { browser: 'SSR', version: 'N/A' }
  }
  const ua = navigator.userAgent
  let browser = 'Unknown'
  let version = 'Unknown'

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome'
    const match = ua.match(/Chrome\/(\d+)/)
    if (match) version = match[1]
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox'
    const match = ua.match(/Firefox\/(\d+)/)
    if (match) version = match[1]
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari'
    const match = ua.match(/Version\/(\d+)/)
    if (match) version = match[1]
  } else if (ua.includes('Edg')) {
    browser = 'Edge'
    const match = ua.match(/Edg\/(\d+)/)
    if (match) version = match[1]
  }

  return { browser, version, userAgent: ua }
}

/* ------------------------------------------------------------------ */
/*  Export Utilities                                                   */
/* ------------------------------------------------------------------ */

export function formatPerformanceReport(report: PerformanceReport): string {
  const { metrics, thresholds } = report

  return `
# Performance Test Report: ${report.testName}

**Status**: ${report.passed ? '✅ PASSED' : '❌ FAILED'}
**Date**: ${new Date(report.timestamp).toLocaleString()}
**Browser**: ${report.browser}

## FPS Metrics
- **Current**: ${metrics.fps} FPS
- **Average**: ${metrics.avgFps} FPS
- **Minimum**: ${metrics.minFps} FPS (threshold: ${thresholds.minFPS})
- **Maximum**: ${metrics.maxFps} FPS

## Memory Metrics
- **Used**: ${metrics.memoryUsed.toFixed(2)} MB
- **Delta**: ${metrics.memoryDelta.toFixed(2)} MB (threshold: ${thresholds.maxMemoryDelta} MB)

## Rendering Metrics
- **Items Rendered**: ${metrics.itemsRendered}
- **Total Items**: ${metrics.totalItems}
- **Scroll Duration**: ${metrics.scrollDuration.toFixed(0)} ms

## Notes
${report.notes.map((note) => `- ${note}`).join('\n')}
`
}

export function downloadPerformanceReport(report: PerformanceReport) {
  const content = formatPerformanceReport(report)
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `performance-${report.testName}-${Date.now()}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
