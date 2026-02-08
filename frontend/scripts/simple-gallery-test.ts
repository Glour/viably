/**
 * Simple Gallery Performance Validation
 *
 * Takes screenshots and reads FPS values from the rendered page
 */

import { chromium } from '@playwright/test'

async function simpleGalleryTest() {
  console.log('🚀 Starting Simple Gallery Performance Test...\n')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  try {
    // Navigate to test page
    console.log('📄 Loading test page...')
    await page.goto('http://localhost:3000/test-gallery-perf', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    console.log('✓ Page loaded')

    // Wait for content to stabilize
    console.log('⏳ Waiting 5 seconds for FPS monitoring to start...')
    await page.waitForTimeout(5000)

    // Take initial screenshot
    await page.screenshot({
      path: '.tmp/current/gallery-500-initial.png',
      fullPage: false,
    })
    console.log('✓ Initial screenshot saved')

    // Scroll the gallery
    console.log('🔄 Scrolling gallery for 10 seconds...')
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const scrollContainer = document.querySelector('[class*="overflow-auto"]') as HTMLElement
        if (!scrollContainer) {
          resolve()
          return
        }

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

    console.log('✓ Scrolling complete')

    // Wait for FPS to stabilize
    await page.waitForTimeout(2000)

    // Take final screenshot
    await page.screenshot({
      path: '.tmp/current/gallery-500-final.png',
      fullPage: false,
    })
    console.log('✓ Final screenshot saved')

    // Try to read FPS values
    const fpsData = await page.evaluate(() => {
      // Find FPS values by looking for text near "Current FPS", "Average FPS", "Min FPS"
      const allText = document.body.innerText
      const currentMatch = allText.match(/Current FPS\s*(\d+)/i)
      const averageMatch = allText.match(/Average FPS\s*(\d+)/i)
      const minMatch = allText.match(/Min FPS\s*(\d+)/i)

      return {
        current: currentMatch ? parseInt(currentMatch[1], 10) : 0,
        average: averageMatch ? parseInt(averageMatch[1], 10) : 0,
        min: minMatch ? parseInt(minMatch[1], 10) : 0,
        bodyText: allText.substring(0, 500), // First 500 chars for debugging
      }
    })

    console.log('\n📊 FPS Metrics:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Current FPS: ${fpsData.current}`)
    console.log(`Average FPS: ${fpsData.average}`)
    console.log(`Min FPS:     ${fpsData.min}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Evaluate results
    const passed = fpsData.average >= 30
    console.log(passed ? '✅ TEST PASSED' : '❌ TEST FAILED')
    console.log(`Average FPS: ${fpsData.average} (requirement: ≥30)`)

    if (fpsData.min > 0) {
      console.log(`Min FPS: ${fpsData.min} (target: ≥20)`)
    }

    // Save report
    const fs = require('fs')
    const reportPath = '.tmp/current/gallery-performance-results.json'

    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          testName: 'Template Gallery - 500 Items',
          metrics: fpsData,
          passed,
          screenshots: {
            initial: '.tmp/current/gallery-500-initial.png',
            final: '.tmp/current/gallery-500-final.png',
          },
        },
        null,
        2
      )
    )

    console.log(`\n📄 Report saved to: ${reportPath}`)
    console.log('\n🎯 Screenshots:')
    console.log(`   Initial: .tmp/current/gallery-500-initial.png`)
    console.log(`   Final:   .tmp/current/gallery-500-final.png`)

    // Keep browser open for manual inspection
    console.log('\n✋ Browser will stay open for 30 seconds for manual inspection...')
    await page.waitForTimeout(30000)

  } finally {
    await browser.close()
  }
}

simpleGalleryTest().catch(console.error)
