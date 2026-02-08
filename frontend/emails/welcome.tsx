import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Button,
  Img,
  Hr,
  Link,
  Heading,
} from '@react-email/components'

/**
 * Props for Welcome email template
 * Sent when a new user successfully registers on Viably
 */
export interface WelcomeEmailProps {
  /** User's name for personalization */
  userName: string
  /** User's email address */
  userEmail: string
  /** Starting credits amount (default: 100) */
  credits: number
  /** Link to user dashboard */
  dashboardUrl: string
}

/**
 * Welcome Email Template
 *
 * Sent when: User successfully completes registration
 * Purpose: Welcome user, highlight starting credits, guide to first actions
 */
export default function WelcomeEmail({
  userName = 'User',
  userEmail = 'user@example.com',
  credits = 100,
  dashboardUrl = 'https://viably.dev/dashboard',
}: WelcomeEmailProps) {
  const baseUrl = dashboardUrl.replace('/dashboard', '')
  const templatesUrl = `${baseUrl}/templates`
  const quickStartUrl = `${baseUrl}/docs/quick-start`
  const supportUrl = `${baseUrl}/support`
  const unsubscribeUrl = `${baseUrl}/settings/notifications`

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Row>
              <Column align="center">
                <Heading style={logo}>Viably</Heading>
              </Column>
            </Row>
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Heading style={h1}>Welcome to Viably, {userName}! 🎉</Heading>
            <Text style={leadText}>
              You're all set! Your account is ready, and we're excited to help you create amazing
              educational content with AI.
            </Text>
          </Section>

          {/* Credits Highlight */}
          <Section style={creditsSection}>
            <Row>
              <Column align="center">
                <div style={creditsBox}>
                  <Text style={creditsLabel}>Your Starting Credits</Text>
                  <Text style={creditsAmount}>{credits}</Text>
                  <Text style={creditsDescription}>
                    Use credits to generate courses, lessons, and deploy your content.
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* Quick Start Guide */}
          <Section style={contentSection}>
            <Heading style={h2}>Get Started in 3 Steps</Heading>

            <Row style={stepRow}>
              <Column style={stepNumber}>1</Column>
              <Column style={stepContent}>
                <Text style={stepTitle}>Browse Templates</Text>
                <Text style={stepDescription}>
                  Choose from our library of proven educational templates.
                </Text>
              </Column>
            </Row>

            <Row style={stepRow}>
              <Column style={stepNumber}>2</Column>
              <Column style={stepContent}>
                <Text style={stepTitle}>Generate Content</Text>
                <Text style={stepDescription}>
                  AI will help you create engaging courses and lessons in minutes.
                </Text>
              </Column>
            </Row>

            <Row style={stepRow}>
              <Column style={stepNumber}>3</Column>
              <Column style={stepContent}>
                <Text style={stepTitle}>Deploy & Share</Text>
                <Text style={stepDescription}>
                  Publish your content and share it with your audience.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* CTA Buttons */}
          <Section style={buttonSection}>
            <Row>
              <Column align="center">
                <Button style={primaryButton} href={dashboardUrl}>
                  Go to Dashboard
                </Button>
              </Column>
            </Row>
          </Section>

          <Section style={buttonSection}>
            <Row>
              <Column align="center">
                <Link href={templatesUrl} style={secondaryLink}>
                  Browse Templates →
                </Link>
                <Text style={linkSeparator}>•</Text>
                <Link href={quickStartUrl} style={secondaryLink}>
                  Quick Start Guide →
                </Link>
              </Column>
            </Row>
          </Section>

          {/* Support Section */}
          <Section style={supportSection}>
            <Text style={supportText}>
              Need help getting started?{' '}
              <Link href={supportUrl} style={supportLink}>
                Visit our support center
              </Link>{' '}
              or reply to this email.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              You're receiving this email because you created an account at Viably.
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={footerLink}>
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
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} Viably. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Inline styles for cross-client compatibility
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  border: '1px solid #e6ebf1',
}

const header = {
  backgroundColor: '#7C3AED',
  padding: '32px 20px',
  textAlign: 'center' as const,
}

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '-0.5px',
}

const heroSection = {
  padding: '40px 32px 24px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 16px',
}

const h2 = {
  color: '#1a1a1a',
  fontSize: '22px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px',
}

const leadText = {
  color: '#404040',
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '0',
}

const creditsSection = {
  padding: '24px 32px',
}

const creditsBox = {
  backgroundColor: '#f0f4ff',
  border: '2px solid #7C3AED',
  borderRadius: '12px',
  padding: '32px 24px',
  textAlign: 'center' as const,
}

const creditsLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
}

const creditsAmount = {
  color: '#7C3AED',
  fontSize: '56px',
  fontWeight: '700',
  lineHeight: '1',
  margin: '0 0 12px',
}

const creditsDescription = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
}

const contentSection = {
  padding: '24px 32px',
}

const stepRow = {
  marginBottom: '20px',
}

const stepNumber = {
  width: '48px',
  height: '48px',
  backgroundColor: '#7C3AED',
  borderRadius: '50%',
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '700',
  display: 'table-cell' as const,
  verticalAlign: 'middle' as const,
  textAlign: 'center' as const,
  lineHeight: '48px',
}

const stepContent = {
  paddingLeft: '16px',
  verticalAlign: 'top' as const,
}

const stepTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '4px 0 6px',
  lineHeight: '1.3',
}

const stepDescription = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
}

const buttonSection = {
  padding: '12px 32px',
  textAlign: 'center' as const,
}

const primaryButton = {
  backgroundColor: '#7C3AED',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '16px 40px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  cursor: 'pointer',
}

const secondaryLink = {
  color: '#7C3AED',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  margin: '0 8px',
}

const linkSeparator = {
  color: '#d1d5db',
  fontSize: '15px',
  margin: '0 4px',
  display: 'inline',
}

const supportSection = {
  padding: '32px 32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#f9fafb',
}

const supportText = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
}

const supportLink = {
  color: '#7C3AED',
  textDecoration: 'underline',
}

const footer = {
  padding: '32px 32px 40px',
}

const hr = {
  borderColor: '#e6ebf1',
  borderStyle: 'solid' as const,
  borderWidth: '1px 0 0 0',
  margin: '0 0 24px',
}

const footerText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '8px 0',
  textAlign: 'center' as const,
}

const footerLink = {
  color: '#7C3AED',
  textDecoration: 'none',
}

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '16px 0 0',
  textAlign: 'center' as const,
}
