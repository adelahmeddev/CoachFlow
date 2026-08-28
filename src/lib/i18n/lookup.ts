import type { Dictionary } from "@/lib/i18n/messages/en"

export function lookup(t: Dictionary, path: string): string {
  return path
    .split(".")
    .reduce<unknown>((acc, part) => {
      if (typeof acc === "object" && acc !== null) {
        return (acc as Record<string, unknown>)[part]
      }
      return acc
    }, t as unknown) as string
}