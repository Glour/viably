export const metadata = {
  title: 'Landing Page Template',
  description: 'Production-ready landing page built with Next.js',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
