import { unstable_cache, updateTag, revalidateTag } from "next/cache"

type Serializable = string | number | boolean | null

const inFlightRequests = new Map<string, Promise<unknown>>()

export function withCache<TResult>(
  fn: () => Promise<TResult>,
  keyParts: string[],
  tags: string[],
  revalidateSeconds: number
): () => Promise<TResult> {
  const cachedFn = unstable_cache(
    async () => {
      const cacheKey = keyParts.join("::")
      const existing = inFlightRequests.get(cacheKey)
      if (existing) {
        return existing as Promise<TResult>
      }

      const promise = fn().finally(() => {
        inFlightRequests.delete(cacheKey)
      })
      inFlightRequests.set(cacheKey, promise)
      return promise
    },
    keyParts,
    {
      tags,
      revalidate: revalidateSeconds,
    }
  )

  return cachedFn
}

export function invalidate(tags: string[]) {
  for (const tag of tags) {
    try {
      revalidateTag(tag, "max")
    } catch {}
    try {
      updateTag(tag)
    } catch {}
  }
}

export function invalidateDashboard(trainerProfileId: string) {
  const tag = `trainer:${trainerProfileId}:dashboard`
  try {
    revalidateTag(tag, "max")
  } catch {}
  try {
    updateTag(tag)
  } catch {}
}

export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null
}

export type IsoDate = string
export type { Serializable }
