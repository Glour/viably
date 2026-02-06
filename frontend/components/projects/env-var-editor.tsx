"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { EnvVariable } from "@/types"

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const KEY_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]*$/

/* ------------------------------------------------------------------ */
/*  EnvVarEditor                                                        */
/* ------------------------------------------------------------------ */

interface EnvVarEditorProps {
  initialVars: EnvVariable[]
}

export function EnvVarEditor({ initialVars }: EnvVarEditorProps) {
  const [vars, setVars] = useState<EnvVariable[]>(initialVars)

  const addVar = useCallback(() => {
    setVars((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key: "", value: "", isRevealed: false },
    ])
  }, [])

  const removeVar = useCallback((id: string) => {
    setVars((prev) => prev.filter((v) => v.id !== id))
  }, [])

  const toggleReveal = useCallback((id: string) => {
    setVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isRevealed: !v.isRevealed } : v))
    )
  }, [])

  const updateKey = useCallback((id: string, key: string) => {
    setVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, key } : v))
    )
  }, [])

  const updateValue = useCallback((id: string, value: string) => {
    setVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, value } : v))
    )
  }, [])

  const isKeyInvalid = (key: string) => key.length > 0 && !KEY_PATTERN.test(key)

  return (
    <div className="space-y-3">
      {vars.map((v) => (
        <div key={v.id} className="flex items-center gap-2">
          <Input
            value={v.key}
            onChange={(e) => updateKey(v.id, e.target.value)}
            placeholder="KEY"
            className={`w-40 font-mono ${isKeyInvalid(v.key) ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
          />
          <Input
            value={v.value}
            type={v.isRevealed ? "text" : "password"}
            onChange={(e) => updateValue(v.id, e.target.value)}
            placeholder="value"
            className="flex-1 font-mono"
          />
          <Button variant="ghost" size="icon" onClick={() => toggleReveal(v.id)}>
            {v.isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => removeVar(v.id)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addVar}>
        <Plus className="size-4 mr-2" />
        Добавить переменную
      </Button>
    </div>
  )
}
