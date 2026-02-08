import VerifyEmailEmail from './verify-email'
import type { VerifyEmailEmailProps } from './verify-email'

/**
 * Preview data for Verify Email template
 * Used for development and testing in React Email dev server
 */
export const previewProps: VerifyEmailEmailProps = {
  userName: 'Alex',
  userEmail: 'alex@example.com',
  verificationUrl: 'https://viably.dev/verify-email?token=abc123xyz789',
  verificationCode: '849372',
  expiresIn: 24,
  supportUrl: 'https://viably.dev/support',
}

/**
 * Email preview component
 * Visible in React Email dev server at http://localhost:3000
 */
export default function Preview() {
  return <VerifyEmailEmail {...previewProps} />
}
