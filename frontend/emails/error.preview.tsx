import ErrorEmail from './error'
import type { ErrorEmailProps } from './error'

/**
 * Preview data for Error email template
 * Used for development and testing in React Email dev server
 */
export const previewProps: ErrorEmailProps = {
  userName: 'Alex',
  projectName: 'Customer Support Bot',
  errorType: 'Generation Error',
  errorMessage: 'Failed to generate bot: API rate limit exceeded. Please try again in a few minutes.',
  occurredAt: new Date().toISOString(),
  projectUrl: 'https://viably.dev/projects/abc123',
  supportUrl: 'https://viably.dev/support',
  errorCode: 'ERR-GEN-429',
  retryUrl: 'https://viably.dev/projects/abc123/retry',
}

/**
 * Email preview component
 * Visible in React Email dev server at http://localhost:3000
 */
export default function Preview() {
  return <ErrorEmail {...previewProps} />
}
