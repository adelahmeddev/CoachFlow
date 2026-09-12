import { pool, generateId } from "@/lib/db"
import type { NotificationType } from "@/lib/db/enums"
import type { Notification } from "@/lib/db/types"

export interface NotifyInput {
  userId: string
  type: NotificationType
  /** i18n key under `notifications.items.*` (title/body), resolved in viewer locale. */
  titleKey: string
  bodyKey: string
  params?: Record<string, string | number>
  link?: string | null
  /** When set, insert becomes idempotent: duplicates are skipped. */
  dedupeKey?: string | null
}

export type NotifyResult =
  | { ok: true; notification: Notification }
  | { ok: true; notification: null; deduped: true }
  | { ok: false; error: "USER_NOT_FOUND" }

/**
 * Create one notification. With `dedupeKey`, concurrent/duplicate calls are
 * safe: `ON CONFLICT DO NOTHING` guarantees at most one row per key, so
 * scheduled jobs can be retried or overlap without spamming the user.
 */
export async function createNotification(input: NotifyInput): Promise<NotifyResult> {
  const userRes = await pool.query(`SELECT "id" FROM "User" WHERE "id" = $1 LIMIT 1`, [input.userId])
  if (!userRes.rows[0]) return { ok: false, error: "USER_NOT_FOUND" }

  const id = generateId()
  const res = await pool.query<Notification>(
    `INSERT INTO "Notification" ("id", "userId", "type", "titleKey", "bodyKey", "params", "link", "dedupeKey", "createdAt")
     VALUES ($1, $2, $3::"NotificationType", $4, $5, $6::jsonb, $7, $8, NOW())
     ON CONFLICT ("dedupeKey") DO NOTHING
     RETURNING *`,
    [
      id,
      input.userId,
      input.type,
      input.titleKey,
      input.bodyKey,
      JSON.stringify(input.params ?? {}),
      input.link ?? null,
      input.dedupeKey ?? null,
    ]
  )
  const row = (res.rows[0] as Notification | undefined) ?? null
  // Without a dedupeKey no conflict is possible, so a missing row always
  // means "already existed" for a deduped insert.
  if (!row) return { ok: true, notification: null, deduped: true }
  return { ok: true, notification: row }
}

/** Best-effort wrapper for event hooks: never throws into the main flow. */
export async function notifySafe(input: NotifyInput): Promise<void> {
  try {
    await createNotification(input)
  } catch (err) {
    console.error("[notify] failed", input.type, input.userId, err)
  }
}

export interface RecipientPair {
  clientUserId: string | null
  trainerUserId: string | null
  trainerId: string
  clientName: string | null
  trainerName: string | null
}

/** Resolve both User ids (+ display names) for a client. Single query. */
export async function getRecipientPair(clientId: string): Promise<RecipientPair | null> {
  const res = await pool.query(
    `SELECT c."userId" AS "clientUserId", c."trainerId" AS "trainerId",
            c."fullName" AS "clientName", tp."userId" AS "trainerUserId", tp."fullName" AS "trainerName"
     FROM "Client" c JOIN "TrainerProfile" tp ON tp."id" = c."trainerId"
     WHERE c."id" = $1 LIMIT 1`,
    [clientId]
  )
  const row = (res.rows[0] as RecipientPair | undefined) ?? null
  return row
}

/**
 * Notify all clients (that have logins) about a plan change.
 * One user lookup for all ids, then one insert per recipient.
 */
export async function notifyClientsPlanUpdated(
  clientIds: string[],
  plan: "nutrition" | "training",
  coachName: string | null
): Promise<void> {
  if (clientIds.length === 0) return
  const placeholders = clientIds.map((_, i) => `$${i + 1}`).join(",")
  const res = await pool.query<{ id: string; userId: string | null }>(
    `SELECT "id", "userId" FROM "Client" WHERE "id" IN (${placeholders})`,
    clientIds
  )
  for (const row of res.rows as { id: string; userId: string | null }[]) {
    if (!row.userId) continue
    await notifySafe({
      userId: row.userId,
      type: "PLAN_UPDATED",
      titleKey: "planUpdatedTitle",
      bodyKey: "planUpdatedBody",
      params: { coach: coachName ?? "", plan: `@plan.${plan}` },
      link: plan === "nutrition" ? "/client/nutrition" : "/client/workout/today",
    })
  }
}

export interface NotificationPage {
  notifications: Notification[]
  nextCursor: string | null
}

/**
 * Cursor pagination (createdAt DESC, id DESC) — never loads full history.
 * Cursor format: `${createdAtISO}|${id}`.
 */
export async function listNotifications(
  userId: string,
  opts: { cursor?: string | null; limit?: number; unreadOnly?: boolean } = {}
): Promise<NotificationPage> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50)
  const params: unknown[] = [userId]
  const conditions = [`"userId" = $1`]

  if (opts.unreadOnly) conditions.push(`"readAt" IS NULL`)

  if (opts.cursor) {
    const [iso, id] = opts.cursor.split("|")
    if (iso && id) {
      params.push(new Date(iso), id)
      conditions.push(`("createdAt", "id") < ($${params.length - 1}, $${params.length})`)
    }
  }

  const where = conditions.join(" AND ")
  const res = await pool.query<Notification>(
    `SELECT * FROM "Notification" WHERE ${where}
     ORDER BY "createdAt" DESC, "id" DESC LIMIT $${params.length + 1}`,
    [...params, limit + 1]
  )
  const rows = res.rows as Notification[]
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const last = page[page.length - 1]
  return {
    notifications: page,
    nextCursor:
      hasMore && last ? `${new Date(last.createdAt).toISOString()}|${last.id}` : null,
  }
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count FROM "Notification" WHERE "userId" = $1 AND "readAt" IS NULL`,
    [userId]
  )
  return (res.rows[0] as { count: number }).count
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<boolean> {
  const res = await pool.query(
    `UPDATE "Notification" SET "readAt" = NOW() WHERE "id" = $1 AND "userId" = $2 AND "readAt" IS NULL`,
    [notificationId, userId]
  )
  return (res.rowCount ?? 0) > 0
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const res = await pool.query(
    `UPDATE "Notification" SET "readAt" = NOW() WHERE "userId" = $1 AND "readAt" IS NULL`,
    [userId]
  )
  return res.rowCount ?? 0
}
