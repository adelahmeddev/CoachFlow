export const LOCALES = ["en", "ar"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "ar"

export const LOCALE_COOKIE = "locale"

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (LOCALES as readonly string[]).includes(value)
  )
}

export function dirForLocale(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr"
}

export function htmlLangForLocale(locale: Locale): "en" | "ar" {
  return locale === "ar" ? "ar" : "en"
}