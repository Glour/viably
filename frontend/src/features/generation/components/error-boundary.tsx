"use client"

import * as React from "react"
import { Button } from "@/shared/ui/button"
import { AlertCircle } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary for Generation Components
 *
 * Task: T062
 * Purpose: Catch React errors in generation flow and show fallback UI
 *
 * Features:
 * - Catches errors in child components
 * - Shows user-friendly error message
 * - Provides retry button to reset state
 * - Logs errors to console for debugging
 */
export class GenerationErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[GenerationErrorBoundary] Error caught:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-destructive/5 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 mb-4 text-destructive">
            <AlertCircle className="size-6" />
            <h2 className="text-lg font-heading font-semibold">Произошла ошибка</h2>
          </div>

          <p className="text-sm font-body text-muted-foreground mb-4 text-center max-w-md">
            Не удалось отобразить компонент генерации. Попробуйте обновить страницу или вернуться назад.
          </p>

          {this.state.error && (
            <pre className="text-xs font-code bg-muted p-3 rounded mb-4 overflow-auto max-w-full">
              {this.state.error.message}
            </pre>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={this.handleReset} className="font-body">
              Попробовать снова
            </Button>
            <Button onClick={() => window.location.reload()} className="font-body">
              Обновить страницу
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
