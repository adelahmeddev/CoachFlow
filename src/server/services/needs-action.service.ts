import { pool } from "@/lib/db"
import { getActiveGoalDeadlines } from "@/server/services/goal.service"
import {
  evaluateClientActions,
  type ClientActionSnapshot,
  type NeedActionItem,
} from "@/lib/needs-action"

const DAY_MS = 24 * 60 * 60 * 1000

export interface NeedsActionSummary {
  items: NeedActionItem[]
  counts: { HIGH: number; MEDIUM: number; LOW: number }
}

/**
 * Coach "needs action" feed, computed on read from existing data (no
 * Action/Alert table, no duplicates to clean up). Batched queries regardless
 * of client count — never one query per client. Scales to 1000+ clients:
 * fixed query count, indexed GROUP BYs, selected columns only.
 */
export async function getNeedsAction(trainerProfileId: string): Promise<NeedsActionSummary> {
  const clientsRes = await pool.query<{
    id: string
    fullName: string | null
    status: string
  }>(
    `SELECT "id", "fullName", "status" FROM "Client"
     WHERE "trainerId" = $1 AND "status" IN ('ACTIVE'::"ClientStatus", 'PENDING_ASSESSMENT'::"ClientStatus")
     ORDER BY "createdAt" DESC LIMIT 1000`,
    [trainerProfileId]
  )
  const clients = clientsRes.rows as { id: string; fullName: string | null; status: string }[]
  if (clients.length === 0) {
    return { items: [], counts: { HIGH: 0, MEDIUM: 0, LOW: 0 } }
  }

  const ids = clients.map((c) => c.id)
  if (ids.length === 0) return { items: [], counts: { HIGH: 0, MEDIUM: 0, LOW: 0 } }
  const nowMs = Date.now()

  const [activityRes, subRes, inbodyRes, proofsRes, checkinRes, mediaRes, goalDeadlines] = await Promise.all([
    pool.query<{ clientId: string; lastDate: Date }>(
      `SELECT "clientId", MAX("date") AS "lastDate" FROM "ExerciseLog"
       WHERE "clientId"::text = ANY($1)
       GROUP BY "clientId"`,
      [ids]
    ),
    pool.query<{ clientId: string; status: string; endDate: Date | null }>(
      `SELECT DISTINCT ON ("clientId") "clientId", "status", "endDate" FROM "Subscription"
       WHERE "clientId"::text = ANY($1)
       ORDER BY "clientId", "createdAt" DESC`,
      [ids]
    ),
    pool.query<{ clientId: string; lastDate: Date }>(
      `SELECT "clientId", MAX("date") AS "lastDate" FROM "BodyComposition"
       WHERE "clientId"::text = ANY($1)
       GROUP BY "clientId"`,
      [ids]
    ),
    pool.query<{ clientId: string; count: number; lastDate: Date }>(
      `SELECT "clientId", COUNT(*)::int AS count, MAX("createdAt") AS "lastDate" FROM "PaymentProof"
       WHERE "trainerId" = $2 AND "status" = 'PENDING'::"PaymentProofStatus"
        AND "clientId"::text = ANY($1)
       GROUP BY "clientId"`,
      [ids, trainerProfileId]
    ),
    pool.query<{ clientId: string; lastDate: Date }>(
      `SELECT "clientId", MAX("date") AS "lastDate" FROM "DailyLog"
       WHERE "clientId"::text = ANY($1)
         AND ("energyLevel" IS NOT NULL OR "sleepHours" IS NOT NULL
              OR "moodLevel" IS NOT NULL OR ("notes" IS NOT NULL AND "notes" != ''))
       GROUP BY "clientId"`,
      [ids]
    ),
    pool.query<{ clientId: string; count: number; lastDate: Date }>(
      `SELECT "clientId", COUNT(*)::int AS count, MAX("createdAt") AS "lastDate" FROM "ProgressMedia"
       WHERE "trainerId" = $2 AND "status" = 'PENDING'::"ProgressMediaStatus"
        AND "clientId"::text = ANY($1)
       GROUP BY "clientId"`,
      [ids, trainerProfileId]
    ),
    getActiveGoalDeadlines(ids),
  ])

  const daysSince = (d: Date | undefined): number | null =>
    d ? Math.floor((nowMs - new Date(d).getTime()) / DAY_MS) : null
  const isoOrNull = (d: Date | undefined): string | null =>
    d ? new Date(d).toISOString() : null

  const activityBy = new Map((activityRes.rows as { clientId: string; lastDate: Date }[]).map((r) => [r.clientId, r.lastDate]))
  const subBy = new Map((subRes.rows as { clientId: string; status: string; endDate: Date | null }[]).map((r) => [r.clientId, r]))
  const inbodyBy = new Map((inbodyRes.rows as { clientId: string; lastDate: Date }[]).map((r) => [r.clientId, r.lastDate]))
  const proofsBy = new Map((proofsRes.rows as { clientId: string; count: number; lastDate: Date }[]).map((r) => [r.clientId, r]))
  const checkinBy = new Map((checkinRes.rows as { clientId: string; lastDate: Date }[]).map((r) => [r.clientId, r.lastDate]))
  const mediaBy = new Map((mediaRes.rows as { clientId: string; count: number; lastDate: Date }[]).map((r) => [r.clientId, r]))

  const items: NeedActionItem[] = []
  for (const c of clients) {
    const sub = subBy.get(c.id)
    const proof = proofsBy.get(c.id)
    const media = mediaBy.get(c.id)
    const goalDl = goalDeadlines.get(c.id)
    const snap: ClientActionSnapshot = {
      clientId: c.id,
      clientName: c.fullName,
      isActive: c.status === "ACTIVE",
      daysSinceActivity: daysSince(activityBy.get(c.id)),
      lastActivityAt: isoOrNull(activityBy.get(c.id)),
      latestSubscription: sub
        ? { status: sub.status, endDate: sub.endDate ? new Date(sub.endDate).toISOString() : null }
        : null,
      daysSinceInBody: daysSince(inbodyBy.get(c.id)),
      lastInbodyAt: isoOrNull(inbodyBy.get(c.id)),
      pendingProofs: proof?.count ?? 0,
      lastProofAt: proof ? isoOrNull(proof.lastDate) : null,
      daysSinceCheckin: daysSince(checkinBy.get(c.id)),
      lastCheckinAt: isoOrNull(checkinBy.get(c.id)),
      pendingMedia: media?.count ?? 0,
      lastMediaAt: media ? isoOrNull(media.lastDate) : null,
      nearestGoalDeadline: goalDl
        ? { deadline: new Date(goalDl.deadline).toISOString(), title: goalDl.title }
        : null,
    }
    items.push(...evaluateClientActions(snap, nowMs))
  }

  const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const
  items.sort((a, b) => rank[a.priority] - rank[b.priority])
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const i of items) counts[i.priority] += 1
  return { items: items.slice(0, 50), counts }
}
