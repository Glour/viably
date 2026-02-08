"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#09090b",
          color: "#fafafa",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
            A critical error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#09090b",
              backgroundColor: "#fafafa",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
