import { Button } from '@react-email/components'

/**
 * Props for reusable email button component
 */
export interface EmailButtonProps {
  /** Button click destination URL */
  href: string
  /** Button text content */
  children: React.ReactNode
  /** Button background color (default: primary purple) */
  backgroundColor?: string
  /** Button text color (default: white) */
  textColor?: string
  /** Button size variant */
  size?: 'small' | 'medium' | 'large'
}

/**
 * Reusable Email Button Component
 *
 * Cross-client compatible button with inline styles
 * Supports size variants and custom colors
 */
export default function EmailButton({
  href,
  children,
  backgroundColor = '#7C3AED',
  textColor = '#ffffff',
  size = 'medium',
}: EmailButtonProps) {
  const sizeStyles = {
    small: {
      fontSize: '14px',
      padding: '12px 24px',
    },
    medium: {
      fontSize: '16px',
      padding: '16px 40px',
    },
    large: {
      fontSize: '18px',
      padding: '18px 48px',
    },
  }

  const buttonStyle = {
    backgroundColor,
    borderRadius: '8px',
    color: textColor,
    display: 'inline-block',
    fontWeight: '600',
    lineHeight: '1',
    textDecoration: 'none',
    textAlign: 'center' as const,
    cursor: 'pointer',
    ...sizeStyles[size],
  }

  return (
    <Button style={buttonStyle} href={href}>
      {children}
    </Button>
  )
}
