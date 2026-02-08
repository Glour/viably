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
 * Props for Reset Password email template
 */
export interface ResetPasswordEmailProps {
  /** User's name for personalization */
  userName: string;

  /** User's email address (for security reminder) */
  userEmail: string;

  /** Password reset URL with token */
  resetUrl: string;

  /** How long the reset link is valid (in minutes) */
  expiresIn: number;

  /** ISO timestamp when reset was requested */
  requestedAt: string;

  /** URL to support/help */
  supportUrl: string;

  /** Optional brand customization */
  brandColor?: string;
  logoUrl?: string;
}

/**
 * Format expiration time
 */
const formatExpirationTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
};

/**
 * Format timestamp for display
 */
const formatRequestTime = (isoTimestamp: string): string => {
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
 * Reset Password Email Template
 *
 * Sent when: User requests password reset
 * Purpose: Provide secure reset link, security guidance, expiration warning
 */
export function ResetPasswordEmail({
  userName,
  userEmail,
  resetUrl,
  expiresIn = 60,
  requestedAt,
  supportUrl,
  brandColor = '#3b82f6', // Security blue
  logoUrl = 'https://viably.ai/logo.png',
}: ResetPasswordEmailProps) {
  const baseUrl = supportUrl.replace('/support', '');
  const loginUrl = `${baseUrl}/login`;
  const securityUrl = `${baseUrl}/security`;
  const preferencesUrl = `${baseUrl}/settings/notifications`;

  const expirationText = formatExpirationTime(expiresIn);
  const requestTime = formatRequestTime(requestedAt);

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

          {/* Security Banner */}
          <Section style={securityBanner}>
            <Text style={securityIcon}>🔒</Text>
            <Heading style={h1}>Reset Your Password</Heading>
            <Text style={securitySubtext}>
              You requested to reset your password. Click the button below to create a new one.
            </Text>
          </Section>

          {/* CTA Button - Primary Action */}
          <Section style={ctaSection}>
            <Button href={resetUrl} style={{...button, backgroundColor: brandColor}}>
              Reset Password
            </Button>
            <Text style={expirationWarning}>
              ⏱ This link expires in <strong>{expirationText}</strong>
            </Text>
          </Section>

          {/* Request Details */}
          <Section style={detailsCard}>
            <Text style={cardTitle}>Request Details</Text>

            <Section style={detailRow}>
              <Text style={detailLabel}>Account</Text>
              <Text style={detailValue}>{userEmail}</Text>
            </Section>

            <Section style={detailRow}>
              <Text style={detailLabel}>Requested</Text>
              <Text style={detailValue}>{requestTime}</Text>
            </Section>

            <Section style={detailRow}>
              <Text style={detailLabel}>Expires</Text>
              <Text style={detailValue}>In {expirationText}</Text>
            </Section>
          </Section>

          {/* Alternative Method */}
          <Section style={alternativeSection}>
            <Heading style={h2}>Button Not Working?</Heading>
            <Text style={alternativeText}>
              Copy and paste this link into your browser:
            </Text>
            <Section style={urlBox}>
              <Text style={urlText}>{resetUrl}</Text>
            </Section>
          </Section>

          {/* Security Tips */}
          <Section style={securityTipsSection}>
            <Heading style={h2}>Security Tips</Heading>

            <Section style={tipItem}>
              <Text style={tipIcon}>🔐</Text>
              <Section style={tipContent}>
                <Text style={tipTitle}>Use a Strong Password</Text>
                <Text style={tipDescription}>
                  Choose a password with at least 12 characters, including uppercase, lowercase, numbers, and symbols.
                </Text>
              </Section>
            </Section>

            <Section style={tipItem}>
              <Text style={tipIcon}>🚫</Text>
              <Section style={tipContent}>
                <Text style={tipTitle}>Don't Reuse Passwords</Text>
                <Text style={tipDescription}>
                  Use a unique password for Viably that you don't use anywhere else.
                </Text>
              </Section>
            </Section>

            <Section style={tipItem}>
              <Text style={tipIcon}>💾</Text>
              <Section style={tipContent}>
                <Text style={tipTitle}>Use a Password Manager</Text>
                <Text style={tipDescription}>
                  Consider using a password manager to generate and store secure passwords.
                </Text>
              </Section>
            </Section>
          </Section>

          {/* Warning Section */}
          <Section style={warningCard}>
            <Text style={warningTitle}>⚠️ Didn't Request This?</Text>
            <Text style={warningText}>
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </Text>
            <Text style={warningText}>
              However, if you're concerned about your account security, please{' '}
              <Link href={supportUrl} style={{color: brandColor, fontWeight: '600'}}>
                contact our support team
              </Link>
              {' '}immediately or review your{' '}
              <Link href={securityUrl} style={{color: brandColor, fontWeight: '600'}}>
                security settings
              </Link>
              .
            </Text>
          </Section>

          {/* Quick Actions */}
          <Section style={quickActionsSection}>
            <Text style={quickActionsTitle}>Quick Actions</Text>
            <Text style={quickActionItem}>
              <Link href={resetUrl} style={quickActionLink}>
                Reset Password
              </Link>
            </Text>
            <Text style={quickActionItem}>
              <Link href={loginUrl} style={quickActionLink}>
                Back to Login
              </Link>
            </Text>
            <Text style={quickActionItem}>
              <Link href={supportUrl} style={quickActionLink}>
                Contact Support
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              This password reset was requested for the account associated with {userEmail}.
            </Text>
            <Text style={footerText}>
              Need help?{' '}
              <Link href={supportUrl} style={footerLink}>
                Contact support
              </Link>
              .
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

export default ResetPasswordEmail;

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

const securityBanner = {
  padding: '24px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#eff6ff', // Light blue background
  borderRadius: '8px',
  margin: '0 20px 24px',
  border: '2px solid #93c5fd',
};

const securityIcon = {
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

const securitySubtext = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const ctaSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '16px 48px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const expirationWarning = {
  color: '#f59e0b',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '1.5',
  margin: '16px 0 0',
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

const alternativeSection = {
  padding: '0 20px',
  margin: '0 0 24px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 12px',
};

const alternativeText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const urlBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '0 0 8px',
};

const urlText = {
  color: '#3b82f6',
  fontSize: '13px',
  fontWeight: '400',
  lineHeight: '1.5',
  margin: '0',
  wordBreak: 'break-all' as const,
  fontFamily: 'monospace',
};

const securityTipsSection = {
  padding: '24px 20px',
  margin: '0 0 24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const tipItem = {
  display: 'table' as const,
  width: '100%',
  margin: '0 0 16px',
};

const tipIcon = {
  display: 'table-cell' as const,
  verticalAlign: 'top' as const,
  width: '40px',
  fontSize: '24px',
  textAlign: 'center' as const,
};

const tipContent = {
  display: 'table-cell' as const,
  verticalAlign: 'top' as const,
  paddingLeft: '12px',
};

const tipTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '1.3',
};

const tipDescription = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const warningCard = {
  backgroundColor: '#fef2f2', // Light red
  border: '1px solid #fca5a5',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 20px 24px',
};

const warningTitle = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
  lineHeight: '1.3',
};

const warningText = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const quickActionsSection = {
  padding: '0 20px',
  margin: '0 0 24px',
};

const quickActionsTitle = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const quickActionItem = {
  margin: '6px 0',
};

const quickActionLink = {
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
