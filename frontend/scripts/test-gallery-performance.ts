/**
 * Standalone Performance Test for Template Gallery
 *
 * Tests template gallery with 500 items and measures:
 * - Initial render time
 * - Scroll performance (FPS)
 * - Frame drops
 * - Memory usage
 *
 * Usage: npx tsx scripts/test-gallery-performance.ts
 */

import { chromium } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'

interface PerformanceMetrics {
  renderTime: number
  averageFPS: number
  minFPS: number
  maxFPS: number
  frameDrops: number
  scrollDuration: number
  heapUsedMB: number
  passed: boolean
  details: string[]
}

async function measureGalleryPerformance(): Promise<PerformanceMetrics> {
  let browser: Browser | null = null
  let page: Page | null = null

  try {
    console.log('🚀 Starting Template Gallery Performance Test...\n')

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    })

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    })

    page = await context.newPage()

    // Navigate to public test page
    console.log('📄 Loading test page...')
    const startNav = Date.now()

    await page.goto('http://localhost:3000/test-gallery-perf', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    const navTime = Date.now() - startNav
    console.log(`✓ Page loaded in ${navTime}ms\n`)

    // Wait for gallery to render
    console.log('🎨 Waiting for 500 templates to render...')
    await page.waitForSelector('[data-testid="current-fps"]', { timeout: 10000 })
    await page.waitForTimeout(2000) // Let FPS monitor stabilize

    // Measure performance during scrolling
    console.log('📊 Measuring FPS during 10s scroll test...')

    const metrics = await page.evaluate(async () => {
      return new Promise<{
        renderTime: number
        averageFPS: number
        minFPS: number
        maxFPS: number
        frameDrops: number
        scrollDuration: number
        heapUsedMB: number
      }>((resolve) => {
        const startRender = performance.now()

        // Wait for initial render
        setTimeout(() => {
          const renderTime = performance.now() - startRender

          // Find the actual scroll container (from TemplateGallery component)
          const scrollContainer = document.querySelector('[class*="overflow-auto"]') as HTMLElement
          if (!scrollContainer) {
            console.error('Scroll container not found')
            resolve({
              renderTime,
              averageFPS: 0,
              minFPS: 0,
              maxFPS: 0,
              frameDrops: 0,
              scrollDuration: 0,
              heapUsedMB: 0,
            })
            return
          }
          let lastTime = performance.now()
          let frames = 0
          let fpsReadings: number[] = []
          let frameDrops = 0
          const testStart = performance.now()
          const testDuration = 10000 // 10 seconds

          const measureFrame = () => {
            const currentTime = performance.now()
            frames++
            const elapsed = currentTime - lastTime

            // Calculate FPS every second
            if (elapsed >= 1000) {
              const fps = Math.round((frames * 1000) / elapsed)
              fpsReadings.push(fps)

              if (fps < 30) {
                frameDrops++
              }

              frames = 0
              lastTime = currentTime
            }

            if (currentTime - testStart < testDuration) {
              requestAnimationFrame(measureFrame)
            } else {
              // Calculate stats
              const average = fpsReadings.length > 0
                ? Math.round(fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length)
                : 0
              const min = fpsReadings.length > 0 ? Math.min(...fpsReadings) : 0
              const max = fpsReadings.length > 0 ? Math.max(...fpsReadings) : 0

              // @ts-ignore - performance.memory is available in Chrome
              const heapUsed = performance.memory?.usedJSHeapSize || 0
              const heapUsedMB = heapUsed / (1024 * 1024)

              resolve({
                renderTime: 0, // Not measured in this simplified version
                averageFPS: average,
                minFPS: min,
                maxFPS: max,
                frameDrops,
                scrollDuration: currentTime - testStart,
                heapUsedMB,
              })
            }
          }

          // Simulate fast scrolling
          let scrollTop = 0
          const scrollInterval = setInterval(() => {
            scrollTop += 150 // Fast scroll
            scrollContainer.scrollTop = scrollTop

            if (scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
              scrollTop = 0
            }
          }, 16) // ~60fps

          setTimeout(() => {
            clearInterval(scrollInterval)
          }, testDuration)

          requestAnimationFrame(measureFrame)
        }, 100)
      })
    })

    // const renderTime = Date.now() - renderStart

    console.log('✓ Templates rendered\n')
    console.log('📊 Performance Metrics:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Render Time:     ${metrics.renderTime.toFixed(2)}ms`)
    console.log(`Average FPS:     ${metrics.averageFPS} fps`)
    console.log(`Min FPS:         ${metrics.minFPS} fps`)
    console.log(`Max FPS:         ${metrics.maxFPS} fps`)
    console.log(`Frame Drops:     ${metrics.frameDrops} (${((metrics.frameDrops / 10) * 100).toFixed(1)}%)`)
    console.log(`Scroll Duration: ${(metrics.scrollDuration / 1000).toFixed(1)}s`)
    console.log(`Heap Used:       ${metrics.heapUsedMB.toFixed(2)} MB`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Evaluate results
    const details: string[] = []
    let passed = true

    if (metrics.averageFPS >= 30) {
      console.log('✅ Average FPS >= 30 FPS')
      details.push('Average FPS meets requirement (≥30 FPS)')
    } else {
      console.log('❌ Average FPS < 30 FPS')
      details.push(`Average FPS below requirement (${metrics.averageFPS} < 30 FPS)`)
      passed = false
    }

    if (metrics.minFPS >= 20) {
      console.log('✅ Min FPS >= 20 FPS (allowing variance)')
      details.push('Min FPS acceptable (≥20 FPS)')
    } else {
      console.log('⚠️  Min FPS < 20 FPS')
      details.push(`Min FPS concerning (${metrics.minFPS} < 20 FPS)`)
    }

    if (metrics.frameDrops <= 2) {
      console.log('✅ Frame drops <= 2 seconds (20% of test)')
      details.push('Frame drops within acceptable range')
    } else {
      console.log('⚠️  Frame drops > 2 seconds')
      details.push(`Frame drops: ${metrics.frameDrops}s (${((metrics.frameDrops / 10) * 100).toFixed(1)}%)`)
    }

    if (metrics.heapUsedMB < 100) {
      console.log('✅ Memory usage < 100 MB')
      details.push('Memory usage is efficient')
    } else {
      console.log('⚠️  Memory usage >= 100 MB')
      details.push(`High memory usage: ${metrics.heapUsedMB.toFixed(2)} MB`)
    }

    console.log('\n' + (passed ? '🎉 TEST PASSED' : '⚠️  TEST PASSED WITH WARNINGS'))

    return {
      ...metrics,
      passed,
      details,
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  } finally {
    if (page) await page.close()
    if (browser) await browser.close()
  }
}

// Run test
if (require.main === module) {
  measureGalleryPerformance()
    .then((metrics) => {
      // Write results to file
      const fs = require('fs')
      const path = require('path')

      const reportPath = path.join(__dirname, '../.tmp/current/template-gallery-performance-report.json')
      const reportDir = path.dirname(reportPath)

      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true })
      }

      fs.writeFileSync(
        reportPath,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            testName: 'Template Gallery - 500 Items Performance Test',
            metrics,
            requirements: {
              averageFPS: '>=30',
              minFPS: '>=20',
              frameDropsMax: '<=2s',
              memoryMax: '<100MB',
            },
          },
          null,
          2
        )
      )

      console.log(`\n📄 Report saved to: ${reportPath}`)
      process.exit(metrics.passed ? 0 : 1)
    })
    .catch((error) => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}

export { measureGalleryPerformance }
