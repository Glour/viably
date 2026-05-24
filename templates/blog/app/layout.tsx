export const metadata = {
  title: 'My Blog',
  description: 'A blog built with Next.js and MDX',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
