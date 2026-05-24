import { GenerationCompleteEmail } from './generation-complete';
import type { GenerationCompleteEmailProps } from './generation-complete';

/**
 * Preview data for Generation Complete email template
 * Used for development and testing
 */
export const previewProps: GenerationCompleteEmailProps = {
  userName: 'Alex',
  projectName: 'Customer Support Bot',
  templateUsed: 'Support Assistant',
  generatedAt: new Date().toISOString(),
  projectUrl: 'https://viably.ai/projects/cs-bot-123',
  deployUrl: undefined, // Not deployed yet
  creditsUsed: 10,
  creditsRemaining: 40,
  brandColor: '#10b981',
  logoUrl: 'https://viably.ai/logo.png',
};

/**
 * Email preview component
 * Visible in React Email dev server at http://localhost:3000
 */
export default function Preview() {
  return <GenerationCompleteEmail {...previewProps} />;
}
