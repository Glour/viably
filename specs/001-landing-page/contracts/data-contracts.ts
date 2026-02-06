/**
 * Data Contracts: Landing Page
 *
 * Feature: 001-landing-page
 * Date: 2026-02-06
 *
 * TypeScript type definitions and Zod schemas for landing page data entities.
 * These contracts ensure type safety between data sources and components.
 */

import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Template Card
 *
 * Represents a bot template shown in Templates Preview section.
 */
export interface TemplateCard {
  /** Unique identifier (slug format recommended) */
  id: string
  /** Single emoji character for visual representation */
  emoji: string
  /** Display name of the template */
  name: string
  /** Cost to use this template in credits */
  costInCredits: number
  /** Optional category for grouping (future use) */
  category?: string
}

/**
 * Pricing Plan
 *
 * Represents a subscription plan shown in Pricing section.
 */
export interface PricingPlan {
  /** Plan identifier */
  id: 'free' | 'starter' | 'pro'
  /** Display name */
  name: string
  /** Price in rubles per month */
  monthlyPrice: number
  /** Price in rubles per year (should be ~monthlyPrice * 12 * 0.8) */
  yearlyPrice: number
  /** Credits allocated per month */
  creditsPerMonth: number | 'unlimited'
  /** Maximum number of projects allowed */
  maxProjects: number | 'unlimited'
  /** List of features included in plan */
  features: string[]
  /** Support tier provided */
  supportLevel: 'community' | 'priority' | 'custom'
  /** Whether to show "Popular" badge and gradient border */
  popular: boolean
  /** Call-to-action button text */
  ctaLabel: string
  /** URL for CTA button (relative or absolute) */
  ctaLink: string
}

/**
 * Billing Period
 *
 * User selection for pricing display.
 */
export type BillingPeriod = 'monthly' | 'yearly'

/**
 * Navigation Item
 *
 * Represents a link in header or footer navigation.
 */
export interface NavigationItem {
  /** Unique identifier */
  id: string
  /** Display text */
  label: string
  /** Navigation target URL or anchor */
  href: string
  /** Link type determines rendering behavior */
  type: 'internal' | 'external' | 'anchor'
  /** Optional icon name (Lucide icons) for footer social links */
  icon?: string
  /** Whether link opens in new tab */
  external: boolean
}

/**
 * Glow Orb Configuration
 *
 * Visual effect configuration for background glow orbs in Hero section.
 */
export interface GlowOrbConfig {
  /** Unique identifier */
  id: string
  /** RGBA color value (CSS format) */
  color: string
  /** Diameter in pixels (300-600 recommended) */
  size: number
  /** CSS blur filter value in pixels (40-80 recommended) */
  blurAmount: number
  /** Initial X position (CSS value: %, px) */
  initialX: string
  /** Initial Y position (CSS value: %, px) */
  initialY: string
  /** Mouse movement multiplier (0.1-0.5 for subtle effect) */
  parallaxFactor: number
}

/**
 * Animation Configuration
 *
 * Motion animation settings for scroll-triggered effects.
 */
export interface AnimationConfig {
  /** Animation duration in seconds */
  duration?: number
  /** Delay before animation starts in seconds */
  delay?: number
  /** Delay between staggered items in seconds */
  staggerDelay?: number
  /** Viewport tracking settings */
  viewport?: {
    /** Trigger animation only once */
    once?: boolean
    /** Portion of element that must be visible (0-1) */
    amount?: number
  }
}

// ============================================================================
// ZOD SCHEMAS (Runtime Validation)
// ============================================================================

/**
 * Template Card Schema
 *
 * Runtime validation for template data from API or static sources.
 */
export const templateCardSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  emoji: z.string().length(1, 'Emoji must be a single character'),
  name: z.string().min(2, 'Template name too short').max(50, 'Template name too long'),
  costInCredits: z.number().int().positive('Cost must be a positive integer'),
  category: z.string().optional(),
})

/**
 * Pricing Plan Schema
 *
 * Runtime validation for pricing plan data.
 */
export const pricingPlanSchema = z.object({
  id: z.enum(['free', 'starter', 'pro'], {
    errorMap: () => ({ message: 'Invalid plan ID' })
  }),
  name: z.string().min(1, 'Plan name is required'),
  monthlyPrice: z.number().int().nonnegative('Monthly price cannot be negative'),
  yearlyPrice: z.number().int().nonnegative('Yearly price cannot be negative'),
  creditsPerMonth: z.union([
    z.number().int().positive('Credits must be positive'),
    z.literal('unlimited')
  ]),
  maxProjects: z.union([
    z.number().int().positive('Max projects must be positive'),
    z.literal('unlimited')
  ]),
  features: z.array(z.string()).min(1, 'At least one feature required'),
  supportLevel: z.enum(['community', 'priority', 'custom'], {
    errorMap: () => ({ message: 'Invalid support level' })
  }),
  popular: z.boolean(),
  ctaLabel: z.string().min(1, 'CTA label is required'),
  ctaLink: z.string().refine(
    (val) => val.startsWith('/') || val.startsWith('http'),
    'CTA link must be a valid URL or relative path'
  ),
})

