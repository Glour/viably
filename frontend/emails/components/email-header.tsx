import { Section, Row, Column, Heading } from '@react-email/components'

/**
 * Props for email header component
 */
export interface EmailHeaderProps {
  /** Brand/company name to display */
  brandName?: string
  /** Background color for header */
  backgroundColor?: string
  /** Text color for brand name */
  textColor?: string
}

/**
 * Reusable Email Header Component
 *
 * Displays brand name in header section
 * Can be extended to include logo image
 */
export default function EmailHeader({
  brandName = 'Viably',
  backgroundColor = '#7C3AED',
  textColor = '#ffffff',
}: EmailHeaderProps) {
  return (
    <Section style={{ backgroundColor, padding: '32px 20px', textAlign: 'center' as const }}>
      <Row>
        <Column align="center">
          <Heading
            style={{
              color: textColor,
              fontSize: '28px',
              fontWeight: '700',
              margin: '0',
              letterSpacing: '-0.5px',
            }}
          >
            {brandName}
          </Heading>
        </Column>
      </Row>
    </Section>
  )
}
