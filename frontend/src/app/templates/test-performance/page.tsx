"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/widgets/layout"
import { TemplateGallery } from "@/features/templates/components/template-gallery"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { generateMockTemplates, FPSMonitor } from "@/shared/lib/test-utils/generate-mock-templates"

/**
 * Performance testing page for TemplateGallery virtualization
 *
 * Tests:
 * - Rendering 500+ items
 * - Scroll performance (FPS monitoring)
 * - Memory usage
 * - GPU acceleration
 */
export default function TemplatePerformanceTestPage() {
  const [templateCount, setTemplateCount] = useState(100)
  const [templates, setTemplates] = useState(() => generateMockTemplates(100))
  const [fpsStats, setFpsStats] = useState({ current: 0, average: 0, min: 0 })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [monitor] = useState(() => new FPSMonitor())

  const updateTemplateCount = (count: number) => {
    setTemplateCount(count)
    setTemplates(generateMockTemplates(count))
  }

  const startMonitoring = () => {
    monitor.start()
    setIsMonitoring(true)

    // Update stats every 500ms
    const interval = setInterval(() => {
      setFpsStats(monitor.getStats())
    }, 500)

    return () => {
      clearInterval(interval)
      monitor.stop()
    }
  }

  const stopMonitoring = () => {
    monitor.stop()
    setIsMonitoring(false)
  }

  useEffect(() => {
    if (isMonitoring) {
      const cleanup = startMonitoring()
      return cleanup
    }
  }, [isMonitoring])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Template Gallery Performance Test
          </h1>
          <p className="mt-2 text-muted-foreground">
            Testing virtualization with TanStack Virtual
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center p-4 rounded-lg border bg-card">
          <div className="flex gap-2">
            <Button
              variant={templateCount === 100 ? "default" : "outline"}
              onClick={() => updateTemplateCount(100)}
              size="sm"
            >
              100 items
            </Button>
            <Button
              variant={templateCount === 500 ? "default" : "outline"}
              onClick={() => updateTemplateCount(500)}
              size="sm"
            >
              500 items
            </Button>
            <Button
              variant={templateCount === 1000 ? "default" : "outline"}
              onClick={() => updateTemplateCount(1000)}
              size="sm"
            >
              1000 items
            </Button>
            <Button
              variant={templateCount === 2000 ? "default" : "outline"}
              onClick={() => updateTemplateCount(2000)}
              size="sm"
            >
              2000 items
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
          >
            {isMonitoring ? "Stop Monitoring" : "Start FPS Monitor"}
          </Button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 p-4 rounded-lg border bg-card">
          <div>
            <p className="text-sm text-muted-foreground">Total Templates</p>
            <p className="text-2xl font-bold">{templates.length}</p>
          </div>

          {isMonitoring && (
            <>
              <div className="h-auto w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Current FPS</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{fpsStats.current}</p>
                  <Badge variant={fpsStats.current >= 30 ? "default" : "destructive"}>
                    {fpsStats.current >= 30 ? "Good" : "Poor"}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Average FPS</p>
                <p className="text-2xl font-bold">{fpsStats.average}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Min FPS</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{fpsStats.min}</p>
                  <Badge variant={fpsStats.min >= 30 ? "default" : "destructive"}>
                    {fpsStats.min >= 30 ? "✓" : "✗"}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-lg border bg-muted/50">
          <h3 className="font-semibold mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Select number of templates to render</li>
            <li>Click "Start FPS Monitor" to begin performance tracking</li>
            <li>Scroll through the gallery rapidly</li>
            <li>Observe FPS metrics - should stay above 30 FPS for smooth experience</li>
            <li>Test with different item counts (500+, 1000+, 2000+)</li>
          </ol>
        </div>

        {/* Gallery */}
        <TemplateGallery templates={templates} />
      </div>
    </MainLayout>
  )
}
