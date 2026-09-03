import type { Locale } from "./config"

export function formatDate(
  date: Date | string | null | undefined,
  locale: Locale
): string {
  if (!date) return "—"
  // Always use Latin digits (u-nu-latn) even for Arabic locale — requirement: all numbers in English
  const intl = locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  return new Intl.DateTimeFormat(intl, { dateStyle: "medium" }).format(
    new Date(date)
  )
}

export function formatNumber(
  value: number | null | undefined,
  _locale: Locale
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  // All numbers in English (Latin digits) regardless of UI language
  return new Intl.NumberFormat("en-GB", { useGrouping: true }).format(value)
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`
  )
}