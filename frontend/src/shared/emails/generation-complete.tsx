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
 * Props for Generation Complete email template
 *
 * Sent when: AI generation completes successfully
 * Purpose: Notify user, celebrate success, guide next actions
 */
export interface GenerationCompleteEmailProps {
  /** User's first name for personalization */
  userName: string;

  /** Generated project name */
  projectName: string;

  /** Template that was used */
  templateUsed: string;

  /** ISO timestamp of generation completion */
  generatedAt: string;

  /** Link to project page in dashboard */
  projectUrl: string;

  /** Optional link to deploy if already deployed */
  deployUrl?: string;

  /** Credits used for this generation (10) */
  creditsUsed: number;

  /** Remaining credits after generation */
  creditsRemaining: number;

  /** Optional brand customization */
  brandColor?: string;
  logoUrl?: string;
}

/**
 * Generation Complete Email Template
 *
 * Sent when: AI bot generation completes successfully
 * Purpose: Celebrate success, show project details, guide next actions
 */
export function GenerationCompleteEmail({
  userName,
  projectName,
  templateUsed,
  generatedAt,
  projectUrl,
  deployUrl,
  creditsUsed,
  creditsRemaining,
  brandColor = '#10b981', // Success green
  logoUrl,
}: GenerationCompleteEmailProps) {
  const formattedDate = new Date(generatedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header Section */}
          <Section style={header}>
            <Img
              src={logoUrl || 'https://viably.ai/logo.png'}
              width="120"
              height="40"
              alt="Viably Logo"
            />
          </Section>

          {/* Success Icon */}
          <Section style={iconSection}>
            <Img
              src="https://viably.ai/icons/success-checkmark.png"
              width="64"
              height="64"
              alt="Success"
              style={successIcon}
            />
          </Section>

          {/* Content Section */}
          <Section style={content}>
            <Heading style={h1}>Your bot is ready, {userName}! 🎉</Heading>

            <Text style={text}>
              Great news! Your AI bot has been successfully generated and is ready to use.
            </Text>

            {/* Project Details Card */}
            <Section style={detailsCard}>
              <Row>
                <Column>
                  <Text style={detailsLabel}>Project Name</Text>
                  <Text style={detailsValue}>{projectName}</Text>
                </Column>
              </Row>

              <Hr style={detailsDivider} />

              <Row>
                <Column style={detailsColumn}>
                  <Text style={detailsLabel}>Template</Text>
                  <Text style={detailsValue}>{templateUsed}</Text>
                </Column>
                <Column style={detailsColumn}>
                  <Text style={detailsLabel}>Generated</Text>
                  <Text style={detailsValue}>{formattedDate}</Text>
                </Column>
              </Row>

              <Hr style={detailsDivider} />

              <Row>
                <Column style={detailsColumn}>
                  <Text style={detailsLabel}>Credits Used</Text>
                  <Text style={{ ...detailsValue, color: brandColor }}>
                    -{creditsUsed}
                  </Text>
                </Column>
                <Column style={detailsColumn}>
                  <Text style={detailsLabel}>Remaining</Text>
                  <Text style={detailsValue}>{creditsRemaining}</Text>
                </Column>
              </Row>
            </Section>

            {/* Quick Actions */}
            <Section style={actionsSection}>
              <Text style={sectionHeading}>Quick Actions</Text>

              {/* Primary CTA - View Project */}
              <Section style={buttonContainer}>
                <Button
                  href={projectUrl}
                  style={{ ...button, backgroundColor: brandColor }}
                >
                  View Project
                </Button>
              </Section>

              {/* Secondary CTA - Deploy Now */}
              {deployUrl ? (
                <Section style={buttonContainer}>
                  <Button
                    href={deployUrl}
                    style={{ ...buttonSecondary, borderColor: brandColor, color: brandColor }}
                  >
                    Go to Deployment
                  </Button>
                </Section>
              ) : (
                <Section style={buttonContainer}>
                  <Button
                    href={`${projectUrl}?tab=deploy`}
                    style={{ ...buttonSecondary, borderColor: brandColor, color: brandColor }}
                  >
                    Deploy Now
                  </Button>
                </Section>
              )}

              {/* Generate Another Link */}
              <Section style={{ textAlign: 'center' as const, marginTop: '16px' }}>
                <Link
                  href="https://viably.ai/templates"
                  style={{ ...link, color: brandColor }}
                >
                  Generate Another Bot →
                </Link>
              </Section>
            </Section>

            {/* Next Steps */}
            <Section style={nextStepsSection}>
              <Text style={sectionHeading}>What's Next?</Text>

              <Section style={stepItem}>
                <Text style={stepNumber}>1</Text>
                <Text style={stepText}>
                  <strong>Review your bot</strong> - Check the generated content and make any adjustments
                </Text>
              </Section>

              <Section style={stepItem}>
                <Text style={stepNumber}>2</Text>
                <Text style={stepText}>
                  <strong>Test locally</strong> - Download and test your bot in development mode
                </Text>
              </Section>

              <Section style={stepItem}>
                <Text style={stepNumber}>3</Text>
                <Text style={stepText}>
                  <strong>Deploy to production</strong> - Launch your bot with one click
                </Text>
              </Section>

              <Section style={stepItem}>
                <Text style={stepNumber}>4</Text>
                <Text style={stepText}>
                  <strong>Share with users</strong> - Get your bot URL and start engaging users
                </Text>
              </Section>
            </Section>

            <Text style={helpText}>
              Need help getting started?{' '}
              <Link href="https://viably.ai/docs" style={{ color: brandColor }}>
                Check our documentation
              </Link>
              {' '}or{' '}
              <Link href="https://viably.ai/support" style={{ color: brandColor }}>
                contact support
              </Link>
              .
            </Text>
          </Section>

          {/* Footer Section */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              © {new Date().getFullYear()} Viably AI. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://viably.ai/unsubscribe" style={footerLink}>
                Unsubscribe
              </Link>
              {' • '}
              <Link href="https://viably.ai/settings/notifications" style={footerLink}>
                Email Preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default GenerationCompleteEmail;

// Inline styles for cross-client compatibility
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const iconSection = {
  textAlign: 'center' as const,
  padding: '0 20px 24px',
};

const successIcon = {
  margin: '0 auto',
};

const content = {
  padding: '0 20px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const detailsCard = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e5e7eb',
};

const detailsLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};

const detailsValue = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const detailsColumn = {
  width: '50%',
};

const detailsDivider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const actionsSection = {
  margin: '32px 0',
};

const sectionHeading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const buttonContainer = {
  padding: '8px 0',
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
  width: '100%',
  maxWidth: '280px',
};

const buttonSecondary = {
  backgroundColor: '#ffffff',
  border: '2px solid #10b981',
  borderRadius: '6px',
  color: '#10b981',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  width: '100%',
  maxWidth: '280px',
};

const link = {
  color: '#10b981',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
};

const nextStepsSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  border: '1px solid #e5e7eb',
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
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontWeight: '700',
  fontSize: '14px',
  borderRadius: '50%',
  margin: '0',
};

const stepText = {
  display: 'table-cell' as const,
  verticalAlign: 'top' as const,
  paddingLeft: '16px',
  color: '#404040',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const helpText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '24px 0 0',
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
