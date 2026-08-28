"use client"

import { SessionProvider } from "next-auth/react"
import { Direction } from "radix-ui"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { LocaleProvider } from "@/lib/i18n/client"
import type { Locale } from "@/lib/i18n/config"
import { dirForLocale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/messages/en"

export function Providers({
  children,
  locale,
  dictionary,
}: {
  children: React.ReactNode
  locale: Locale
  dictionary: Dictionary
}) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Direction.Provider dir={dirForLocale(locale)}>
          <LocaleProvider locale={locale} t={dictionary}>
            {children}
            <Toaster richColors position="bottom-center" />
          </LocaleProvider>
        </Direction.Provider>
      </SessionProvider>
    </ThemeProvider>
  )
}

