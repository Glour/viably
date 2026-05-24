import type { Project, ProjectStatus } from "@/shared/types"

/**
 * Generates mock projects for testing virtualization performance
 * Usage: Add to projects page temporarily for testing
 *
 * @example
 * ```tsx
 * import { generateMockProjects } from "@/shared/lib/utils/mock-projects"
 *
 * // In your component
 * const mockProjects = generateMockProjects(500)
 * ```
 */
export function generateMockProjects(count: number): Project[] {
  const statuses: ProjectStatus[] = [
    "draft",
    "generating",
    "generated",
    "deployed",
    "failed",
    "stopped",
  ]

  const categories = ["telegram_bot", "discord_bot", "slack_bot", "web_app"]

  const emojis = ["bot", "rocket", "zap", "target", "gem", "flame", "sparkles", "palette", "star", "tent"]

  const descriptions = [
    "A powerful bot for automated customer support",
    "Real-time notifications and alerts system",
    "Interactive quiz and survey bot",
    "E-commerce integration with payment processing",
    "Community management and moderation tools",
    "Analytics and reporting dashboard",
    "Workflow automation and task scheduling",
    "Content distribution and marketing automation",
    "Data collection and form processing",
    "Integration hub for third-party services",
  ]

  return Array.from({ length: count }, (_, i) => {
    const createdDate = new Date()
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 365))

    const updatedDate = new Date(createdDate)
    updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 30))

    const status = statuses[i % statuses.length] as ProjectStatus
    const hasDeployment = status === "deployed"

    return {
      id: `mock-project-${i}`,
      name: `Project ${String(i + 1).padStart(4, "0")}`,
      emoji: emojis[i % emojis.length],
      description: descriptions[i % descriptions.length],
      status,
      category: categories[i % categories.length] as any,
      createdAt: createdDate.toISOString(),
      updatedAt: updatedDate.toISOString(),
      config: {
        bot_token: "***",
        api_key: "***",
      },
      deployment: hasDeployment
        ? {
            url: `https://t.me/bot${i}`,
            botUsername: `@test_bot_${i}`,
            status: "running" as const,
            runningSince: updatedDate.toISOString(),
            costEstimate: "$0.50/day",
          }
        : null,
      files: [],
      envVars: [],
      logs: [],
    }
  })
}

/**
 * Measures rendering performance
 *
 * @example
 * ```tsx
 * const perfMetrics = measureRenderPerformance(() => {
 *   // Render component or perform operation
 * })
 * console.log('Render time:', perfMetrics.duration, 'ms')
 * ```
 */
export function measureRenderPerformance(
  operation: () => void
): { duration: number; timestamp: number } {
  const start = performance.now()
  operation()
  const end = performance.now()

  return {
    duration: end - start,
    timestamp: Date.now(),
  }
}

/**
 * Logs performance metrics to console in a formatted way
 */
export function logPerformanceMetrics(
  label: string,
  metrics: { duration: number; timestamp: number }
): void {
  console.group(`⚡ Performance: ${label}`)
  console.log(`Duration: ${metrics.duration.toFixed(2)}ms`)
  console.log(`Timestamp: ${new Date(metrics.timestamp).toLocaleTimeString()}`)
  console.groupEnd()
}

/**
 * Creates a performance observer for debugging
 * Useful for tracking paint, layout, and render times
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const observer = createPerformanceObserver('ProjectsList')
 *   return () => observer?.disconnect()
 * }, [])
 * ```
 */
export function createPerformanceObserver(
  componentName: string
): PerformanceObserver | null {
  if (typeof window === "undefined" || !window.PerformanceObserver) {
    return null
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`[${componentName}] ${entry.name}:`, entry.duration.toFixed(2), "ms")
    }
  })

  try {
    observer.observe({ entryTypes: ["measure", "paint"] })
    return observer
  } catch (error) {
    console.error("Performance observer not supported:", error)
    return null
  }
}
