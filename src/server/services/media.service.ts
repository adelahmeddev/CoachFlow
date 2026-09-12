import { pool, generateId, withTransaction } from "@/lib/db"
import type { ProgressMediaType } from "@/lib/db/enums"
import type { ProgressMedia } from "@/lib/db/types"

async function assertClientOwnedByTrainer(clientId: string, trainerId: string) {
  const res = await pool.query(
    `SELECT "id", "trainerId" FROM "Client" WHERE "id" = $1 LIMIT 1`,
    [clientId]
  )
  const client = res.rows[0] as { id: string; trainerId: string } | undefined
  if (!client || client.trainerId !== trainerId) return null
  return client
}

export async function uploadMedia(params: {
  clientId: string
  trainerId: string
  type: ProgressMediaType
  storageUrl: string
  title?: string | null
  note?: string | null
}): Promise<ProgressMedia> {
  const client = await assertClientOwnedByTrainer(params.clientId, params.trainerId)
  if (!client) throw new Error("CLIENT_NOT_FOUND")

  const res = await pool.query<ProgressMedia>(
    `INSERT INTO "ProgressMedia" ("id", "clientId", "trainerId", "type", "storageUrl", "title", "note", "status", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::"ProgressMediaType", $5, $6, $7, 'PENDING'::"ProgressMediaStatus", NOW(), NOW())
     RETURNING *`,
    [
      generateId(),
      params.clientId,
      params.trainerId,
      params.type,
      params.storageUrl,
      params.title?.trim() ? params.title.trim() : null,
      params.note?.trim() ? params.note.trim() : null,
    ]
  )
  return res.rows[0] as ProgressMedia
}

export async function listMediaForClient(
  clientId: string,
  opts: { type?: ProgressMediaType; limit?: number } = {}
): Promise<ProgressMedia[]> {
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 60)
  // Never select storageUrl in lists — it can be megabytes. Fetch on demand.
  const params: unknown[] = [clientId]
  const conditions = [`"clientId" = $1`]
  if (opts.type) {
    params.push(opts.type)
    conditions.push(`"type" = $${params.length}::"ProgressMediaType"`)
  }
  const res = await pool.query<ProgressMedia>(
    `SELECT "id", "clientId", "trainerId", "type", "title", "note", "status",
            "feedback", "reviewedBy", "reviewedAt", "createdAt", "updatedAt",
            LEFT("storageUrl", 0) AS "storageUrl"
     FROM "ProgressMedia" WHERE ${conditions.join(" AND ")}
     ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`,
    [...params, limit]
  )
  return res.rows as ProgressMedia[]
}

export async function getMediaItem(
  mediaId: string,
  scope: { clientId?: string; trainerId?: string }
): Promise<ProgressMedia | null> {
  const conditions: string[] = [`"id" = $1`]
  const params: unknown[] = [mediaId]
  if (scope.clientId) {
    params.push(scope.clientId)
    conditions.push(`"clientId" = $${params.length}`)
  }
  if (scope.trainerId) {
    params.push(scope.trainerId)
    conditions.push(`"trainerId" = $${params.length}`)
  }
  const res = await pool.query<ProgressMedia>(
    `SELECT * FROM "ProgressMedia" WHERE ${conditions.join(" AND ")} LIMIT 1`,
    params
  )
  return (res.rows[0] as ProgressMedia | undefined) ?? null
}

/** Coach-scoped per-client media (IDOR-safe: ownership verified first). */
export async function listMediaForClientOfTrainer(
  clientId: string,
  trainerId: string,
  limit = 30
): Promise<ProgressMedia[] | null> {
  const owned = await assertClientOwnedByTrainer(clientId, trainerId)
  if (!owned) return null
  return listMediaForClient(clientId, { limit })
}

export async function countPendingMedia(trainerId: string): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count FROM "ProgressMedia"
     WHERE "trainerId" = $1 AND "status" = 'PENDING'::"ProgressMediaStatus"`,
    [trainerId]
  )
  return (res.rows[0] as { count: number }).count
}

export async function countPendingMediaByClient(
  trainerId: string,
  clientIds: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (clientIds.length === 0) return out
  const placeholders = clientIds.map((_, i) => `$${i + 2}`).join(",")
  const res = await pool.query<{ clientId: string; count: number }>(
    `SELECT "clientId", COUNT(*)::int AS count FROM "ProgressMedia"
     WHERE "trainerId" = $1 AND "status" = 'PENDING'::"ProgressMediaStatus"
       AND "clientId" IN (${placeholders})
     GROUP BY "clientId"`,
    [trainerId, ...clientIds]
  )
  for (const row of res.rows as { clientId: string; count: number }[]) {
    out.set(row.clientId, row.count)
  }
  return out
}

export type ReviewMediaResult =
  | { ok: true; media: ProgressMedia }
  | { ok: false; error: "NOT_FOUND" }

export async function reviewMedia(params: {
  trainerId: string
  mediaId: string
  reviewerUserId: string
  feedback?: string | null
}): Promise<ReviewMediaResult> {
  return withTransaction(async (tx) => {
    const updated = await tx.query<ProgressMedia>(
      `UPDATE "ProgressMedia"
       SET "status" = 'REVIEWED'::"ProgressMediaStatus", "feedback" = $1,
           "reviewedBy" = $2, "reviewedAt" = NOW(), "updatedAt" = NOW()
       WHERE "id" = $3 AND "trainerId" = $4
       RETURNING *`,
      [
        params.feedback?.trim() ? params.feedback.trim() : null,
        params.reviewerUserId,
        params.mediaId,
        params.trainerId,
      ]
    )
    const media = (updated.rows[0] as ProgressMedia | undefined) ?? null
    if (!media) return { ok: false as const, error: "NOT_FOUND" as const }
    return { ok: true as const, media }
  })
}
