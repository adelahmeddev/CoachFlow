import { cache } from "react"
import { cookies } from "next/headers"
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirForLocale,
  isLocale,
  type Locale,
} from "./config"
import { en, type Dictionary } from "./messages/en"
import { ar } from "./messages/ar"

export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirForLocale,
  htmlLangForLocale,
  isLocale,
} from "./config"
export type { Locale } from "./config"
export type { Dictionary } from "./messages/en"

const dictionaries: Record<Locale, Dictionary> = { en, ar }

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

export const getI18n = cache(async () => {
  const locale = await getLocale()
  return {
    locale,
    dir: dirForLocale(locale),
    t: getDictionary(locale),
  }
})