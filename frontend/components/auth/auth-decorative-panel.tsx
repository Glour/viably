"use client"

import { GlowOrbs } from "@/components/ui/glow-orbs"
import { Badge } from "@/components/ui/badge"

export function AuthDecorativePanel() {
  return (
    <aside className="hidden md:flex h-full w-full relative overflow-hidden bg-[image:var(--gradient-main)] flex-col justify-center p-12">
      {/* Glow orbs with custom positioning and opacity */}
      <GlowOrbs className="absolute inset-0 opacity-20" />

      {/* Content layer above glow orbs */}
      <div className="relative z-10 flex flex-col gap-6">
        <h2 className="font-heading text-5xl font-bold text-white leading-tight">
          Create anything.
          <br />
          Ship instantly.
        </h2>

        <Badge variant="secondary" className="w-fit">
          1,200+ bots deployed
        </Badge>
      </div>
    </aside>
  )
}
