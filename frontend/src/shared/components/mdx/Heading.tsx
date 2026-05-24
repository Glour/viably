'use client'

import * as React from "react"
import { Link2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: React.ReactNode
}

/**
 * Custom heading component for MDX with automatic anchor links
 * Generates slugs from heading text for deep linking
 */
export function Heading({ as: Component = 'h2', children, className, ...props }: HeadingProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  // Generate slug from text content
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Extract text content from children (handles nested elements)
  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(getTextContent).join('')
    if (React.isValidElement(node)) {
      const props = node.props as { children?: React.ReactNode }
      if (props.children) {
        return getTextContent(props.children)
      }
    }
    return ''
  }

  const textContent = getTextContent(children)
  const id = generateSlug(textContent)

  // Handle anchor link click
  const handleAnchorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      // Smooth scroll to element
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Update URL without triggering navigation
      window.history.pushState(null, '', `#${id}`)
    }
  }

  // Heading size variants
  const sizeClasses = {
    h1: 'text-4xl md:text-5xl font-bold tracking-tight scroll-mt-20 mb-6',
    h2: 'text-3xl md:text-4xl font-bold tracking-tight scroll-mt-20 mb-4 mt-12 first:mt-0',
    h3: 'text-2xl md:text-3xl font-semibold tracking-tight scroll-mt-20 mb-3 mt-10 first:mt-0',
    h4: 'text-xl md:text-2xl font-semibold tracking-tight scroll-mt-20 mb-3 mt-8 first:mt-0',
    h5: 'text-lg md:text-xl font-semibold tracking-tight scroll-mt-20 mb-2 mt-6 first:mt-0',
    h6: 'text-base md:text-lg font-semibold tracking-tight scroll-mt-20 mb-2 mt-6 first:mt-0',
  }

  return (
    <Component
      id={id}
      className={cn(
        'font-heading text-foreground group relative flex items-center',
        sizeClasses[Component],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <a
        href={`#${id}`}
        onClick={handleAnchorClick}
        className="absolute -left-8 flex items-center justify-center w-6 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label={`Link to ${textContent}`}
        tabIndex={isHovered ? 0 : -1}
      >
        <Link2 className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
      </a>
      {children}
    </Component>
  )
}
