import type { Locale } from "./config"

export function formatDate(
  date: Date | string | null | undefined,
  locale: Locale
): string {
  if (!date) return "—"
  const intl = locale === "ar" ? "ar-EG" : "en-GB"
  return new Intl.DateTimeFormat(intl, { dateStyle: "medium" }).format(
    new Date(date)
  )
}

export function formatNumber(
  value: number | null | undefined,
  locale: Locale
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  const intl = locale === "ar" ? "ar-EG" : "en-GB"
  return new Intl.NumberFormat(intl).format(value)
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`
  )
}