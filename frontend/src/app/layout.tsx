import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Providers } from "./providers"
import { plusJakartaSans, inter, jetbrainsMono } from "./fonts"
import { Toaster, AuthInitializer, OfflineBannerWrapper } from "./client-components"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: "%s | Viably",
    default: "Viably — AI-Powered Telegram Bot Builder",
  },
  description: "Создавай Telegram-ботов за 60 секунд. Без кода. Без знаний. Просто опиши идею.",
  keywords: ["telegram bot", "no-code", "AI", "bot builder", "viably"],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="viably-theme-v2"
            disableTransitionOnChange={false}
          >
            <NextIntlClientProvider locale={locale} messages={messages}>
              <OfflineBannerWrapper />
              <AuthInitializer />
              {children}
              <Toaster richColors position="top-right" />
            </NextIntlClientProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
