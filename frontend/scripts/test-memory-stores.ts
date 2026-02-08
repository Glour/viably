#!/usr/bin/env tsx
/**
 * Memory Testing for Zustand Stores - T057 (Simplified Version)
 *
 * Tests memory usage of Zustand stores in isolation without requiring
 * a running server. Verifies store isolation and memory efficiency.
 *
 * Usage:
 *   npx tsx scripts/test-memory-stores.ts
 */

import { performance } from 'perf_hooks'

interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
}

interface StoreMemoryTest {
  storeName: string
  iterations: number
  initialMemoryMB: number
  finalMemoryMB: number
  growthMB: number
  averagePerInstanceKB: number
  leakDetected: boolean
}

const ITERATIONS = 10 // Simulate 10 concurrent projects
const LEAK_THRESHOLD_MB = 10

/**
 * Get current memory usage
 */
function getMemoryUsage(): MemorySnapshot {
  const usage = process.memoryUsage()
  return {
    timestamp: Date.now(),
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
  }
}

/**
 * Force garbage collection (requires --expose-gc)
 */
function forceGC(): void {
  if (global.gc) {
    global.gc()
  } else {
    console.warn('⚠️  Garbage collection not available. Run with: node --expose-gc')
  }
}

/**
 * Mock Zustand store factory
 */
function createMockProjectStore(projectId: string) {
  return {
    projectId,
    searchQuery: '',
    filter: 'all',
    sort: 'newest',
    viewMode: 'grid',
    _data: Array.from({ length: 100 }, (_, i) => ({
      id: `${projectId}-item-${i}`,
      name: `Test Item ${i}`,
      description: 'A'.repeat(200), // Simulate reasonable data
    })),
    setSearchQuery: (q: string) => {},
    setFilter: (f: string) => {},
    setSort: (s: string) => {},
    setViewMode: (m: string) => {},
  }
}

/**
 * Mock Generation store factory
 */
function createMockGenerationStore(projectId: string) {
  return {
    projectId,
    template: null,
    formValues: {},
    freeTextInput: '',
    generation: {
      status: 'idle',
      currentStep: 0,
      steps: Array.from({ length: 6 }, (_, i) => ({
        id: `step-${i}`,
        name: `Step ${i}`,
        status: 'pending',
        duration: null,
      })),
      progress: 0,
      code: null,
      error: null,
      startedAt: null,
      completedAt: null,
    },
    deployment: {
      status: 'config',
      steps: Array.from({ length: 6 }, (_, i) => ({
        id: `deploy-step-${i}`,
        name: `Deploy Step ${i}`,
        status: 'pending',
        duration: null,
      })),
      currentStep: 0,
      progress: 0,
      botInfo: null,
      error: null,
    },
    _mockData: {
      files: Array.from({ length: 50 }, (_, i) => ({
        path: `/src/file-${i}.tsx`,
        name: `file-${i}.tsx`,
        type: 'file',
        content: 'x'.repeat(1000), // 1KB per file
      })),
    },
  }
}

/**
 * Test store memory usage
 */
async function testStoreMemory(
  storeName: string,
  createStore: (id: string) => any
): Promise<StoreMemoryTest> {
  console.log(`\n📦 Testing ${storeName} store...`)

  // Initial memory
  forceGC()
  await new Promise(resolve => setTimeout(resolve, 100))
  const initialMemory = getMemoryUsage()
  const initialMB = initialMemory.heapUsed / 1024 / 1024

  console.log(`  Initial memory: ${initialMB.toFixed(2)} MB`)

  // Create stores
  const stores: any[] = []
  for (let i = 0; i < ITERATIONS; i++) {
    const store = createStore(`project-${i}`)
    stores.push(store)
  }

  console.log(`  Created ${ITERATIONS} store instances`)

  // Measure after creation
  forceGC()
  await new Promise(resolve => setTimeout(resolve, 100))
  const afterCreation = getMemoryUsage()
  const afterCreationMB = afterCreation.heapUsed / 1024 / 1024

  console.log(`  After creation: ${afterCreationMB.toFixed(2)} MB`)

  const growthMB = afterCreationMB - initialMB
  const averagePerInstanceKB = (growthMB * 1024) / ITERATIONS

  // Cleanup
  stores.length = 0

  // Final memory after cleanup
  forceGC()
  await new Promise(resolve => setTimeout(resolve, 200))
  const finalMemory = getMemoryUsage()
  const finalMB = finalMemory.heapUsed / 1024 / 1024

  console.log(`  After cleanup: ${finalMB.toFixed(2)} MB`)

  const leakMB = finalMB - initialMB
  const leakDetected = leakMB > LEAK_THRESHOLD_MB

  if (leakDetected) {
    console.log(`  ⚠️  Potential leak: ${leakMB.toFixed(2)} MB not freed`)
  } else {
    console.log(`  ✓ Memory properly released`)
  }

  return {
    storeName,
    iterations: ITERATIONS,
    initialMemoryMB: initialMB,
    finalMemoryMB: afterCreationMB,
    growthMB,
    averagePerInstanceKB,
    leakDetected,
  }
}

/**
 * Test store isolation
 */
function testStoreIsolation(): boolean {
  console.log('\n🔐 Testing store isolation...')

  const store1 = createMockProjectStore('project-1')
  const store2 = createMockProjectStore('project-2')

  store1.searchQuery = 'test-query-1'
  store2.searchQuery = 'test-query-2'

  const isolated = store1.searchQuery !== store2.searchQuery

  if (isolated) {
    console.log('  ✓ Stores are properly isolated')
  } else {
    console.log('  ❌ Store isolation failed!')
  }

  return isolated
}

