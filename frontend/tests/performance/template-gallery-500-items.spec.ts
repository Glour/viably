/**
 * Performance Test: Template Gallery with 500 Items
 *
 * Test Requirements (T056):
 * 1. Load gallery with 500 templates
 * 2. Measure FPS during fast scrolling
 * 3. Check frame drops
 * 4. Verify responsiveness
 * 5. Document results
 *
 * Expected: FPS >30 FPS confirmed
 */

import { test, expect } from '@playwright/test'

interface FPSStats {
  current: number
  average: number
  min: number
  max: number
  frameDrops: number
  totalFrames: number
  testDuration: number
}

test.describe('Template Gallery Performance - 500 Items', () => {
  test.setTimeout(120000) // 2 minutes for performance tests

  test('should load and display 500 templates', async ({ page }) => {
    // Navigate to performance test page
    await page.goto('/templates/test-performance')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click 500 items button
    await page.click('button:has-text("500 items")')

    // Wait for templates to render
    await page.waitForTimeout(2000)

    // Verify template count
    const countText = await page.textContent('[data-testid="template-count"], .text-2xl.font-bold')
    expect(countText?.trim()).toContain('500')
  })

  test('should measure FPS during scrolling with 500 items', async ({ page }) => {
    // Navigate to test page
    await page.goto('/templates/test-performance')
    await page.waitForLoadState('networkidle')

    // Load 500 templates
    await page.click('button:has-text("500 items")')
    await page.waitForTimeout(2000)

    // Start FPS monitoring
    await page.click('button:has-text("Start FPS Monitor")')
    await page.waitForTimeout(1000)

    // Inject FPS measurement script
    const fpsStats = await page.evaluate(async () => {
      return new Promise<FPSStats>((resolve) => {
        const scrollContainer = document.querySelector('[class*="overflow-auto"]') as HTMLElement
        if (!scrollContainer) {
          resolve({
            current: 0,
            average: 0,
            min: 0,
            max: 0,
            frameDrops: 0,
            totalFrames: 0,
            testDuration: 0,
          })
          return
        }

        let lastTime = performance.now()
        let frames = 0
        let fpsReadings: number[] = []
        let frameDrops = 0
        const startTime = performance.now()
        const testDuration = 10000 // 10 seconds test

        const measureFrame = () => {
          const currentTime = performance.now()
          frames++
          const elapsed = currentTime - lastTime

          // Calculate FPS every second
          if (elapsed >= 1000) {
            const fps = Math.round((frames * 1000) / elapsed)
            fpsReadings.push(fps)

            // Count frame drops (below 30 FPS)
            if (fps < 30) {
              frameDrops++
            }

            frames = 0
            lastTime = currentTime
          }

          // Continue measuring for test duration
          if (currentTime - startTime < testDuration) {
            requestAnimationFrame(measureFrame)
          } else {
            // Test complete, calculate stats
            const average = fpsReadings.length > 0
              ? Math.round(fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length)
              : 0
            const min = fpsReadings.length > 0 ? Math.min(...fpsReadings) : 0
            const max = fpsReadings.length > 0 ? Math.max(...fpsReadings) : 0
            const current = fpsReadings.length > 0 ? fpsReadings[fpsReadings.length - 1] : 0

            resolve({
              current,
              average,
              min,
              max,
              frameDrops,
              totalFrames: fpsReadings.length,
              testDuration: currentTime - startTime,
            })
          }
        }

        // Start scrolling simulation
        let scrollTop = 0
        const scrollInterval = setInterval(() => {
          scrollTop += 150 // Fast scroll
          scrollContainer.scrollTop = scrollTop

          // Reset scroll when reaching bottom
          if (scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
            scrollTop = 0
          }
        }, 16) // ~60fps scroll rate

        // Stop scrolling after test duration
        setTimeout(() => {
          clearInterval(scrollInterval)
        }, testDuration)

        // Start FPS measurement
        requestAnimationFrame(measureFrame)
      })
    })

    // Verify performance metrics
    console.log('FPS Performance Stats:', fpsStats)

    // Assert performance requirements
    expect(fpsStats.average).toBeGreaterThanOrEqual(30)
    expect(fpsStats.min).toBeGreaterThanOrEqual(20) // Allow some variance
    expect(fpsStats.frameDrops).toBeLessThanOrEqual(2) // Max 2 seconds below 30 FPS in 10s test

    // Stop monitoring
    await page.click('button:has-text("Stop Monitoring")')
  })

  test('should measure long scroll performance (30s stress test)', async ({ page }) => {
    await page.goto('/templates/test-performance')
    await page.waitForLoadState('networkidle')

    // Load 500 templates
    await page.click('button:has-text("500 items")')
    await page.waitForTimeout(2000)

    // Start monitoring
    await page.click('button:has-text("Start FPS Monitor")')
    await page.waitForTimeout(1000)

    // Extended performance test
    const extendedStats = await page.evaluate(async () => {
      return new Promise<FPSStats>((resolve) => {
        const scrollContainer = document.querySelector('[class*="overflow-auto"]') as HTMLElement
        if (!scrollContainer) {
          resolve({
            current: 0,
            average: 0,
            min: 0,
            max: 0,
            frameDrops: 0,
            totalFrames: 0,
            testDuration: 0,
          })
          return
        }

        let lastTime = performance.now()
        let frames = 0
        let fpsReadings: number[] = []
        let frameDrops = 0
        const startTime = performance.now()
        const testDuration = 30000 // 30 seconds stress test

        const measureFrame = () => {
          const currentTime = performance.now()
          frames++
          const elapsed = currentTime - lastTime

          if (elapsed >= 1000) {
            const fps = Math.round((frames * 1000) / elapsed)
            fpsReadings.push(fps)

            if (fps < 30) {
              frameDrops++
            }

            frames = 0
            lastTime = currentTime
          }

          if (currentTime - startTime < testDuration) {
            requestAnimationFrame(measureFrame)
          } else {
            const average = fpsReadings.length > 0
              ? Math.round(fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length)
              : 0
            const min = fpsReadings.length > 0 ? Math.min(...fpsReadings) : 0
            const max = fpsReadings.length > 0 ? Math.max(...fpsReadings) : 0
            const current = fpsReadings.length > 0 ? fpsReadings[fpsReadings.length - 1] : 0

            resolve({
              current,
              average,
              min,
              max,
              frameDrops,
              totalFrames: fpsReadings.length,
              testDuration: currentTime - startTime,
            })
          }
        }

        // Aggressive scrolling
        let scrollTop = 0
        let direction = 1
        const scrollInterval = setInterval(() => {
          scrollTop += 200 * direction
          scrollContainer.scrollTop = scrollTop

          // Reverse direction at boundaries
          if (scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
            direction = -1
          } else if (scrollTop <= 0) {
            direction = 1
          }
        }, 16)

        setTimeout(() => {
          clearInterval(scrollInterval)
        }, testDuration)

        requestAnimationFrame(measureFrame)
      })
    })

    console.log('Extended FPS Stats (30s):', extendedStats)

    // Verify sustained performance
    expect(extendedStats.average).toBeGreaterThanOrEqual(30)
    expect(extendedStats.frameDrops).toBeLessThanOrEqual(5) // Max 5 seconds below 30 FPS in 30s test
  })

  test('should handle rapid template count changes', async ({ page }) => {
    await page.goto('/templates/test-performance')
    await page.waitForLoadState('networkidle')

    // Start monitoring
    await page.click('button:has-text("Start FPS Monitor")')
    await page.waitForTimeout(1000)

    // Rapidly change template counts
    const counts = [100, 500, 1000, 500, 100, 500]

    for (const count of counts) {
      await page.click(`button:has-text("${count} items")`)
      await page.waitForTimeout(500)

      // Verify count updated
      const countText = await page.textContent('.text-2xl.font-bold')
      expect(countText?.trim()).toContain(count.toString())
    }

    // Verify FPS is still good after rapid changes
    await page.waitForTimeout(2000)

    const currentFPS = await page.textContent('[data-testid="current-fps"], .text-2xl.font-bold:has-text("fps")')
    const fpsValue = parseInt(currentFPS?.replace(/\D/g, '') || '0')

    console.log('FPS after rapid changes:', fpsValue)
    expect(fpsValue).toBeGreaterThanOrEqual(30)
  })

  test('should measure memory usage during 500 item scroll', async ({ page, context }) => {
    // Enable metrics collection
    const cdpSession = await context.newCDPSession(page)

    await page.goto('/templates/test-performance')
    await page.waitForLoadState('networkidle')

    // Load 500 items
    await page.click('button:has-text("500 items")')
    await page.waitForTimeout(2000)

    // Get initial memory
    const initialMetrics = await cdpSession.send('Performance.getMetrics')
    const initialHeap = initialMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0

    // Scroll for 10 seconds
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const scrollContainer = document.querySelector('[class*="overflow-auto"]') as HTMLElement
        let scrollTop = 0

        const scrollInterval = setInterval(() => {
          scrollTop += 150
          scrollContainer.scrollTop = scrollTop

          if (scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
            scrollTop = 0
          }
        }, 16)

        setTimeout(() => {
          clearInterval(scrollInterval)
          resolve()
        }, 10000)
      })
    })

    // Get final memory
    const finalMetrics = await cdpSession.send('Performance.getMetrics')
    const finalHeap = finalMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0

    const heapGrowth = finalHeap - initialHeap
    const heapGrowthMB = heapGrowth / (1024 * 1024)

    console.log('Memory Usage:', {
      initial: `${(initialHeap / (1024 * 1024)).toFixed(2)} MB`,
      final: `${(finalHeap / (1024 * 1024)).toFixed(2)} MB`,
      growth: `${heapGrowthMB.toFixed(2)} MB`,
    })

    // Verify reasonable memory usage
    // Should not grow more than 50MB during scrolling
    expect(heapGrowthMB).toBeLessThan(50)
  })
})
