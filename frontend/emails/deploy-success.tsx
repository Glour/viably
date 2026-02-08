import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Heading,
  Hr,
  Img,
} from '@react-email/components';

/**
 * Props for Deploy Success email template
 */
export interface DeploySuccessEmailProps {
  /** User's name for personalization */
  userName: string;

  /** Project name */
  projectName: string;

  /** Live bot deployment URL */
  deploymentUrl: string;

  /** Deployment platform (Discord, Telegram, Slack, WhatsApp) */
  platform: string;

  /** ISO timestamp of deployment */
  deployedAt: string;

  /** Link to Viably project dashboard */
  projectUrl: string;

  /** Optional platform-specific setup instructions */
  setupInstructions?: string;

  /** Optional brand customization */
  brandColor?: string;
  logoUrl?: string;
}

/**
 * Platform-specific next steps content
 */
const getPlatformInstructions = (platform: string, deploymentUrl: string): { title: string; steps: string[] } => {
  const platformLower = platform.toLowerCase();

  if (platformLower.includes('discord')) {
    return {
      title: 'Add Your Bot to Discord',
      steps: [
        'Click the "View Live Bot" button below',
        'Select a server from the dropdown',
        'Authorize the bot permissions',
        'Test your bot with a command in any channel',
      ],
    };
  }

  if (platformLower.includes('telegram')) {
    return {
      title: 'Start Using Your Telegram Bot',
      steps: [
        'Open Telegram and search for your bot',
        'Click "Start" to begin conversation',
        'Test your bot commands',
        'Share the bot link with your users',
      ],
    };
  }

  if (platformLower.includes('slack')) {
    return {
      title: 'Install to Your Slack Workspace',
      steps: [
        'Click the "View Live Bot" button below',
        'Select your Slack workspace',
        'Authorize the bot permissions',
        'Find your bot in the Apps section',
      ],
    };
  }

  if (platformLower.includes('whatsapp')) {
    return {
      title: 'Configure Your WhatsApp Bot',
      steps: [
        'Configure webhook in WhatsApp Business API',
        'Copy the deployment URL below',
        'Add webhook URL to WhatsApp settings',
        'Verify webhook connection',
      ],
    };
  }

  // Generic instructions
  return {
    title: 'Start Using Your Bot',
    steps: [
      'Click the "View Live Bot" button below',
      'Follow platform-specific setup instructions',
      'Test your bot functionality',
      'Share with your users',
    ],
  };
};

/**
 * Platform badge/icon emoji
 */
const getPlatformEmoji = (platform: string): string => {
  const platformLower = platform.toLowerCase();

  if (platformLower.includes('discord')) return '🎮';
  if (platformLower.includes('telegram')) return '✈️';
  if (platformLower.includes('slack')) return '💬';
  if (platformLower.includes('whatsapp')) return '💚';

  return '🤖';
};

/**
 * Format timestamp for display
 */
