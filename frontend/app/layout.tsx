import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { spaceGrotesk, inter, jetbrainsMono } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: "Viably",
  description: "Платформа для создания Telegram-ботов с помощью ИИ",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="viably-theme"
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
