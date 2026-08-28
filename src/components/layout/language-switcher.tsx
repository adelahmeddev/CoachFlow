"use client"

import { useState } from "react"
import { Check, Languages } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { type Locale } from "@/lib/i18n/config"
import { setLocaleAction } from "@/server/actions/locale"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LOCALE_ORDER: Locale[] = ["ar", "en"]

export function LanguageSwitcher() {
  const { locale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSelect(next: Locale) {
    if (next === locale || isPending) return
    setIsPending(true)
    const result = await setLocaleAction(next)
    if (result.ok) {
      window.location.reload()
      return
    }
    setIsPending(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label={t.common.switchLanguage}
          title={t.common.switchLanguage}
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
{LOCALE_ORDER.map((item) => (
            <DropdownMenuItem
              key={item}
              disabled={isPending}
              onSelect={() => handleSelect(item)}
            >
              <span className="flex-1">
                {item === "en"
                  ? t.common.english
                  : t.common.arabic}
              </span>
              {locale === item ? <Check className="size-4" /> : null}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
