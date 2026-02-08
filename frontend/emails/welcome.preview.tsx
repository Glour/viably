import WelcomeEmail from './welcome'
import type { WelcomeEmailProps } from './welcome'

/**
 * Preview data for Welcome email template
 * Used for development and testing in React Email dev server
 */
export const previewProps: WelcomeEmailProps = {
  userName: 'Alex',
  userEmail: 'alex@example.com',
  credits: 100,
  dashboardUrl: 'https://viably.dev/dashboard',
}

/**
 * Email preview component
 * Visible in React Email dev server at http://localhost:3000
 */
export default function Preview() {
  return <WelcomeEmail {...previewProps} />
}
