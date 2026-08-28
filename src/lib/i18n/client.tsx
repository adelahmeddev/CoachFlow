"use client"

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react"
import { dirForLocale, type Locale } from "./config"
import type { Dictionary } from "./messages/en"

interface I18nContextValue {
  locale: Locale
  dir: "ltr" | "rtl"
  t: Dictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LocaleProvider({
  locale,
  t,
  children,
}: {
  locale: Locale
  t: Dictionary
  children: ReactNode
}) {
  const value = useMemo(
    () => ({ locale, dir: dirForLocale(locale), t }),
    [locale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within a LocaleProvider")
  }
  return context
}
