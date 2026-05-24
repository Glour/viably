import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Button,
  Text,
  Img,
  Hr,
  Link,
  Heading,
} from '@react-email/components';

/**
 * Props for Error email template
 */
export interface ErrorEmailProps {
  /** User's name for personalization */
  userName: string;

  /** Project name where error occurred */
  projectName: string;

  /** Error type/category */
  errorType: string;

  /** Human-readable error message */
  errorMessage: string;

  /** ISO timestamp of when error occurred */
  occurredAt: string;

  /** URL to project page in dashboard */
  projectUrl: string;

  /** URL to support/help center */
  supportUrl: string;

  /** Optional error code for reference */
  errorCode?: string;

  /** Optional retry URL if applicable */
  retryUrl?: string;

  /** Optional brand customization */
  brandColor?: string;
  logoUrl?: string;
}

/**
 * Error type to icon mapping
 */
const getErrorIcon = (errorType: string): string => {
  const type = errorType.toLowerCase();

  if (type.includes('generation')) return '🤖';
  if (type.includes('deploy')) return '🚀';
  if (type.includes('payment') || type.includes('credit')) return '💳';
  if (type.includes('auth') || type.includes('permission')) return '🔒';
  if (type.includes('network') || type.includes('timeout')) return '🌐';

  return '⚠️';
};

/**
 * Format timestamp for display
 */
