/**
 * Email Templates for Viably
 *
 * React Email templates for transactional emails
 * All templates are cross-client compatible with inline styles
 */

export { default as WelcomeEmail } from './welcome'
export type { WelcomeEmailProps } from './welcome'

export { default as GenerationCompleteEmail } from './generation-complete'
export type { GenerationCompleteEmailProps } from './generation-complete'

export { default as DeploySuccessEmail } from './deploy-success'
export type { DeploySuccessEmailProps } from './deploy-success'

export { default as LowCreditsEmail } from './low-credits'
export type { LowCreditsEmailProps } from './low-credits'

// Re-export reusable components
export * from './components'
