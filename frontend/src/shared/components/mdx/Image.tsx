'use client'

import * as React from "react"
import NextImage from "next/image"
import { cn } from "@/shared/lib/utils"

interface ImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  caption?: string
  className?: string
  priority?: boolean
}

/**
 * Optimized image component for MDX documentation
 * Uses Next.js Image component with automatic optimization
 */
export function Image({
  src,
  alt,
  width,
  height,
  caption,
  className,
  priority = false,
}: ImageProps) {
  const [isLoading, setIsLoading] = React.useState(true)

  // Determine if this is an external URL
  const isExternal = src.startsWith('http://') || src.startsWith('https://')

  return (
    <figure className={cn('my-8 overflow-hidden rounded-lg', className)}>
      <div className="relative">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
        )}

        {/* Image */}
        <NextImage
          src={src}
          alt={alt}
          width={width || 1200}
          height={height || 630}
          priority={priority}
          className={cn(
            'w-full h-auto rounded-lg border border-border transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          {...(isExternal && { unoptimized: true })}
        />
      </div>

      {/* Optional caption */}
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * Image grid component for displaying multiple images in a grid layout
 */
interface ImageGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function ImageGrid({ children, columns = 2, className }: ImageGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div
      className={cn(
        'grid gap-4 my-8',
        gridClasses[columns],
        className
      )}
    >
      {children}
    </div>
  )
}