const formatErrorTime = (isoTimestamp: string): string => {
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
 * Error Email Template
 *
 * Sent when: An error occurs during bot generation, deployment, or other operations
 * Purpose: Inform user about error, provide context, offer solutions and support
 */
export function ErrorEmail({
  userName,
  projectName,
  errorType,
  errorMessage,
  occurredAt,
  projectUrl,
  supportUrl,
  errorCode,
  retryUrl,
  brandColor = '#dc2626', // Error red
  logoUrl = 'https://viably.ai/logo.png',
}: ErrorEmailProps) {
  const baseUrl = supportUrl.replace('/support', '');
  const docsUrl = `${baseUrl}/docs`;
  const statusUrl = `${baseUrl}/status`;
  const preferencesUrl = `${baseUrl}/settings/notifications`;

  const errorIcon = getErrorIcon(errorType);
  const formattedTime = formatErrorTime(occurredAt);

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

          {/* Error Banner */}
          <Section style={errorBanner}>
            <Text style={errorIconStyle}>{errorIcon}</Text>
            <Heading style={h1}>Something Went Wrong</Heading>
            <Text style={errorSubtext}>
              We encountered an issue while processing your request. Don't worry — we're here to help.
            </Text>
          </Section>

          {/* Error Details Card */}
          <Section style={detailsCard}>
            <Text style={cardTitle}>Error Details</Text>

            <Section style={detailRow}>
              <Text style={detailLabel}>Project</Text>
              <Text style={detailValue}>{projectName}</Text>
            </Section>

            <Section style={detailRow}>
              <Text style={detailLabel}>Error Type</Text>
              <Text style={detailValue}>{errorType}</Text>
            </Section>

            {errorCode && (
              <Section style={detailRow}>
                <Text style={detailLabel}>Error Code</Text>
                <Text style={{...detailValue, fontFamily: 'monospace'}}>{errorCode}</Text>
              </Section>
            )}

            <Section style={detailRow}>
              <Text style={detailLabel}>Time</Text>
              <Text style={detailValue}>{formattedTime}</Text>
            </Section>

            <Hr style={detailsDivider} />

            {/* Error Message */}
            <Section style={errorMessageSection}>
              <Text style={errorMessageLabel}>Error Message</Text>
              <Section style={errorMessageBox}>
                <Text style={errorMessageText}>{errorMessage}</Text>
              </Section>
            </Section>
          </Section>

          {/* What's Next Section */}
          <Section style={nextStepsSection}>
            <Heading style={h2}>What You Can Do</Heading>

            <Section style={stepItem}>
              <Text style={stepNumber}>1</Text>
              <Section style={stepContent}>
                <Text style={stepTitle}>Check System Status</Text>
                <Text style={stepDescription}>
                  Visit our{' '}
                  <Link href={statusUrl} style={{color: brandColor}}>
                    status page
                  </Link>
                  {' '}to see if there are any ongoing issues.
                </Text>
              </Section>
            </Section>

            {retryUrl && (
              <Section style={stepItem}>
                <Text style={stepNumber}>2</Text>
                <Section style={stepContent}>
                  <Text style={stepTitle}>Try Again</Text>
                  <Text style={stepDescription}>
                    Sometimes errors are temporary. Click below to retry your request.
                  </Text>
                </Section>
              </Section>
            )}

            <Section style={stepItem}>
              <Text style={stepNumber}>{retryUrl ? '3' : '2'}</Text>
              <Section style={stepContent}>
                <Text style={stepTitle}>Check Documentation</Text>
                <Text style={stepDescription}>
                  Review our{' '}
                  <Link href={docsUrl} style={{color: brandColor}}>
                    documentation
                  </Link>
                  {' '}for common issues and solutions.
                </Text>
              </Section>
            </Section>

            <Section style={stepItem}>
              <Text style={stepNumber}>{retryUrl ? '4' : '3'}</Text>
              <Section style={stepContent}>
                <Text style={stepTitle}>Contact Support</Text>
                <Text style={stepDescription}>
                  Our team is ready to help. Include the error code{' '}
                  {errorCode && <strong>{errorCode}</strong>} when you reach out.
                </Text>
              </Section>
            </Section>
          </Section>

          {/* CTA Buttons */}
          <Section style={ctaSection}>
            {retryUrl && (
              <Button href={retryUrl} style={{...button, backgroundColor: brandColor}}>
                Retry Now
              </Button>
            )}
            <Button href={supportUrl} style={secondaryButton}>
              Contact Support
            </Button>
          </Section>

          {/* Help Card */}
          <Section style={helpCard}>
            <Text style={helpTitle}>Need Immediate Help?</Text>
            <Text style={helpText}>
              Our support team typically responds within 2 hours during business hours.
            </Text>
            <Section style={helpLinks}>
              <Text style={helpLink}>
                <Link href={`${supportUrl}?ref=${errorCode || 'error'}`} style={{color: '#3b82f6'}}>
                  Open Support Ticket
                </Link>
              </Text>
              <Text style={helpLink}>
                <Link href={docsUrl} style={{color: '#3b82f6'}}>
                  Browse Documentation
                </Link>
              </Text>
              <Text style={helpLink}>
                <Link href={statusUrl} style={{color: '#3b82f6'}}>
                  System Status
                </Link>
              </Text>
            </Section>
            {errorCode && (
              <Section style={referenceBox}>
                <Text style={referenceLabel}>Reference this error code:</Text>
                <Text style={referenceCode}>{errorCode}</Text>
              </Section>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              We apologize for the inconvenience. We're constantly working to improve Viably.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Viably. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href={preferencesUrl} style={footerLink}>
                Email Preferences
              </Link>
              {' • '}
              <Link href={supportUrl} style={footerLink}>
                Support
              </Link>
              {' • '}
              <Link href={baseUrl} style={footerLink}>
                Viably.dev
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ErrorEmail;

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

const errorBanner = {
  padding: '24px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#fef2f2', // Light red background
  borderRadius: '8px',
  margin: '0 20px 24px',
  border: '2px solid #fca5a5',
};

const errorIconStyle = {
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

const errorSubtext = {
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

const detailsDivider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const errorMessageSection = {
  marginTop: '20px',
};

const errorMessageLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const errorMessageBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #fca5a5',
  borderRadius: '6px',
  padding: '16px',
};

const errorMessageText = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: '400',
  lineHeight: '1.6',
  margin: '0',
  fontFamily: 'monospace',
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

const stepItem = {
  display: 'table' as const,
  width: '100%',
  margin: '0 0 16px',
};

const stepNumber = {
  display: 'table-cell' as const,
  verticalAlign: 'top' as const,
  width: '32px',
  height: '32px',
  lineHeight: '32px',
  textAlign: 'center' as const,
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontWeight: '700',
  fontSize: '14px',
  borderRadius: '50%',
  margin: '0',
};

const stepContent = {
  display: 'table-cell' as const,
  verticalAlign: 'top' as const,
  paddingLeft: '16px',
};

const stepTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '1.3',
};

const stepDescription = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const ctaSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#dc2626',
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

const helpCard = {
  backgroundColor: '#f0f9ff', // Light blue
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 20px 24px',
};

const helpTitle = {
  color: '#075985',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px',
  lineHeight: '1.3',
};

const helpText = {
  color: '#0c4a6e',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const helpLinks = {
  margin: '0 0 16px',
};

const helpLink = {
  color: '#0c4a6e',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '4px 0',
};

const referenceBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #bae6fd',
  borderRadius: '6px',
  padding: '12px',
  textAlign: 'center' as const,
};

const referenceLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  margin: '0 0 4px',
  lineHeight: '1.4',
};

const referenceCode = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0',
  fontFamily: 'monospace',
  letterSpacing: '1px',
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
