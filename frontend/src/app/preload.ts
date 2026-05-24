/**
 * Preload critical resources to reduce initial load time
 * These functions tell the browser to fetch resources in parallel
 * before they're actually needed, reducing waterfall loading
 */

import { loader } from '@monaco-editor/react'

/**
 * Preload Monaco Editor for code editing pages
 * Call this in route segments that will use Monaco
 */
export function preloadMonaco() {
  if (typeof window !== 'undefined') {
    loader.init().catch(() => {
      // Silent fail - Monaco will load on-demand if preload fails
    })
  }
}

/**
 * Preload critical fonts
 * Should be called in root layout
 */
export function preloadFonts() {
  if (typeof window === 'undefined') return

  const fonts = [
    '/fonts/plus-jakarta-sans.woff2',
    '/fonts/inter.woff2',
    '/fonts/jetbrains-mono.woff2',
  ]

  fonts.forEach((font) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = font
    document.head.appendChild(link)
  })
}

/**
 * Preload API data for authenticated routes
 * Call this after user logs in
 */
export function preloadUserData() {
  if (typeof window === 'undefined') return

  // Prefetch common API endpoints
  const endpoints = ['/api/user/me', '/api/projects', '/api/templates']

  endpoints.forEach((endpoint) => {
    fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
    }).catch(() => {
      // Silent fail - data will load on-demand if prefetch fails
    })
  })
}
