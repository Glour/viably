"use client"

import { useState, useEffect, useRef } from "react"
import { TemplateGallery } from "@/components/templates/template-gallery"
import { generateMockTemplates, FPSMonitor } from "@/lib/test-utils/generate-mock-templates"

/**
 * Public performance test page (no auth required)
 * For automated testing of template gallery with 500 items
 */
export default function GalleryPerfTestPage() {
  const [templates] = useState(() => generateMockTemplates(500))
  const [fpsStats, setFpsStats] = useState({ current: 0, average: 0, min: 0 })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const monitorRef = useRef<FPSMonitor | null>(null)

  useEffect(() => {
    // Auto-start monitoring after mount
    const monitor = new FPSMonitor()
    monitorRef.current = monitor
    monitor.start()
    setIsMonitoring(true)

    const interval = setInterval(() => {
      setFpsStats(monitor.getStats())
    }, 500)

    return () => {
      clearInterval(interval)
      monitor.stop()
    }
  }, [])

  return (
    <div className="min-h-screen p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gallery Performance Test</h1>
        <p className="text-muted-foreground mt-2">500 templates loaded</p>
      </div>

      <div className="flex gap-6 mb-6 p-4 rounded-lg border bg-card">
        <div>
          <p className="text-sm text-muted-foreground">Current FPS</p>
          <p className="text-2xl font-bold" data-testid="current-fps">
            {fpsStats.current}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Average FPS</p>
          <p className="text-2xl font-bold" data-testid="average-fps">
            {fpsStats.average}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Min FPS</p>
          <p className="text-2xl font-bold" data-testid="min-fps">
            {fpsStats.min}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className={`text-lg font-semibold ${fpsStats.average >= 30 ? 'text-green-600' : 'text-red-600'}`}>
            {fpsStats.average >= 30 ? '✓ PASS' : '✗ FAIL'}
          </p>
        </div>
      </div>

      <TemplateGallery templates={templates} />
    </div>
  )
}
