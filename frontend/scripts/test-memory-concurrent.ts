#!/usr/bin/env tsx
/**
 * Memory Load Testing Script - T057
 *
 * Tests memory usage with 10 concurrent projects open.
 * Target: <500MB total heap size
 *
 * Requirements:
 * - Open 10 projects simultaneously
 * - Measure heap size using performance.memory
 * - Check for memory leaks
 * - Document memory usage per project
 * - Verify stores properly isolated
 *
 * Usage:
 *   npx tsx scripts/test-memory-concurrent.ts
 */

import { chromium, type Browser, type Page } from '@playwright/test'

interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface ProjectMemorySnapshot {
  projectId: string
  timestamp: number
  metrics: MemoryMetrics
  storeSize: {
    projects: number
    generation: number
    templates: number
    auth: number
    settings: number
  }
}

interface TestResult {
  success: boolean
  totalMemoryMB: number
  averagePerProjectMB: number
  peakMemoryMB: number
  memoryLeakDetected: boolean
  snapshots: ProjectMemorySnapshot[]
  errors: string[]
}

const PROJECTS_COUNT = 10
const TARGET_MEMORY_MB = 500
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const MEMORY_LEAK_THRESHOLD_MB = 50 // If memory grows >50MB after cleanup, leak suspected

/**
 * Get memory metrics from browser
 */
async function getMemoryMetrics(page: Page): Promise<MemoryMetrics> {
  return await page.evaluate(() => {
    if (!performance.memory) {
      throw new Error('performance.memory API not available. Run Chrome with --enable-precise-memory-info')
    }
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    }
  })
}

/**
 * Get Zustand store sizes (number of items/state complexity)
 */
async function getStoreSizes(page: Page): Promise<ProjectMemorySnapshot['storeSize']> {
  return await page.evaluate(() => {
    // Access Zustand stores from window (they're attached in dev mode)
    const getStoreSize = (storeName: string): number => {
      try {
        // @ts-ignore - accessing dev stores
        const store = window[`__zustand_${storeName}_store__`]
        if (!store) return 0
        return JSON.stringify(store.getState()).length
      } catch {
        return 0
      }
    }

    return {
      projects: getStoreSize('projects'),
      generation: getStoreSize('generation'),
      templates: getStoreSize('templates'),
      auth: getStoreSize('auth'),
      settings: getStoreSize('settings'),
    }
  })
}

/**
 * Force garbage collection (requires --expose-gc flag)
 */
async function forceGC(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      // @ts-ignore
      if (window.gc) {
        // @ts-ignore
        window.gc()
      }
    })
  } catch (error) {
    console.warn('⚠️  GC not available. Run Chrome with --js-flags="--expose-gc"')
  }
}

/**
 * Open a project page and measure memory
 */
async function openProject(
  page: Page,
  projectId: string
): Promise<ProjectMemorySnapshot> {
  // Navigate to project
  await page.goto(`${BASE_URL}/projects/${projectId}`)

  // Wait for page to load completely
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // Extra wait for React hydration

  // Force GC before measurement
  await forceGC(page)
  await page.waitForTimeout(500)

  // Measure memory
  const metrics = await getMemoryMetrics(page)
  const storeSize = await getStoreSizes(page)

  return {
    projectId,
    timestamp: Date.now(),
    metrics,
    storeSize,
  }
}

/**
 * Simulate opening multiple projects in tabs
 */
async function openMultipleProjects(
  browser: Browser,
  projectIds: string[]
): Promise<ProjectMemorySnapshot[]> {
  const snapshots: ProjectMemorySnapshot[] = []
  const pages: Page[] = []

  console.log(`\n📂 Opening ${projectIds.length} projects in separate tabs...`)

  // Open all projects in separate tabs
  for (let i = 0; i < projectIds.length; i++) {
    const projectId = projectIds[i]
    const context = await browser.newContext()
    const page = await context.newPage()
    pages.push(page)

    console.log(`  [${i + 1}/${projectIds.length}] Opening project ${projectId}...`)

    const snapshot = await openProject(page, projectId)
    snapshots.push(snapshot)

    const memoryMB = (snapshot.metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)
    console.log(`    ✓ Memory: ${memoryMB} MB`)
  }

  // Wait for all to stabilize
  console.log('\n⏳ Waiting for memory to stabilize...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Take final measurement
  console.log('\n📊 Taking final measurements...')
  const finalSnapshots: ProjectMemorySnapshot[] = []
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const projectId = projectIds[i]

    await forceGC(page)
    await page.waitForTimeout(500)

    const metrics = await getMemoryMetrics(page)
    const storeSize = await getStoreSizes(page)

    finalSnapshots.push({
      projectId,
      timestamp: Date.now(),
      metrics,
      storeSize,
    })
  }

  // Close all pages
  for (const page of pages) {
    await page.context().close()
  }

  return finalSnapshots
}

