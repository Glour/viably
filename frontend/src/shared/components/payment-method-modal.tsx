'use client'

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Loader2, X } from "lucide-react"
import {
  createPaymentAndRedirect,
  createYooKassaPaymentAndRedirect,
  createCryptoInvoiceAndRedirect,
} from "@/shared/lib/payments"

interface PaymentMethodModalProps {
  tier: string
  interval?: string
  onClose: () => void
}

type Method = "stripe" | "yookassa" | "crypto"

const METHODS = [
  {
    id: "stripe" as Method,
    emoji: "💳",
    gradient: "from-violet-500/20 to-blue-500/20",
    hover: "hover:border-violet-500/40",
    title: "Банковская карта",
    subtitle: "Visa · Mastercard · Apple Pay",
  },
  {
    id: "yookassa" as Method,
    emoji: "🇷🇺",
    gradient: "from-green-500/20 to-emerald-500/20",
    hover: "hover:border-emerald-500/40",
    title: "Российская карта",
    subtitle: "Мир · SberPay · ЮКасса",
  },
  {
    id: "crypto" as Method,
    emoji: "₿",
    gradient: "from-orange-500/20 to-yellow-500/20",
    hover: "hover:border-orange-500/40",
    title: "Криптовалюта",
    subtitle: "USDT · BTC · ETH · TON",
    badge: "0.5% fee",
  },
]

function ModalContent({ tier, interval = "month", onClose }: PaymentMethodModalProps) {
  const [loading, setLoading] = useState<Method | null>(null)
  const [error, setError] = useState<string | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("viably_access_token") : null

  const handleSelect = async (method: Method) => {
    if (!token) { setError("Необходима авторизация"); return }
    setLoading(method)
    setError(null)
    try {
      if (method === "stripe")   await createPaymentAndRedirect(tier, token)
      if (method === "yookassa") await createYooKassaPaymentAndRedirect(tier, token)
      if (method === "crypto")   await createCryptoInvoiceAndRedirect(tier, token, interval)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка оплаты")
      setLoading(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-[360px] rounded-2xl border border-white/10 bg-[#111116] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <p className="text-white font-semibold text-[15px]">Способ оплаты</p>
            <p className="text-white/35 text-xs mt-0.5">Выберите удобный вариант</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-white/40 hover:text-white/80 transition-all"
          >
            <X size={13} />
          </button>
        </div>

        {/* Options */}
        <div className="px-3 pb-3 space-y-1.5">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m.id)}
              disabled={!!loading}
              className={`w-full flex items-center gap-3 rounded-xl bg-white/4 ${m.hover} border border-white/6 px-3.5 py-3 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center text-[17px] flex-shrink-0`}>
                {loading === m.id
                  ? <Loader2 size={16} className="text-white/60 animate-spin" />
                  : m.emoji
                }
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm font-medium whitespace-nowrap">{m.title}</span>
                  {m.badge && (
                    <span className="text-[10px] px-1.5 py-px rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 whitespace-nowrap font-medium">
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="text-white/35 text-[11px] mt-px whitespace-nowrap">{m.subtitle}</p>
              </div>

              {/* Arrow */}
              <span className="text-white/20 text-lg flex-shrink-0">›</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-3 mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
            {error}
          </div>
        )}

        <div className="pb-3.5 text-center">
          <p className="text-[11px] text-white/20">🔒 Безопасная оплата · Данные карты не хранятся</p>
        </div>
      </div>
    </div>
  )
}

export function PaymentMethodModal(props: PaymentMethodModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(<ModalContent {...props} />, document.body)
}
