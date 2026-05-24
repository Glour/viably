import ResetPasswordEmail from './reset-password'
import type { ResetPasswordEmailProps } from './reset-password'

/**
 * Preview data for Reset Password email template
 * Used for development and testing in React Email dev server
 */
export const previewProps: ResetPasswordEmailProps = {
  userName: 'Alex',
  userEmail: 'alex@example.com',
  resetUrl: 'https://viably.dev/reset-password?token=abc123xyz789',
  expiresIn: 60,
  requestedAt: new Date().toISOString(),
  supportUrl: 'https://viably.dev/support',
}

/**
 * Email preview component
 * Visible in React Email dev server at http://localhost:3000
 */
export default function Preview() {
  return <ResetPasswordEmail {...previewProps} />
}
