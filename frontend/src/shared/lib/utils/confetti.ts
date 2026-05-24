/**
 * Confetti celebration utilities
 *
 * Triggers confetti animations for special moments like:
 * - Project deployment success (enabled)
 * - First artifact generated (disabled)
 * - Milestone achievements (disabled)
 */

import confetti from "canvas-confetti"

/**
 * Trigger confetti celebration for first artifact
 * DISABLED - was too annoying
 */
export function celebrateFirstArtifact() {
  // Disabled by user request
}

/**
 * Trigger quick burst confetti
 * Used for deployment success - ENABLED
 */
export function celebrateQuickWin() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#8B5CF6", "#3B82F6", "#06B6D4"],
  })
}

/**
 * Trigger fireworks confetti
 * DISABLED - was too annoying
 */
export function celebrateFireworks() {
  // Disabled
}
