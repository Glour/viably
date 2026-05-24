export const metadata = {
  title: 'John Doe - Portfolio',
  description: 'Full-Stack Developer Portfolio',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
