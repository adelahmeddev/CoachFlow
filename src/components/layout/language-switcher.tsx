"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n/client"
import { type Locale } from "@/lib/i18n/config"
import { setLocaleAction } from "@/server/actions/locale"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
  const { locale, t } = useI18n()
  const [isPending, setIsPending] = useState(false)

  async function handleToggle() {
    if (isPending) return
    setIsPending(true)
    const next: Locale = locale === "en" ? "ar" : "en"
    const result = await setLocaleAction(next)
    if (result.ok) {
      window.location.reload()
      return
    }
    setIsPending(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 font-bold px-2 text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={t.common.switchLanguage}
      title={t.common.switchLanguage}
    >
      <span className={locale === "en" ? "text-foreground" : "text-muted-foreground/50"}>EN</span>
      <span className="mx-1 text-muted-foreground/30">|</span>
      <span className={locale === "ar" ? "text-foreground" : "text-muted-foreground/50"}>AR</span>
    </Button>
  )
}
