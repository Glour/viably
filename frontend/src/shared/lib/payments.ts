/**
 * Payment helpers — Stripe, YooKassa, NowPayments crypto
 */

// Stripe checkout
export async function createPaymentAndRedirect(tier: string, token: string): Promise<void> {
  const successUrl = `${window.location.origin}/payments/success`
  const cancelUrl  = `${window.location.origin}/payments/cancel`
  const res = await fetch(`/api/stripe/create-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan_id: tier, currency: "usd", success_url: successUrl, cancel_url: cancelUrl }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Payment creation failed") }
  const data = await res.json()
  if (data.url) window.location.href = data.url
  else throw new Error("No checkout URL received")
}

// YooKassa (RUB cards)
export async function createYooKassaPaymentAndRedirect(tier: string, token: string): Promise<void> {
  const returnUrl = `${window.location.origin}/payments/success`
  const res = await fetch(`/api/payments/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan_id: tier, return_url: returnUrl }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Payment creation failed") }
  const data = await res.json()
  if (data.confirmation_url) window.location.href = data.confirmation_url
  else throw new Error("No confirmation URL received")
}

// NowPayments crypto
export async function createCryptoInvoiceAndRedirect(tier: string, token: string, interval: string = "month"): Promise<void> {
  const returnUrl = `${window.location.origin}/payments/success`
  const res = await fetch(`/api/crypto/create-invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan_id: tier, interval, return_url: returnUrl }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Crypto invoice creation failed") }
  const data = await res.json()
  if (data.invoice_url) window.location.href = data.invoice_url
  else throw new Error("No invoice URL received")
}