const formatDeployTime = (isoTimestamp: string): string => {
  try {
    const date = new Date(isoTimestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return isoTimestamp;
  }
};

/**
 * Deploy Success Email Template
 *
 * Sent when: Bot deployment completes successfully
 * Purpose: Celebrate deployment, provide deployment details, guide next steps
 */
export function DeploySuccessEmail({
  userName,
  projectName,
  deploymentUrl,
  platform,
  deployedAt,
  projectUrl,
  setupInstructions,
  brandColor = '#10b981', // Success green
  logoUrl = 'https://viably.ai/logo.png',
}: DeploySuccessEmailProps) {
  const platformInstructions = getPlatformInstructions(platform, deploymentUrl);
  const platformEmoji = getPlatformEmoji(platform);
  const formattedTime = formatDeployTime(deployedAt);

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={logoUrl}
              width="120"
              height="40"
              alt="Viably Logo"
              style={logo}
            />
          </Section>

          {/* Success Banner */}
          <Section style={successBanner}>
            <Text style={successEmoji}>🎉</Text>
            <Heading style={h1}>Your Bot is Live!</Heading>
            <Text style={successSubtext}>
              Congratulations! Your bot has been successfully deployed and is ready to use.
            </Text>
          </Section>

          {/* Deployment Details Card */}
          <Section style={detailsCard}>
            <Text style={cardTitle}>Deployment Details</Text>

            <Section style={detailRow}>
              <Text style={detailLabel}>Project</Text>
              <Text style={detailValue}>{projectName}</Text>
            </Section>

            <Section style={detailRow}>
              <Text style={detailLabel}>Platform</Text>
              <Text style={detailValue}>
                {platformEmoji} {platform}
              </Text>
            </Section>

            <Section style={detailRow}>
              <Text style={detailLabel}>Status</Text>
              <Text style={{...detailValue, color: brandColor, fontWeight: '600'}}>
                ● Live
              </Text>
            </Section>

            <Section style={detailRow}>
              <Text style={detailLabel}>Deployed At</Text>
              <Text style={detailValue}>{formattedTime}</Text>
            </Section>

            <Hr style={cardDivider} />

            {/* Deployment URL - Prominent */}
            <Section style={urlSection}>
              <Text style={urlLabel}>Deployment URL</Text>
              <Section style={urlBox}>
                <Text style={urlText}>{deploymentUrl}</Text>
              </Section>
              <Text style={urlHint}>
                Copy this URL to integrate with {platform}
              </Text>
            </Section>
          </Section>

          {/* Next Steps */}
          <Section style={nextStepsSection}>
            <Heading style={h2}>{platformInstructions.title}</Heading>

            {setupInstructions ? (
              <Text style={instructionText}>{setupInstructions}</Text>
            ) : (
              <Section style={stepsList}>
                {platformInstructions.steps.map((step, index) => (
                  <Section key={index} style={stepItem}>
                    <Text style={stepNumber}>{index + 1}</Text>
                    <Text style={stepText}>{step}</Text>
                  </Section>
                ))}
              </Section>
            )}
          </Section>

          {/* CTA Buttons */}
          <Section style={ctaSection}>
            <Button href={deploymentUrl} style={{...button, backgroundColor: brandColor}}>
              View Live Bot
            </Button>

            <Button href={projectUrl} style={secondaryButton}>
              Manage Project
            </Button>
          </Section>

          {/* Monitoring Tip */}
          <Section style={tipCard}>
            <Text style={tipTitle}>💡 Pro Tip</Text>
            <Text style={tipText}>
              Monitor your bot's performance, view logs, and check usage statistics from your{' '}
              <Link href={projectUrl} style={tipLink}>
                project dashboard
              </Link>
              . We'll notify you of any issues.
            </Text>
          </Section>

          {/* Quick Links */}
          <Section style={quickLinksSection}>
            <Text style={quickLinksTitle}>Quick Actions</Text>
            <Text style={quickLinkItem}>
              <Link href={`${projectUrl}/logs`} style={quickLink}>
                View Logs
              </Link>
            </Text>
            <Text style={quickLinkItem}>
              <Link href={`${projectUrl}/settings`} style={quickLink}>
                Bot Settings
              </Link>
            </Text>
            <Text style={quickLinkItem}>
              <Link href={`${projectUrl}/analytics`} style={quickLink}>
                Analytics
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              Need help? Check our{' '}
              <Link href="https://viably.ai/docs" style={footerLink}>
                documentation
              </Link>{' '}
              or{' '}
              <Link href="https://viably.ai/support" style={footerLink}>
                contact support
              </Link>
              .
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Viably. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://viably.ai/unsubscribe" style={footerLink}>
                Unsubscribe
              </Link>
              {' • '}
              <Link href="https://viably.ai/preferences" style={footerLink}>
                Email Preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default DeploySuccessEmail;

// ============================================================================
// Inline Styles (Required for Email Compatibility)
// ============================================================================

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px 20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const successBanner = {
  padding: '24px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#f0fdf4', // Light green background
  borderRadius: '8px',
  margin: '0 20px 24px',
};

const successEmoji = {
  fontSize: '48px',
  lineHeight: '1',
  margin: '0 0 16px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 8px',
};

const successSubtext = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const detailsCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  margin: '0 20px 24px',
};

const cardTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 16px',
};

const detailRow = {
  margin: '12px 0',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '1.4',
  margin: '0 0 4px',
};

const detailValue = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '1.5',
  margin: '0',
};

const cardDivider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const urlSection = {
  marginTop: '20px',
};

const urlLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const urlBox = {
  backgroundColor: '#ffffff',
  border: '2px dashed #d1d5db',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '0 0 8px',
};

const urlText = {
  color: '#3b82f6',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '1.5',
  margin: '0',
  wordBreak: 'break-all' as const,
  fontFamily: 'monospace',
};

const urlHint = {
  color: '#9ca3af',
  fontSize: '12px',
  fontStyle: 'italic',
  lineHeight: '1.4',
  margin: '0',
};

const nextStepsSection = {
  padding: '0 20px',
  margin: '0 0 24px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 16px',
};

const instructionText = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const stepsList = {
  margin: '0',
};

const stepItem = {
  display: 'flex' as const,
  alignItems: 'flex-start' as const,
  margin: '0 0 12px',
};

const stepNumber = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '6px 10px',
  borderRadius: '50%',
  marginRight: '12px',
  minWidth: '28px',
  textAlign: 'center' as const,
  display: 'inline-block',
};

const stepText = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  flex: '1',
  paddingTop: '4px',
};

const ctaSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '14px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '0 8px 12px',
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  border: '2px solid #e5e7eb',
  borderRadius: '6px',
  color: '#1a1a1a',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '14px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '0 8px 12px',
};

const tipCard = {
  backgroundColor: '#fffbeb', // Light yellow
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 20px 24px',
};

const tipTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 8px',
};

const tipText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const tipLink = {
  color: '#3b82f6',
  textDecoration: 'underline',
  fontWeight: '500',
};

const quickLinksSection = {
  padding: '0 20px',
  margin: '0 0 32px',
};

const quickLinksTitle = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const quickLinkItem = {
  margin: '6px 0',
};

const quickLink = {
  color: '#3b82f6',
  fontSize: '14px',
  textDecoration: 'none',
  fontWeight: '500',
  lineHeight: '1.5',
};

const footer = {
  padding: '32px 20px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footerText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#5469d4',
  textDecoration: 'underline',
};
