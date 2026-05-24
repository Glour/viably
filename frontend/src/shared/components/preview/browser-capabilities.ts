import type { BrowserCapabilities } from './types'

/**
 * Check if current browser supports WebContainers.
 * Requires: SharedArrayBuffer + crossOriginIsolated + Atomics.waitAsync
 * WebContainers need all three — Safari < 16.4 is missing Atomics.waitAsync.
 */
export function canRunWebContainers(): boolean {
  // WebContainers disabled — requires COOP/COEP headers which break Sandpack.
  // Using Sandpack (react-ts template) as the primary preview engine instead.
  return false
}

/**
 * Check if current browser supports Sandpack (CodeSandbox).
 * Sandpack uses an external iframe bundler (sandpack-bundler.codesandbox.io) —
 * it does NOT require SharedArrayBuffer or Service Workers.
 * Works in all modern browsers including Safari iOS, HTTP contexts, and
 * browser test environments (Playwright, etc.).
 */
export function canRunSandpack(): boolean {
  if (typeof window === 'undefined') return false
  return true
}

export function getBrowserCapabilities(): BrowserCapabilities {
  if (typeof window === 'undefined') {
    return {
      supportsWebContainers: false,
      supportsSharedArrayBuffer: false,
      supportsCrossOriginIsolation: false,
      supportsAtomicsWaitAsync: false,
      supportsSandpack: false,
    }
  }
  const sab = typeof SharedArrayBuffer !== 'undefined'
  const coi = crossOriginIsolated
  const awa = typeof Atomics.waitAsync === 'function'
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  return {
    supportsWebContainers: !mobile && sab && coi && awa,
    supportsSharedArrayBuffer: sab,
    supportsCrossOriginIsolation: coi,
    supportsAtomicsWaitAsync: awa,
    supportsSandpack: canRunSandpack(),
  }
}
