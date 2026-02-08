import { DeploySuccessEmail } from './deploy-success';
import type { DeploySuccessEmailProps } from './deploy-success';

/**
 * Preview data for Deploy Success email template
 * Used for development and testing
 */
export const previewProps: DeploySuccessEmailProps = {
  userName: 'Alex',
  projectName: 'Customer Support Bot',
  deploymentUrl: 'https://discord.com/oauth2/authorize?client_id=123456789&scope=bot',
  platform: 'Discord',
  deployedAt: new Date().toISOString(),
  projectUrl: 'https://viably.ai/projects/cust-support-bot',
  brandColor: '#10b981',
  logoUrl: 'https://viably.ai/logo.png',
};

/**
 * Email preview component
 * Visible in React Email dev server
 */
export default function Preview() {
  return <DeploySuccessEmail {...previewProps} />;
}

/**
 * Additional preview variants for testing different platforms
 */

// Telegram variant
export const TelegramPreview = () => (
  <DeploySuccessEmail
    userName="Sarah"
    projectName="Course Creator Bot"
    deploymentUrl="https://t.me/course_creator_bot"
    platform="Telegram"
    deployedAt={new Date().toISOString()}
    projectUrl="https://viably.ai/projects/course-creator"
    brandColor="#10b981"
  />
);

// Slack variant
export const SlackPreview = () => (
  <DeploySuccessEmail
    userName="Michael"
    projectName="Team Assistant"
    deploymentUrl="https://slack.com/oauth/v2/authorize?client_id=123456"
    platform="Slack"
    deployedAt={new Date().toISOString()}
    projectUrl="https://viably.ai/projects/team-assistant"
    setupInstructions="Your Slack bot is ready! Install it to your workspace using the link below, then invite the bot to any channel to start using it."
    brandColor="#10b981"
  />
);

// WhatsApp variant
export const WhatsAppPreview = () => (
  <DeploySuccessEmail
    userName="Emma"
    projectName="E-commerce Bot"
    deploymentUrl="https://api.viably.ai/webhooks/whatsapp/abc123"
    platform="WhatsApp"
    deployedAt={new Date().toISOString()}
    projectUrl="https://viably.ai/projects/ecommerce-bot"
    brandColor="#10b981"
  />
);
