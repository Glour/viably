'use client'
import React from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'pt', flag: '🇧🇷', label: 'PT' },
]

export function LanguageSwitcher() {
  const [isPending, setIsPending] = React.useState(false)

  const current =
    typeof document !== 'undefined'
      ? (document.cookie.match(/locale=([^;]+)/)?.[1] ?? 'en')
      : 'en'

  const currentLang = LANGS.find((l) => l.code === current) ?? LANGS[0]

  const setLocale = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`
    setIsPending(true)
    window.location.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isPending}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          <span>{currentLang.flag}</span>
          <span>{currentLang.label}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[7rem]">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={`flex items-center gap-2 cursor-pointer ${
              l.code === current ? 'font-semibold text-primary' : ''
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
            {l.code === current && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
