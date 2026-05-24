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
 * Props for Low Credits email template
 */
export interface LowCreditsEmailProps {
  /** User's name for personalization */
  userName: string;

  /** Current credits remaining */
  creditsRemaining: number;

  /** Low credits threshold (when this email is triggered) */
  lowCreditsThreshold?: number;

  /** URL to purchase/top up credits */
  topUpUrl: string;

  /** URL to pricing page */
  pricingUrl: string;

  /** URL to user dashboard */
  dashboardUrl: string;

  /** Optional brand customization */
  brandColor?: string;
  logoUrl?: string;
}

/**
 * Low Credits Email Template
 *
 * Sent when: User's credit balance falls below threshold (default: 20)
 * Purpose: Alert user about low credits, encourage top-up, show pricing options
 */
export function LowCreditsEmail({
  userName,
  creditsRemaining,
  lowCreditsThreshold = 20,
  topUpUrl,
  pricingUrl,
  dashboardUrl,
  brandColor = '#f59e0b', // Warning amber
  logoUrl = 'https://viably.ai/logo.png',
}: LowCreditsEmailProps) {
  const baseUrl = dashboardUrl.replace('/dashboard', '');
  const supportUrl = `${baseUrl}/support`;
  const preferencesUrl = `${baseUrl}/settings/notifications`;

  // Determine urgency level
  const isUrgent = creditsRemaining < 10;
  const isCritical = creditsRemaining === 0;

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

          {/* Warning Banner */}
          <Section style={warningBanner}>
            <Text style={warningIcon}>{isCritical ? '🚨' : '⚠️'}</Text>
            <Heading style={h1}>
              {isCritical
                ? 'Your Credits Have Run Out'
                : 'Your Credits Are Running Low'}
            </Heading>
            <Text style={warningSubtext}>
              {isCritical
                ? "You've used all your credits. Top up now to continue generating bots."
                : `You have ${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} remaining.`}
            </Text>
          </Section>

          {/* Credits Status Card */}
          <Section style={creditsCard}>
            <Row>
              <Column align="center">
                <Text style={creditsLabel}>Current Balance</Text>
                <Text style={{
                  ...creditsAmount,
                  color: isCritical ? '#dc2626' : isUrgent ? '#f59e0b' : '#10b981',
                }}>
                  {creditsRemaining}
                </Text>
                <Text style={creditsDescription}>
                  {isCritical
                    ? 'You need more credits to generate bots'
                    : `You can generate ${Math.floor(creditsRemaining / 10)} more bot${Math.floor(creditsRemaining / 10) === 1 ? '' : 's'}`}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Cost Breakdown */}
          <Section style={infoCard}>
            <Heading style={h2}>Credit Usage</Heading>
            <Section style={costItem}>
              <Row>
                <Column style={costIcon}>🤖</Column>
                <Column>
                  <Text style={costLabel}>Generate Bot</Text>
                  <Text style={costDescription}>AI-powered bot generation</Text>
                </Column>
                <Column style={costValue}>
                  <Text style={costAmount}>10</Text>
                  <Text style={costUnit}>credits</Text>
                </Column>
              </Row>
            </Section>
            <Section style={costItem}>
              <Row>
                <Column style={costIcon}>🚀</Column>
                <Column>
                  <Text style={costLabel}>Deploy to Platform</Text>
                  <Text style={costDescription}>One-click deployment</Text>
                </Column>
                <Column style={costValue}>
                  <Text style={costAmount}>5</Text>
                  <Text style={costUnit}>credits</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Button href={topUpUrl} style={{...button, backgroundColor: brandColor}}>
              Top Up Credits
            </Button>
            <Text style={ctaSubtext}>
              <Link href={pricingUrl} style={{color: brandColor, textDecoration: 'underline'}}>
                View Pricing Plans →
              </Link>
            </Text>
          </Section>

          {/* Pricing Tiers Preview */}
          <Section style={pricingSection}>
            <Heading style={h2}>Choose Your Plan</Heading>
            <Row>
              <Column style={pricingColumn}>
                <Section style={pricingTier}>
                  <Text style={pricingName}>Starter</Text>
                  <Text style={pricingPrice}>$19</Text>
                  <Text style={pricingCredits}>100 credits</Text>
                  <Text style={pricingRate}>$0.19/credit</Text>
                </Section>
              </Column>
              <Column style={pricingColumn}>
                <Section style={{...pricingTier, ...pricingTierPopular}}>
                  <Text style={popularBadge}>Popular</Text>
                  <Text style={pricingName}>Pro</Text>
                  <Text style={pricingPrice}>$49</Text>
                  <Text style={pricingCredits}>300 credits</Text>
                  <Text style={pricingRate}>$0.16/credit</Text>
                </Section>
              </Column>
              <Column style={pricingColumn}>
                <Section style={pricingTier}>
                  <Text style={pricingName}>Business</Text>
                  <Text style={pricingPrice}>$149</Text>
                  <Text style={pricingCredits}>1000 credits</Text>
                  <Text style={pricingRate}>$0.15/credit</Text>
                </Section>
              </Column>
            </Row>
            <Section style={{textAlign: 'center' as const, marginTop: '16px'}}>
              <Link href={pricingUrl} style={{color: brandColor, fontSize: '14px'}}>
                See full pricing details →
              </Link>
            </Section>
          </Section>

          {/* Tips Card */}
          <Section style={tipCard}>
            <Text style={tipTitle}>💡 Pro Tips</Text>
            <Section style={tipList}>
              <Text style={tipItem}>
                <strong>Generate efficiently:</strong> Review templates before generating to ensure they match your needs
              </Text>
              <Text style={tipItem}>
                <strong>Track usage:</strong> Monitor your credit balance in{' '}
                <Link href={dashboardUrl} style={{color: brandColor}}>
                  your dashboard
                </Link>
              </Text>
              <Text style={tipItem}>
                <strong>Save credits:</strong> Test locally before deploying to save deployment credits
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              Need help choosing a plan?{' '}
              <Link href={supportUrl} style={footerLink}>
                Contact our sales team
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

