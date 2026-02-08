"use client"

import { useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { TemplateCard } from "./template-card"
import type { Template } from "@/types"

interface TemplateGalleryProps {
  templates: Template[]
  columns?: number
}

/**
 * Virtualized template gallery component
 * Efficiently renders large lists of templates using TanStack Virtual
 *
 * Performance optimizations:
 * - Virtual scrolling for 500+ items
 * - Dynamic row height calculation
 * - GPU-accelerated transforms
 * - Responsive column count
 */
export function TemplateGallery({
  templates,
  columns = 3
}: TemplateGalleryProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate items per row based on responsive columns
  const itemsPerRow = columns
  const rowCount = Math.ceil(templates.length / itemsPerRow)

  // Initialize virtualizer for rows (not individual items)
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Estimated row height in pixels (card height + gap)
    overscan: 2, // Render 2 extra rows above/below viewport for smoother scrolling
    measureElement:
      typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalHeight = rowVirtualizer.getTotalSize()

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-20rem)] overflow-auto"
      style={{
        contain: "strict", // CSS containment for better performance
      }}
    >
      {/* Virtual container with total height */}
      <div
        style={{
          height: `${totalHeight}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {/* Render only visible rows */}
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * itemsPerRow
          const endIndex = Math.min(startIndex + itemsPerRow, templates.length)
          const rowTemplates = templates.slice(startIndex, endIndex)

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`, // GPU-accelerated positioning
              }}
            >
              {/* Grid row container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {rowTemplates.map((template) => (
                  <TemplateCard key={template.slug} template={template} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
