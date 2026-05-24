"use client"

import { MessageCircle } from "lucide-react"

export function HelpButton() {
  return (
    <a
      href="https://t.me/viably_support_bot"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl group"
      style={{ background: "var(--accent-gradient)" }}
      title="Помощь — @viably_support_bot"
      aria-label="Открыть поддержку в Telegram"
    >
      <MessageCircle className="w-5 h-5 text-white" />
      {/* Tooltip */}
      <span className="absolute right-14 bg-[#1E1E2E] text-white/90 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/[0.08] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
        Нужна помощь?
      </span>
    </a>
  )
}
