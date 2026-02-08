import { Section, Text, Hr, Link } from '@react-email/components'

/**
 * Props for email footer component
 */
export interface EmailFooterProps {
  /** Company/brand name */
  companyName?: string
  /** Base URL for links (e.g., https://viably.dev) */
  baseUrl?: string
  /** Support URL */
  supportUrl?: string
  /** Email preferences/unsubscribe URL */
  preferencesUrl?: string
  /** Show copyright year */
  showCopyright?: boolean
}

/**
 * Reusable Email Footer Component
 *
 * Includes separator line, footer links, and copyright
 * Cross-client compatible with inline styles
 */
export default function EmailFooter({
  companyName = 'Viably',
  baseUrl = 'https://viably.dev',
  supportUrl = 'https://viably.dev/support',
  preferencesUrl = 'https://viably.dev/settings/notifications',
  showCopyright = true,
}: EmailFooterProps) {
  return (
    <Section style={{ padding: '32px 32px 40px' }}>
      <Hr
        style={{
          borderColor: '#e6ebf1',
          borderStyle: 'solid' as const,
          borderWidth: '1px 0 0 0',
          margin: '0 0 24px',
        }}
      />

      <Text
        style={{
          color: '#8898aa',
          fontSize: '14px',
          lineHeight: '1.6',
          margin: '8px 0',
          textAlign: 'center' as const,
        }}
      >
        You're receiving this email because you created an account at {companyName}.
      </Text>

      <Text
        style={{
          color: '#8898aa',
          fontSize: '14px',
          lineHeight: '1.6',
          margin: '8px 0',
          textAlign: 'center' as const,
        }}
      >
        <Link href={preferencesUrl} style={{ color: '#7C3AED', textDecoration: 'none' }}>
          Email Preferences
        </Link>
        {' • '}
        <Link href={supportUrl} style={{ color: '#7C3AED', textDecoration: 'none' }}>
          Support
        </Link>
        {' • '}
        <Link href={baseUrl} style={{ color: '#7C3AED', textDecoration: 'none' }}>
          {companyName}.dev
        </Link>
      </Text>

      {showCopyright && (
        <Text
          style={{
            color: '#9ca3af',
            fontSize: '13px',
            lineHeight: '1.5',
            margin: '16px 0 0',
            textAlign: 'center' as const,
          }}
        >
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </Text>
      )}
    </Section>
  )
}