/**
 * Test for memory leaks by opening/closing projects repeatedly
 */
async function testMemoryLeaks(browser: Browser): Promise<boolean> {
  console.log('\n🔍 Testing for memory leaks...')

  const context = await browser.newContext()
  const page = await context.newPage()

  // Baseline memory
  await page.goto(BASE_URL)
  await forceGC(page)
  await page.waitForTimeout(1000)
  const baselineMetrics = await getMemoryMetrics(page)
  const baselineMB = baselineMetrics.usedJSHeapSize / 1024 / 1024

  console.log(`  Baseline: ${baselineMB.toFixed(2)} MB`)

  // Open/close projects 5 times
  for (let i = 0; i < 5; i++) {
    await page.goto(`${BASE_URL}/projects/test-project-${i}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
  }

  // Return to homepage and force GC
  await page.goto(BASE_URL)
  await page.waitForTimeout(1000)
  await forceGC(page)
  await page.waitForTimeout(2000)

  // Final memory
  const finalMetrics = await getMemoryMetrics(page)
  const finalMB = finalMetrics.usedJSHeapSize / 1024 / 1024
  const growthMB = finalMB - baselineMB

  console.log(`  Final: ${finalMB.toFixed(2)} MB`)
  console.log(`  Growth: ${growthMB.toFixed(2)} MB`)

  await context.close()

  const leakDetected = growthMB > MEMORY_LEAK_THRESHOLD_MB
  if (leakDetected) {
    console.log(`  ⚠️  Potential leak: Memory grew by ${growthMB.toFixed(2)} MB`)
  } else {
    console.log(`  ✓ No leaks detected`)
  }

  return leakDetected
}

/**
 * Generate mock project IDs
 */
function generateProjectIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `test-project-${i + 1}`)
}

/**
 * Calculate statistics
 */
function calculateStats(snapshots: ProjectMemorySnapshot[]): {
  totalMB: number
  averageMB: number
  peakMB: number
} {
  const memoryValues = snapshots.map(s => s.metrics.usedJSHeapSize / 1024 / 1024)
  const totalMB = memoryValues.reduce((sum, val) => sum + val, 0)
  const averageMB = totalMB / snapshots.length
  const peakMB = Math.max(...memoryValues)

  return { totalMB, averageMB, peakMB }
}

/**
 * Generate detailed report
 */
function generateReport(result: TestResult): void {
  console.log('\n' + '='.repeat(80))
  console.log('📊 MEMORY LOAD TEST RESULTS (T057)')
  console.log('='.repeat(80))
  console.log('')
  console.log(`Projects Tested: ${PROJECTS_COUNT}`)
  console.log(`Target Memory: <${TARGET_MEMORY_MB} MB`)
  console.log('')
  console.log('RESULTS:')
  console.log(`  Total Memory: ${result.totalMemoryMB.toFixed(2)} MB`)
  console.log(`  Average per Project: ${result.averagePerProjectMB.toFixed(2)} MB`)
  console.log(`  Peak Memory: ${result.peakMemoryMB.toFixed(2)} MB`)
  console.log('')

  if (result.success) {
    console.log(`✅ PASSED: Memory usage is under ${TARGET_MEMORY_MB} MB`)
  } else {
    console.log(`❌ FAILED: Memory usage exceeds ${TARGET_MEMORY_MB} MB`)
  }

  if (result.memoryLeakDetected) {
    console.log('⚠️  WARNING: Potential memory leak detected')
  } else {
    console.log('✓ No memory leaks detected')
  }

  console.log('\nPER-PROJECT BREAKDOWN:')
  console.log('─'.repeat(80))
  result.snapshots.forEach((snapshot, i) => {
    const memoryMB = (snapshot.metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)
    const totalHeapMB = (snapshot.metrics.totalJSHeapSize / 1024 / 1024).toFixed(2)
    console.log(`\n[${i + 1}] Project: ${snapshot.projectId}`)
    console.log(`    Used Heap: ${memoryMB} MB`)
    console.log(`    Total Heap: ${totalHeapMB} MB`)
    console.log(`    Store Sizes:`)
    console.log(`      - Projects: ${(snapshot.storeSize.projects / 1024).toFixed(2)} KB`)
    console.log(`      - Generation: ${(snapshot.storeSize.generation / 1024).toFixed(2)} KB`)
    console.log(`      - Templates: ${(snapshot.storeSize.templates / 1024).toFixed(2)} KB`)
    console.log(`      - Auth: ${(snapshot.storeSize.auth / 1024).toFixed(2)} KB`)
    console.log(`      - Settings: ${(snapshot.storeSize.settings / 1024).toFixed(2)} KB`)
  })

  if (result.errors.length > 0) {
    console.log('\n⚠️  ERRORS:')
    result.errors.forEach(error => console.log(`  - ${error}`))
  }

  console.log('\n' + '='.repeat(80))
  console.log('')
}

/**
 * Save report to file
 */
async function saveReport(result: TestResult): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')

  const reportDir = path.resolve(process.cwd(), '.tmp/current')
  await fs.mkdir(reportDir, { recursive: true })

  const reportPath = path.join(reportDir, 'memory-test-results.json')
  await fs.writeFile(reportPath, JSON.stringify(result, null, 2))

  console.log(`💾 Report saved to: ${reportPath}`)

  // Also save markdown report
  const mdReportPath = path.join(reportDir, 'memory-test-results.md')
  const mdContent = `# Memory Load Test Results - T057

**Date**: ${new Date().toISOString()}
**Target**: <${TARGET_MEMORY_MB} MB with ${PROJECTS_COUNT} concurrent projects

## Summary

- **Total Memory**: ${result.totalMemoryMB.toFixed(2)} MB
- **Average per Project**: ${result.averagePerProjectMB.toFixed(2)} MB
- **Peak Memory**: ${result.peakMemoryMB.toFixed(2)} MB
- **Status**: ${result.success ? '✅ PASSED' : '❌ FAILED'}
- **Memory Leaks**: ${result.memoryLeakDetected ? '⚠️ Detected' : '✓ None'}

## Per-Project Breakdown

| # | Project ID | Used Heap (MB) | Total Heap (MB) | Projects Store (KB) | Generation Store (KB) |
|---|------------|----------------|-----------------|---------------------|----------------------|
${result.snapshots.map((s, i) => {
  const used = (s.metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)
  const total = (s.metrics.totalJSHeapSize / 1024 / 1024).toFixed(2)
  const projectsStore = (s.storeSize.projects / 1024).toFixed(2)
  const genStore = (s.storeSize.generation / 1024).toFixed(2)
  return `| ${i + 1} | ${s.projectId} | ${used} | ${total} | ${projectsStore} | ${genStore} |`
}).join('\n')}

## Recommendations

${result.success ? `
✅ Memory usage is within acceptable limits.

**Optimization opportunities**:
- Monitor store sizes - consider lazy loading for large datasets
- Implement virtualization for long lists
- Use React.memo for expensive components
` : `
⚠️ Memory usage exceeds target.

**Action items**:
1. Investigate high memory projects (>50MB per project)
2. Check for large objects in Zustand stores
3. Review React Query cache configuration
4. Consider implementing:
   - Component memoization
   - Virtual scrolling for lists
   - Code splitting for heavy features
   - Lazy loading for Monaco Editor
`}

${result.memoryLeakDetected ? `
⚠️ **Memory Leak Detected**

**Investigation steps**:
1. Check for unsubscribed listeners
2. Review useEffect cleanup functions
3. Verify WebSocket connections are closed
4. Check for circular references in stores
5. Use Chrome DevTools Memory Profiler for detailed analysis
` : ''}

## Test Configuration

- Projects Count: ${PROJECTS_COUNT}
- Target Memory: ${TARGET_MEMORY_MB} MB
- Base URL: ${BASE_URL}
- Memory Leak Threshold: ${MEMORY_LEAK_THRESHOLD_MB} MB

## Errors

${result.errors.length > 0 ? result.errors.map(e => `- ${e}`).join('\n') : 'None'}
`

  await fs.writeFile(mdReportPath, mdContent)
  console.log(`📄 Markdown report saved to: ${mdReportPath}`)
}

/**
 * Main test runner
 */
async function runTest(): Promise<void> {
  console.log('🚀 Starting Memory Load Test (T057)')
  console.log(`   Target: <${TARGET_MEMORY_MB} MB with ${PROJECTS_COUNT} concurrent projects`)
  console.log('')

  const errors: string[] = []
  let browser: Browser | null = null

  try {
    // Launch browser with memory tracking enabled
    console.log('🌐 Launching Chrome with memory profiling...')
    browser = await chromium.launch({
      headless: true,
      args: [
        '--enable-precise-memory-info',
        '--js-flags=--expose-gc',
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
    })

    // Generate project IDs
    const projectIds = generateProjectIds(PROJECTS_COUNT)

    // Test concurrent projects
    const snapshots = await openMultipleProjects(browser, projectIds)

    // Test memory leaks
    const memoryLeakDetected = await testMemoryLeaks(browser)

    // Calculate stats
    const stats = calculateStats(snapshots)

    // Build result
    const result: TestResult = {
      success: stats.totalMB < TARGET_MEMORY_MB,
      totalMemoryMB: stats.totalMB,
      averagePerProjectMB: stats.averageMB,
      peakMemoryMB: stats.peakMB,
      memoryLeakDetected,
      snapshots,
      errors,
    }

    // Generate and save report
    generateReport(result)
    await saveReport(result)

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1)

  } catch (error) {
    console.error('\n❌ Test failed with error:')
    console.error(error)
    errors.push(error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the test
if (require.main === module) {
  runTest().catch(console.error)
}

export { runTest, type TestResult, type ProjectMemorySnapshot }