/**
 * Navigation Item Schema
 */
export const navigationItemSchema = z.object({
  id: z.string().min(1, 'Navigation item ID is required'),
  label: z.string().min(3, 'Label too short').max(20, 'Label too long'),
  href: z.string().min(1, 'href is required'),
  type: z.enum(['internal', 'external', 'anchor']),
  icon: z.string().optional(),
  external: z.boolean(),
})

/**
 * Glow Orb Config Schema
 */
export const glowOrbConfigSchema = z.object({
  id: z.string().min(1),
  color: z.string().regex(/^rgba?\(/, 'Color must be in rgba() format'),
  size: z.number().min(300).max(600),
  blurAmount: z.number().min(40).max(80),
  initialX: z.string(),
  initialY: z.string(),
  parallaxFactor: z.number().min(0.1).max(0.5),
})

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for TemplateCard
 */
export function isTemplateCard(value: unknown): value is TemplateCard {
  return templateCardSchema.safeParse(value).success
}

/**
 * Type guard for PricingPlan
 */
export function isPricingPlan(value: unknown): value is PricingPlan {
  return pricingPlanSchema.safeParse(value).success
}

/**
 * Type guard for NavigationItem
 */
export function isNavigationItem(value: unknown): value is NavigationItem {
  return navigationItemSchema.safeParse(value).success
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate yearly price with discount
 *
 * @param monthlyPrice - Price per month in rubles
 * @param discountPercent - Discount percentage (default: 20)
 * @returns Yearly price with discount applied
 */
export function calculateYearlyPrice(
  monthlyPrice: number,
  discountPercent: number = 20
): number {
  const yearlyBase = monthlyPrice * 12
  const discount = yearlyBase * (discountPercent / 100)
  return Math.round(yearlyBase - discount)
}

/**
 * Get display price based on billing period
 *
 * @param plan - Pricing plan
 * @param period - Billing period (monthly or yearly)
 * @returns Price to display
 */
export function getDisplayPrice(
  plan: PricingPlan,
  period: BillingPeriod
): number {
  return period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
}

/**
 * Calculate monthly equivalent for yearly price
 *
 * @param yearlyPrice - Yearly price in rubles
 * @returns Monthly equivalent price
 */
export function getMonthlyEquivalent(yearlyPrice: number): number {
  return Math.round(yearlyPrice / 12)
}

/**
 * Validate template emoji is a single character
 *
 * @param emoji - String to validate
 * @returns true if valid emoji
 */
export function isValidEmoji(emoji: string): boolean {
  return emoji.length === 1
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default billing period
 */
export const DEFAULT_BILLING_PERIOD: BillingPeriod = 'monthly'

/**
 * Yearly discount percentage
 */
export const YEARLY_DISCOUNT_PERCENT = 20

/**
 * LocalStorage key for billing period preference
 */
export const BILLING_PERIOD_STORAGE_KEY = 'viably_pricing_period'

/**
 * Animation defaults for landing page
 */
export const DEFAULT_ANIMATION_CONFIG: Required<AnimationConfig> = {
  duration: 0.6,
  delay: 0,
  staggerDelay: 0.1,
  viewport: {
    once: true,
    amount: 0.3,
  },
}

/**
 * Glow orb color palette (from design system)
 */
export const GLOW_ORB_COLORS = {
  purple: 'rgba(139, 92, 246, 0.6)', // purple-500
  blue: 'rgba(59, 130, 246, 0.6)',   // blue-500
  cyan: 'rgba(6, 182, 212, 0.6)',    // cyan-500
} as const

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  TemplateCard,
  PricingPlan,
  BillingPeriod,
  NavigationItem,
  GlowOrbConfig,
  AnimationConfig,
}

export {
  templateCardSchema,
  pricingPlanSchema,
  navigationItemSchema,
  glowOrbConfigSchema,
  isTemplateCard,
  isPricingPlan,
  isNavigationItem,
  calculateYearlyPrice,
  getDisplayPrice,
  getMonthlyEquivalent,
  isValidEmoji,
  DEFAULT_BILLING_PERIOD,
  YEARLY_DISCOUNT_PERCENT,
  BILLING_PERIOD_STORAGE_KEY,
  DEFAULT_ANIMATION_CONFIG,
  GLOW_ORB_COLORS,
}
