"use client"

import { useState } from "react"
import { Globe, CheckCircle2, XCircle, Loader2, ExternalLink, Trash2, Info } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "sonner"
import { getAccessToken } from "@/shared/api/tokens"

interface CustomDomainPanelProps {
  projectId: string
  currentDomain?: string | null
  subdomainUrl?: string | null
  onDomainChanged?: () => void
}

interface VerifyResult {
  verified: boolean
  cname_found: string | null
  expected_cname: string
  message: string
}

export function CustomDomainPanel({
  projectId,
  currentDomain,
  subdomainUrl,
  onDomainChanged,
}: CustomDomainPanelProps) {
  const [domain, setDomain] = useState(currentDomain ?? "")
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const token = getAccessToken()

  // Expected CNAME value to show in instructions
  const expectedCname = subdomainUrl
    ? subdomainUrl.replace("https://", "").replace("http://", "")
    : "<your-subdomain>.viably.dev"

  const handleVerify = async () => {
    if (!domain.trim()) return
    setVerifying(true)
    setVerifyResult(null)
    try {
      const res = await fetch(
        `/api/deploy/projects/${projectId}/domain/verify?domain=${encodeURIComponent(domain.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail ?? "Ошибка проверки DNS")
        return
      }
      const data = await res.json()
      setVerifyResult(data)
    } catch {
      toast.error("Не удалось проверить DNS")
    } finally {
      setVerifying(false)
    }
  }

  const handleSave = async () => {
    if (!domain.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/deploy/projects/${projectId}/domain`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: domain.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail ?? "Не удалось подключить домен")
        return
      }
      toast.success(`Домен ${domain} подключён! SSL-сертификат будет выдан автоматически.`)
      onDomainChanged?.()
    } catch {
      toast.error("Ошибка сети")
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      const res = await fetch(`/api/deploy/projects/${projectId}/domain`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail ?? "Не удалось удалить домен")
        return
      }
      setDomain("")
      setVerifyResult(null)
      toast.success("Кастомный домен удалён")
      onDomainChanged?.()
    } catch {
      toast.error("Ошибка сети")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="size-4 text-primary shrink-0" />
        <h3 className="font-heading text-sm font-semibold">Кастомный домен</h3>
        {currentDomain && (
          <span className="ml-auto text-xs text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            Подключён
          </span>
        )}
      </div>

      {/* Current domain badge */}
      {currentDomain && (
        <div className="flex items-center gap-2 text-sm">
          <a
            href={`https://${currentDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            {currentDomain}
            <ExternalLink className="size-3" />
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-destructive hover:text-destructive h-7 px-2"
            onClick={handleRemove}
            disabled={removing}
          >
            {removing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </Button>
        </div>
      )}

      {/* DNS instructions */}
      <div className="rounded-lg bg-muted/40 border border-border/30 p-3 space-y-2">
        <p className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
          <Info className="size-3.5 shrink-0" />
          Как подключить свой домен
        </p>
        <ol className="text-xs text-muted-foreground space-y-1 pl-4 list-decimal">
          <li>Войдите в панель управления вашего регистратора доменов</li>
          <li>
            Добавьте CNAME-запись:
            <code className="ml-1 px-1.5 py-0.5 rounded bg-background border border-border text-[11px] font-mono">
              @ → {expectedCname}
            </code>
          </li>
          <li>Дождитесь распространения DNS (обычно 5–30 минут)</li>
          <li>Нажмите «Проверить» и затем «Подключить»</li>
        </ol>
      </div>

      {/* Domain input */}
      <div className="space-y-2">
        <Label className="text-xs">Ваш домен</Label>
        <div className="flex gap-2">
          <Input
            placeholder="example.com"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value)
              setVerifyResult(null)
            }}
            className="font-mono text-sm h-9"
            disabled={saving || removing}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            onClick={handleVerify}
            disabled={!domain.trim() || verifying || saving}
          >
            {verifying ? <Loader2 className="size-3.5 animate-spin" /> : "Проверить"}
          </Button>
        </div>
      </div>

      {/* DNS verify result */}
      {verifyResult && (
        <div
          className={`rounded-lg p-3 text-xs border flex items-start gap-2 ${
            verifyResult.verified
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
              : "bg-amber-500/10 border-amber-500/20 text-amber-600"
          }`}
        >
          {verifyResult.verified ? (
            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="size-3.5 shrink-0 mt-0.5" />
          )}
          <span>{verifyResult.message}</span>
        </div>
      )}

      {/* Save button */}
      <Button
        className="w-full h-9 text-sm font-semibold"
        style={{ background: "var(--accent-gradient)" }}
        onClick={handleSave}
        disabled={!domain.trim() || saving || removing || (verifyResult !== null && !verifyResult.verified)}
      >
        {saving ? (
          <>
            <Loader2 className="size-3.5 animate-spin mr-2" />
            Подключаем...
          </>
        ) : currentDomain ? (
          "Обновить домен"
        ) : (
          "Подключить домен"
        )}
      </Button>
    </div>
  )
}