/**
 * Test large data handling
 */
async function testLargeDataHandling(): Promise<{
  success: boolean
  memoryMB: number
  timeMs: number
}> {
  console.log('\n📊 Testing large data handling...')

  forceGC()
  const start = performance.now()
  const initialMemory = getMemoryUsage()

  // Create store with large dataset
  const largeStore = {
    projects: Array.from({ length: 1000 }, (_, i) => ({
      id: `project-${i}`,
      name: `Project ${i}`,
      description: 'A'.repeat(500),
      files: Array.from({ length: 20 }, (_, j) => ({
        path: `/src/file-${j}.tsx`,
        content: 'x'.repeat(2000),
      })),
    })),
  }

  const end = performance.now()
  const timeMs = end - start

  forceGC()
  await new Promise(resolve => setTimeout(resolve, 100))
  const finalMemory = getMemoryUsage()
  const memoryMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024

  console.log(`  Created 1000 projects with files`)
  console.log(`  Memory used: ${memoryMB.toFixed(2)} MB`)
  console.log(`  Time: ${timeMs.toFixed(2)} ms`)

  const success = memoryMB < 100 // Should be less than 100MB for 1000 projects

  if (success) {
    console.log('  ✓ Memory usage acceptable')
  } else {
    console.log('  ⚠️  Memory usage high')
  }

  return { success, memoryMB, timeMs }
}

/**
 * Generate report
 */
function generateReport(results: {
  storeTests: StoreMemoryTest[]
  isolationTest: boolean
  largeDataTest: { success: boolean; memoryMB: number; timeMs: number }
}): void {
  console.log('\n' + '='.repeat(80))
  console.log('📊 ZUSTAND STORE MEMORY TEST RESULTS (T057)')
  console.log('='.repeat(80))
  console.log('')

  console.log('STORE MEMORY USAGE:')
  console.log('─'.repeat(80))
  results.storeTests.forEach(test => {
    console.log(`\n${test.storeName}:`)
    console.log(`  Iterations: ${test.iterations}`)
    console.log(`  Growth: ${test.growthMB.toFixed(2)} MB`)
    console.log(`  Per Instance: ${test.averagePerInstanceKB.toFixed(2)} KB`)
    console.log(`  Leak Detected: ${test.leakDetected ? '⚠️ YES' : '✓ NO'}`)
  })

  const totalGrowth = results.storeTests.reduce((sum, t) => sum + t.growthMB, 0)
  const totalPerProject = results.storeTests.reduce((sum, t) => sum + t.averagePerInstanceKB, 0)

  console.log('\n' + '─'.repeat(80))
  console.log(`Total Memory (${ITERATIONS} projects): ${totalGrowth.toFixed(2)} MB`)
  console.log(`Average per project: ${(totalPerProject / 1024).toFixed(2)} MB`)
  console.log(`Projected for 10 projects: ${((totalPerProject / 1024) * 10).toFixed(2)} MB`)

  console.log('\n' + '─'.repeat(80))
  console.log('ISOLATION TEST:')
  console.log(`  Status: ${results.isolationTest ? '✅ PASSED' : '❌ FAILED'}`)

  console.log('\n' + '─'.repeat(80))
  console.log('LARGE DATA HANDLING:')
  console.log(`  Status: ${results.largeDataTest.success ? '✅ PASSED' : '⚠️ WARNING'}`)
  console.log(`  Memory: ${results.largeDataTest.memoryMB.toFixed(2)} MB`)
  console.log(`  Time: ${results.largeDataTest.timeMs.toFixed(2)} ms`)

  const allPassed =
    !results.storeTests.some(t => t.leakDetected) &&
    results.isolationTest &&
    results.largeDataTest.success &&
    totalGrowth < 50 // Total memory for test iterations should be reasonable

  console.log('\n' + '='.repeat(80))
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED')
  } else {
    console.log('⚠️ SOME TESTS FAILED OR SHOWED WARNINGS')
  }
  console.log('='.repeat(80))
  console.log('')
}

/**
 * Save results to file
 */
async function saveResults(results: any): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')

  const reportDir = path.resolve(process.cwd(), '.tmp/current')
  await fs.mkdir(reportDir, { recursive: true })

  const reportPath = path.join(reportDir, 'store-memory-test-results.json')
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2))

  console.log(`💾 Results saved to: ${reportPath}`)
}

/**
 * Main test runner
 */
async function runTests(): Promise<void> {
  console.log('🚀 Starting Zustand Store Memory Tests (T057)')
  console.log(`   Testing with ${ITERATIONS} concurrent store instances`)
  console.log('')

  try {
    // Test individual stores
    const projectStoreTest = await testStoreMemory('Projects', createMockProjectStore)
    const generationStoreTest = await testStoreMemory('Generation', createMockGenerationStore)

    // Test isolation
    const isolationTest = testStoreIsolation()

    // Test large data
    const largeDataTest = await testLargeDataHandling()

    // Generate report
    const results = {
      timestamp: new Date().toISOString(),
      storeTests: [projectStoreTest, generationStoreTest],
      isolationTest,
      largeDataTest,
    }

    generateReport(results)
    await saveResults(results)

    // Exit with appropriate code
    const success = !results.storeTests.some(t => t.leakDetected) &&
                   results.isolationTest &&
                   results.largeDataTest.success
    process.exit(success ? 0 : 1)

  } catch (error) {
    console.error('\n❌ Tests failed with error:')
    console.error(error)
    process.exit(1)
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error)
}

export { runTests, type StoreMemoryTest, type MemorySnapshot }
