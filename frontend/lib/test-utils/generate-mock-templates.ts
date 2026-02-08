import type { Template } from "@/types"

/**
 * Generate mock templates for performance testing
 * Used to test virtualization with 500+ items
 */
export function generateMockTemplates(count: number): Template[] {
  const categories = ["telegram_bot"] as const
  const emojis = ["🤖", "💬", "🎮", "📊", "🛒", "📰", "🎵", "🎨", "🏋️", "🍕"]
  const features = [
    "Автоматические ответы",
    "Интеграция с API",
    "База данных пользователей",
    "Аналитика и статистика",
    "Мультиязычность",
    "Webhook поддержка",
    "Inline кнопки",
    "Админ-панель",
    "Платежи",
    "Модерация контента"
  ]

  return Array.from({ length: count }, (_, i) => {
    const emoji = emojis[i % emojis.length]
    const categoryIndex = i % categories.length
    const creditCost = 3 + (i % 15)

    return {
      slug: `mock-template-${i}`,
      name: `Template ${i + 1}`,
      emoji,
      description: `Mock template description for testing virtualization. This is template number ${i + 1} out of ${count} total templates.`,
      category: categories[categoryIndex],
      creditCost,
      features: features.slice(0, 4 + (i % 4)),
      tags: [`tag${i % 5}`, `feature${i % 7}`],
      configFields: [],
      isPopular: i % 10 === 0,
    }
  })
}

/**
 * FPS Monitor for performance testing
 */
export class FPSMonitor {
  private frames = 0
  private lastTime = performance.now()
  private fps = 0
  private fpsHistory: number[] = []
  private animationFrameId: number | null = null

  start() {
    const measureFPS = () => {
      this.frames++
      const currentTime = performance.now()
      const elapsed = currentTime - this.lastTime

      // Update FPS every second
      if (elapsed >= 1000) {
        this.fps = Math.round((this.frames * 1000) / elapsed)
        this.fpsHistory.push(this.fps)

        // Keep only last 10 seconds
        if (this.fpsHistory.length > 10) {
          this.fpsHistory.shift()
        }

        this.frames = 0
        this.lastTime = currentTime
      }

      this.animationFrameId = requestAnimationFrame(measureFPS)
    }

    this.animationFrameId = requestAnimationFrame(measureFPS)
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  getCurrentFPS(): number {
    return this.fps
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.fpsHistory.length)
  }

  getMinFPS(): number {
    if (this.fpsHistory.length === 0) return 0
    return Math.min(...this.fpsHistory)
  }

  getStats() {
    return {
      current: this.getCurrentFPS(),
      average: this.getAverageFPS(),
      min: this.getMinFPS(),
      history: [...this.fpsHistory]
    }
  }
}
