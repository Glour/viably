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
 * Props for Verify Email template
 */
export interface VerifyEmailEmailProps {
  /** User's name for personalization */
  userName: string;

  /** User's email address */
  userEmail: string;

  /** Email verification URL with token */
  verificationUrl: string;

  /** 6-digit verification code (alternative to URL) */
  verificationCode: string;

  /** How long the verification link is valid (in hours) */
  expiresIn?: number;

  /** URL to support/help */
  supportUrl: string;

  /** Optional brand customization */
  brandColor?: string;
  logoUrl?: string;
}

/**
 * Format verification code for display (e.g., "123 456")
 */
const formatVerificationCode = (code: string): string => {
  // Split into groups of 3 for readability
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return code;
};

/**
 * Verify Email Email Template
 *
 * Sent when: User signs up or requests email verification
 * Purpose: Verify email ownership, provide verification code and link
 */
export function VerifyEmailEmail({
  userName,
  userEmail,
  verificationUrl,
  verificationCode,
  expiresIn = 24,
  supportUrl,
  brandColor = '#8b5cf6', // Verification purple
  logoUrl = 'https://viably.ai/logo.png',
}: VerifyEmailEmailProps) {
  const baseUrl = supportUrl.replace('/support', '');
  const loginUrl = `${baseUrl}/login`;
  const resendUrl = `${baseUrl}/verify-email/resend`;
  const preferencesUrl = `${baseUrl}/settings/notifications`;

  const formattedCode = formatVerificationCode(verificationCode);

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

          {/* Verification Banner */}
          <Section style={verificationBanner}>
            <Text style={verificationIcon}>✉️</Text>
            <Heading style={h1}>Verify Your Email</Heading>
            <Text style={verificationSubtext}>
              Hi {userName}, let's verify your email address to get started with Viably.
            </Text>
          </Section>

          {/* Verification Code (Primary Method) */}
          <Section style={codeSection}>
            <Text style={codeLabel}>Your Verification Code</Text>
            <Section style={codeBox}>
              <Text style={codeText}>{formattedCode}</Text>
            </Section>
            <Text style={codeInstructions}>
              Enter this code on the verification page. This code expires in <strong>{expiresIn} hours</strong>.
            </Text>
          </Section>

          {/* Divider */}
          <Section style={dividerSection}>
            <Hr style={divider} />
            <Text style={dividerText}>OR</Text>
            <Hr style={divider} />
          </Section>

          {/* Button Verification (Alternative Method) */}
          <Section style={ctaSection}>
            <Text style={ctaText}>Click the button below to verify instantly:</Text>
            <Button href={verificationUrl} style={{...button, backgroundColor: brandColor}}>
              Verify Email Address
            </Button>
            <Text style={expirationNote}>
              This link expires in {expiresIn} hour{expiresIn === 1 ? '' : 's'}
            </Text>
          </Section>

          {/* Alternative Link Method */}
          <Section style={alternativeSection}>
            <Heading style={h2}>Button Not Working?</Heading>
            <Text style={alternativeText}>
              Copy and paste this link into your browser:
            </Text>
            <Section style={urlBox}>
              <Text style={urlText}>{verificationUrl}</Text>
            </Section>
          </Section>

          {/* Why Verify Section */}
          <Section style={whyVerifySection}>
            <Heading style={h2}>Why Verify Your Email?</Heading>

            <Section style={reasonItem}>
              <Text style={reasonIcon}>🔐</Text>
              <Section style={reasonContent}>
                <Text style={reasonTitle}>Secure Your Account</Text>
                <Text style={reasonDescription}>
                  Verification helps protect your account from unauthorized access.
                </Text>
              </Section>
            </Section>

            <Section style={reasonItem}>
              <Text style={reasonIcon}>🔔</Text>
              <Section style={reasonContent}>
                <Text style={reasonTitle}>Get Important Updates</Text>
                <Text style={reasonDescription}>
                  Receive notifications about your bot generations and deployments.
                </Text>
              </Section>
            </Section>

            <Section style={reasonItem}>
              <Text style={reasonIcon}>🔄</Text>
              <Section style={reasonContent}>
                <Text style={reasonTitle}>Enable Password Recovery</Text>
                <Text style={reasonDescription}>
                  A verified email allows you to reset your password if needed.
                </Text>
              </Section>
            </Section>
          </Section>

          {/* Help Section */}
          <Section style={helpCard}>
            <Text style={helpTitle}>Need Help?</Text>
            <Text style={helpText}>
              <strong>Code not working?</strong> Make sure you're entering the code exactly as shown, including spaces.
            </Text>
            <Text style={helpText}>
              <strong>Didn't receive the email?</strong> Check your spam folder or{' '}
              <Link href={resendUrl} style={{color: brandColor, fontWeight: '600'}}>
                request a new code
              </Link>
              .
            </Text>
            <Text style={helpText}>
              <strong>Link expired?</strong> You can{' '}
              <Link href={resendUrl} style={{color: brandColor, fontWeight: '600'}}>
                resend the verification email
              </Link>
              {' '}to get a fresh link.
            </Text>
            <Text style={helpText}>
              <strong>Still having trouble?</strong>{' '}
              <Link href={supportUrl} style={{color: brandColor, fontWeight: '600'}}>
                Contact our support team
              </Link>
              {' '} — we're here to help.
            </Text>
          </Section>

          {/* Account Info */}
          <Section style={accountInfo}>
            <Text style={accountInfoText}>
              This verification email was sent to <strong>{userEmail}</strong>
            </Text>
            <Text style={accountInfoText}>
              If you didn't create an account with Viably, you can safely ignore this email.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              Welcome to Viably! We're excited to have you.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Viably. All rights reserved.
            </Text>
            <Text style={footerText}>
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

export default VerifyEmailEmail;

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

const verificationBanner = {
  padding: '24px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#f5f3ff', // Light purple background
  borderRadius: '8px',
  margin: '0 20px 24px',
  border: '2px solid #c4b5fd',
};

const verificationIcon = {
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

const verificationSubtext = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const codeSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const codeLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 16px',
};

const codeBox = {
  backgroundColor: '#f9fafb',
  border: '3px dashed #8b5cf6',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '0 auto 16px',
  maxWidth: '240px',
};

const codeText = {
  color: '#8b5cf6',
  fontSize: '42px',
  fontWeight: '700',
  letterSpacing: '8px',
  lineHeight: '1',
  margin: '0',
  fontFamily: 'monospace',
};

const codeInstructions = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const dividerSection = {
  padding: '24px 20px',
  display: 'table' as const,
  width: '100%',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#e5e7eb',
  display: 'table-cell' as const,
  width: '40%',
};

const dividerText = {
  color: '#9ca3af',
  fontSize: '12px',
  fontWeight: '600',
  display: 'table-cell' as const,
  width: '20%',
  verticalAlign: 'middle' as const,
  padding: '0 8px',
};

const ctaSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const ctaText = {
  color: '#404040',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 16px',
};

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '16px 40px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const expirationNote = {
  color: '#9ca3af',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '12px 0 0',
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
  color: '#8b5cf6',
  fontSize: '13px',
  fontWeight: '400',
  lineHeight: '1.5',
  margin: '0',
  wordBreak: 'break-all' as const,
  fontFamily: 'monospace',
};

const whyVerifySection = {
  padding: '24px 20px',
  margin: '0 0 24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const reasonItem = {
  display: 'table' as const,
  width: '100%',
  margin: '0 0 16px',
};

const reasonIcon = {
  display: 'table-cell' as const,
  verticalAlign: 'top' as const,
  width: '40px',
  fontSize: '24px',
  textAlign: 'center' as const,
};

const reasonContent = {
  display: 'table-cell' as const,
  verticalAlign: 'top' as const,
  paddingLeft: '12px',
};

const reasonTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '1.3',
};

const reasonDescription = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
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
  margin: '0 0 12px',
  lineHeight: '1.3',
};

const helpText = {
  color: '#0c4a6e',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '8px 0',
};

const accountInfo = {
  padding: '0 20px',
  margin: '0 0 24px',
};

const accountInfoText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '8px 0',
  textAlign: 'center' as const,
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
