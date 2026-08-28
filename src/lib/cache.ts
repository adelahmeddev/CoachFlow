import { unstable_cache, updateTag } from "next/cache"

type Serializable = string | number | boolean | null

export function withCache<TResult>(
  fn: () => Promise<TResult>,
  keyParts: string[],
  tags: string[],
  revalidateSeconds: number
): () => Promise<TResult> {
  return unstable_cache(fn, keyParts, {
    tags,
    revalidate: revalidateSeconds,
  })
}

export function invalidate(tags: string[]) {
  for (const tag of tags) {
    updateTag(tag)
  }
}

export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null
}

export type IsoDate = string
export type { Serializable }