export default LowCreditsEmail;

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

const warningBanner = {
  padding: '24px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#fffbeb', // Light amber background
  borderRadius: '8px',
  margin: '0 20px 24px',
  border: '2px solid #fbbf24',
};

const warningIcon = {
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

const warningSubtext = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const creditsCard = {
  padding: '24px 20px',
  margin: '0 20px 24px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
};

const creditsLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
};

const creditsAmount = {
  color: '#10b981',
  fontSize: '56px',
  fontWeight: '700',
  lineHeight: '1',
  margin: '0 0 12px',
};

const creditsDescription = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
};

const infoCard = {
  padding: '24px 20px',
  margin: '0 20px 24px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 16px',
};

const costItem = {
  margin: '12px 0',
};

const costIcon = {
  fontSize: '24px',
  width: '40px',
  textAlign: 'center' as const,
};

const costLabel = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '1.3',
};

const costDescription = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0',
};

const costValue = {
  textAlign: 'right' as const,
};

const costAmount = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1',
};

const costUnit = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
  lineHeight: '1.5',
};

const ctaSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#f59e0b',
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

const ctaSubtext = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '16px 0 0',
};

const pricingSection = {
  padding: '24px 20px',
  margin: '0 0 24px',
};

const pricingColumn = {
  width: '33.33%',
  verticalAlign: 'top' as const,
  padding: '0 8px',
};

const pricingTier = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px 16px',
  textAlign: 'center' as const,
};

const pricingTierPopular = {
  border: '2px solid #f59e0b',
  backgroundColor: '#fffbeb',
};

const popularBadge = {
  backgroundColor: '#f59e0b',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  padding: '4px 8px',
  borderRadius: '4px',
  display: 'inline-block',
  margin: '0 0 12px',
};

const pricingName = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
};

const pricingPrice = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 4px',
  lineHeight: '1',
};

const pricingCredits = {
  color: '#6b7280',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '1.3',
};

const pricingRate = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
  lineHeight: '1.4',
};

const tipCard = {
  backgroundColor: '#f0f9ff', // Light blue
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 20px 24px',
};

const tipTitle = {
  color: '#075985',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px',
  lineHeight: '1.3',
};

const tipList = {
  margin: '0',
};

const tipItem = {
  color: '#0c4a6e',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px',
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
