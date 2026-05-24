"use client"

import { useState, useRef } from "react"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Badge } from "@/shared/ui/badge"
import {
  ScrollPerformanceTester,
  generatePerformanceReport,
  formatPerformanceReport,
  downloadPerformanceReport,
  getBrowserInfo,
  type PerformanceMetrics,
  type PerformanceReport,
} from "@/shared/lib/test-utils/performance"
import {
  generateMockTemplates,
  generateMockProjects,
  seedTemplatesStore,
  seedProjectsStore,
  clearMockData,
} from "@/shared/lib/test-utils/mock-data"
import { TemplateGallery } from "@/features/templates/components"
import { ProjectsList } from "@/features/projects/components/projects-list"
import type { Template, Project } from "@/shared/types"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TestType = "templates" | "projects-grid" | "projects-list"

interface TestConfig {
  type: TestType
  itemCount: number
  duration: number
  scrollSpeed: number
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PerformanceTester() {
  const [config, setConfig] = useState<TestConfig>({
    type: "templates",
    itemCount: 500,
    duration: 5000,
    scrollSpeed: 10,
  })

  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const testerRef = useRef(new ScrollPerformanceTester())

  const browserInfo = getBrowserInfo()

  // Generate test data
  const handleGenerateData = () => {
    clearMockData()
    setReport(null)

    if (config.type === "templates") {
      const mockTemplates = generateMockTemplates(config.itemCount)
      setTemplates(mockTemplates)
      seedTemplatesStore(config.itemCount)
    } else {
      const mockProjects = generateMockProjects(config.itemCount)
      setProjects(mockProjects)
      seedProjectsStore(config.itemCount)
    }
  }

  // Run performance test
  const handleRunTest = async () => {
    if (!containerRef.current) return

    setIsRunning(true)
    setReport(null)

    try {
      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Run test
      const metrics = await testerRef.current.test(containerRef.current, {
        duration: config.duration,
        scrollSpeed: config.scrollSpeed,
      })

      // Add total items to metrics
      const metricsWithTotal: PerformanceMetrics = {
        ...metrics,
        totalItems: config.itemCount,
      }

      // Generate report
      const testName = `${config.type}-${config.itemCount}-items`
      const performanceReport = generatePerformanceReport(testName, metricsWithTotal)

      setReport(performanceReport)
    } catch (error) {
      console.error("Performance test failed:", error)
    } finally {
      setIsRunning(false)
      testerRef.current.reset()
    }
  }

  // Clear test data
  const handleClear = () => {
    clearMockData()
    setTemplates([])
    setProjects([])
    setReport(null)
  }

  // Download report
  const handleDownload = () => {
    if (report) {
      downloadPerformanceReport(report)
    }
  }

  const hasData =
    config.type === "templates" ? templates.length > 0 : projects.length > 0

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Performance Test Configuration</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Test Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Type</label>
            <Select
              value={config.type}
              onValueChange={(value) =>
                setConfig({ ...config, type: value as TestType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="templates">Templates Gallery</SelectItem>
                <SelectItem value="projects-grid">Projects Grid</SelectItem>
                <SelectItem value="projects-list">Projects List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Item Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Item Count</label>
            <Select
              value={config.itemCount.toString()}
              onValueChange={(value) =>
                setConfig({ ...config, itemCount: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 items</SelectItem>
                <SelectItem value="250">250 items</SelectItem>
                <SelectItem value="500">500 items</SelectItem>
                <SelectItem value="1000">1000 items</SelectItem>
                <SelectItem value="2000">2000 items</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (ms)</label>
            <Select
              value={config.duration.toString()}
              onValueChange={(value) =>
                setConfig({ ...config, duration: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3000">3 seconds</SelectItem>
                <SelectItem value="5000">5 seconds</SelectItem>
                <SelectItem value="10000">10 seconds</SelectItem>
                <SelectItem value="15000">15 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scroll Speed */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Scroll Speed</label>
            <Select
              value={config.scrollSpeed.toString()}
              onValueChange={(value) =>
                setConfig({ ...config, scrollSpeed: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Slow (5px/frame)</SelectItem>
                <SelectItem value="10">Normal (10px/frame)</SelectItem>
                <SelectItem value="20">Fast (20px/frame)</SelectItem>
                <SelectItem value="30">Very Fast (30px/frame)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button onClick={handleGenerateData} disabled={isRunning}>
            Generate Test Data
          </Button>
          <Button
            onClick={handleRunTest}
            disabled={!hasData || isRunning}
            variant="default"
          >
            {isRunning ? "Running Test..." : "Run Performance Test"}
          </Button>
          <Button onClick={handleClear} variant="outline" disabled={isRunning}>
            Clear Data
          </Button>
          {report && (
            <Button onClick={handleDownload} variant="outline">
              Download Report
            </Button>
          )}
        </div>

        {/* Browser Info */}
        <div className="mt-4 text-sm text-muted-foreground">
          <strong>Browser:</strong> {browserInfo.browser} {browserInfo.version}
        </div>
      </Card>

      {/* Performance Report */}
      {report && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Performance Report</h2>
            <Badge variant={report.passed ? "default" : "destructive"}>
              {report.passed ? "✅ PASSED" : "❌ FAILED"}
            </Badge>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* FPS Metrics */}
            <div className="space-y-2">
              <h3 className="font-semibold">FPS Metrics</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Average:</strong>{" "}
                  <span
                    className={
                      report.metrics.avgFps >= 50
                        ? "text-green-600 dark:text-green-400"
                        : report.metrics.avgFps >= 30
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                    }
                  >
                    {report.metrics.avgFps} FPS
                  </span>
                </div>
                <div>
                  <strong>Minimum:</strong>{" "}
                  <span
                    className={
                      report.metrics.minFps >= 30
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {report.metrics.minFps} FPS
                  </span>
                </div>
                <div>
                  <strong>Maximum:</strong> {report.metrics.maxFps} FPS
                </div>
              </div>
            </div>

            {/* Memory Metrics */}
            <div className="space-y-2">
              <h3 className="font-semibold">Memory Metrics</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Used:</strong> {report.metrics.memoryUsed.toFixed(2)}{" "}
                  MB
                </div>
                <div>
                  <strong>Delta:</strong>{" "}
                  <span
                    className={
                      report.metrics.memoryDelta <= 100
                        ? "text-green-600 dark:text-green-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }
                  >
                    {report.metrics.memoryDelta.toFixed(2)} MB
                  </span>
                </div>
              </div>
            </div>

            {/* Rendering Metrics */}
            <div className="space-y-2">
              <h3 className="font-semibold">Rendering Metrics</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Items Rendered:</strong> {report.metrics.itemsRendered}
                </div>
                <div>
                  <strong>Total Items:</strong> {report.metrics.totalItems}
                </div>
                <div>
                  <strong>Scroll Duration:</strong>{" "}
                  {report.metrics.scrollDuration.toFixed(0)} ms
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {report.notes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Analysis</h3>
              <ul className="space-y-1 text-sm">
                {report.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Report */}
          <details className="mt-6">
            <summary className="cursor-pointer font-semibold">
              View Full Report (Markdown)
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
              {formatPerformanceReport(report)}
            </pre>
          </details>
        </Card>
      )}

      {/* Test Container */}
      {hasData && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">
            Test Container ({config.itemCount} items)
          </h2>

          <div ref={containerRef} className="relative">
            {config.type === "templates" && templates.length > 0 && (
              <TemplateGallery templates={templates} />
            )}

            {config.type === "projects-grid" && projects.length > 0 && (
              <ProjectsList
                projects={projects}
                viewMode="grid"
                onDelete={() => {}}
              />
            )}

            {config.type === "projects-list" && projects.length > 0 && (
              <ProjectsList
                projects={projects}
                viewMode="list"
                onDelete={() => {}}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
