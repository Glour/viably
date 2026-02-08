import LowCreditsEmail from './low-credits'
import type { LowCreditsEmailProps } from './low-credits'

/**
 * Preview data for Low Credits email template
 * Used for development and testing in React Email dev server
 */
export const previewProps: LowCreditsEmailProps = {
  userName: 'Alex',
  creditsRemaining: 15,
  lowCreditsThreshold: 20,
  topUpUrl: 'https://viably.dev/credits/top-up',
  pricingUrl: 'https://viably.dev/pricing',
  dashboardUrl: 'https://viably.dev/dashboard',
}

/**
 * Email preview component
 * Visible in React Email dev server at http://localhost:3000
 */
export default function Preview() {
  return <LowCreditsEmail {...previewProps} />
}
