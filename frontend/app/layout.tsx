import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { AuthInitializer } from "@/components/auth/auth-initializer"
import { OfflineBannerWrapper } from "@/components/ui/offline-banner-wrapper"
import { Providers } from "./providers"
import { spaceGrotesk, inter, jetbrainsMono } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: "%s | Viably",
    default: "Viably — AI-Powered Telegram Bot Builder",
  },
  description: "Создавай Telegram-ботов за 60 секунд. Без кода. Без знаний. Просто опиши идею.",
  keywords: ["telegram bot", "no-code", "AI", "bot builder", "viably"],
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
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey="viably-theme"
            disableTransitionOnChange={false}
          >
            <OfflineBannerWrapper />
            <AuthInitializer />
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
