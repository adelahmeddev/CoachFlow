import { pool, generateId } from "@/lib/db"
import { CoachSubscriptionStatus } from "@/lib/db/enums"

// ─── Helpers ────────────────────────────────────────────────────────────────

function calculateEndDate(startDate: Date, durationDays: number): Date {
  const d = new Date(startDate)
  d.setDate(d.getDate() + durationDays)
  return d
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function getDaysRemaining(endDate: Date | string | null): number | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return 0
  return diff
}

export function getRemainingLabel(endDate: Date | string | null, status: string | null): string {
  if (status === "SUSPENDED") return "Suspended"
  if (!endDate) return "No subscription"
  const days = getDaysRemaining(endDate)
  if (days === null) return "—"
  if (days === 0) return "Expires today"
  if (days < 0) return "Expired"
  if (days === 1) return "1 day remaining"
  return `${days} days remaining`
}

// ─── Read ─────────────────────────────────────────────────────────────────

export async function getCoachSubscriptionRow(coachId: string) {
  const res = await pool.query(
    `SELECT * FROM "CoachSubscription" WHERE "coachId" = $1 LIMIT 1`,
    [coachId]
  )
  return res.rows[0] ?? null
}

export async function getCoachSubscriptionWithPayments(coachId: string) {
  const sub = await getCoachSubscriptionRow(coachId)
  if (!sub) return { subscription: null, payments: [] }
  const payRes = await pool.query(
    `SELECT * FROM "PaymentRecord" WHERE "coachId" = $1 ORDER BY "paymentDate" DESC, "createdAt" DESC`,
    [coachId]
  )
  return { subscription: sub, payments: payRes.rows }
}

// ─── Admin: Set / Create ──────────────────────────────────────────────────

export type SetSubscriptionInput = {
  coachId: string
  startDate: Date
  durationDays?: number
  endDate?: Date
  amountPaid: number
  paymentDate: Date
  notes?: string | null
  status?: CoachSubscriptionStatus
}

export async function setCoachSubscription(input: SetSubscriptionInput) {
  const endDate = input.endDate ?? calculateEndDate(input.startDate, input.durationDays ?? 30)
  const status = input.status ?? CoachSubscriptionStatus.ACTIVE

  const existing = await pool.query(`SELECT "id" FROM "CoachSubscription" WHERE "coachId" = $1 LIMIT 1`, [input.coachId])

  const subId = existing.rows[0]?.id ?? generateId()

  if (existing.rowCount && existing.rowCount > 0) {
    const res = await pool.query(
      `UPDATE "CoachSubscription" SET "startDate" = $1, "endDate" = $2, "amountPaid" = $3, "paymentDate" = $4, "status" = $5::"CoachSubscriptionStatus", "notes" = $6, "updatedAt" = NOW() WHERE "id" = $7 RETURNING *`,
      [input.startDate, endDate, input.amountPaid, input.paymentDate, status, input.notes ?? null, subId]
    )
    // record payment history
    await pool.query(
      `INSERT INTO "PaymentRecord" ("id","coachId","subscriptionId","amount","paymentDate","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [generateId(), input.coachId, subId, input.amountPaid, input.paymentDate, input.notes ?? null]
    )
    return res.rows[0]
  } else {
    const res = await pool.query(
      `INSERT INTO "CoachSubscription" ("id","coachId","startDate","endDate","amountPaid","paymentDate","status","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7::"CoachSubscriptionStatus",$8,NOW(),NOW()) RETURNING *`,
      [subId, input.coachId, input.startDate, endDate, input.amountPaid, input.paymentDate, status, input.notes ?? null]
    )
    await pool.query(
      `INSERT INTO "PaymentRecord" ("id","coachId","subscriptionId","amount","paymentDate","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [generateId(), input.coachId, subId, input.amountPaid, input.paymentDate, input.notes ?? null]
    )
    return res.rows[0]
  }
}

// ─── Admin: Extend ────────────────────────────────────────────────────────

export async function extendCoachSubscription(
  coachId: string,
  extendDays: number,
  amountPaid?: number,
  paymentDate?: Date,
  notes?: string | null
) {
  if (!Number.isFinite(extendDays) || extendDays <= 0 || extendDays > 365) throw new Error("Invalid duration")

  const sub = await getCoachSubscriptionRow(coachId)
  if (!sub) throw new Error("No subscription found")

  const base = new Date(sub.endDate)
  const now = new Date()
  const start = base < now ? now : base
  const newEnd = new Date(start)
  newEnd.setDate(newEnd.getDate() + extendDays)

  const newAmount = amountPaid ?? Number(sub.amountPaid)
  const newPaymentDate = paymentDate ?? new Date()

  const res = await pool.query(
    `UPDATE "CoachSubscription" SET "endDate" = $1, "amountPaid" = $2, "paymentDate" = $3, "notes" = COALESCE($4, "notes"), "status" = 'ACTIVE'::"CoachSubscriptionStatus", "updatedAt" = NOW() WHERE "id" = $5 RETURNING *`,
    [newEnd, newAmount, newPaymentDate, notes ?? null, sub.id]
  )

  await pool.query(
    `INSERT INTO "PaymentRecord" ("id","coachId","subscriptionId","amount","paymentDate","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
    [generateId(), coachId, sub.id, newAmount, newPaymentDate, notes ?? `Extended by ${extendDays} days`]
  )

  return res.rows[0]
}

// ─── Admin: Status ────────────────────────────────────────────────────────

export async function setSubscriptionStatus(coachId: string, status: CoachSubscriptionStatus) {
  const res = await pool.query(
    `UPDATE "CoachSubscription" SET "status" = $1::"CoachSubscriptionStatus", "updatedAt" = NOW() WHERE "coachId" = $2 RETURNING *`,
    [status, coachId]
  )
  if (!res.rows[0]) throw new Error("Subscription not found")
  return res.rows[0]
}

export async function suspendSubscription(coachId: string) {
  return setSubscriptionStatus(coachId, CoachSubscriptionStatus.SUSPENDED)
}

export async function activateSubscription(coachId: string) {
  return setSubscriptionStatus(coachId, CoachSubscriptionStatus.ACTIVE)
}

// ─── Expiration sync (called by guard) ───────────────────────────────────

export async function syncExpiryIfNeeded(coachId: string) {
  const sub = await getCoachSubscriptionRow(coachId)
  if (!sub) return null
  if (sub.status === CoachSubscriptionStatus.SUSPENDED) return sub
  if (sub.status === CoachSubscriptionStatus.EXPIRED) return sub
  const now = new Date()
  if (new Date(sub.endDate) < now && sub.status === CoachSubscriptionStatus.ACTIVE) {
    await pool.query(`UPDATE "CoachSubscription" SET "status" = 'EXPIRED'::"CoachSubscriptionStatus", "updatedAt" = NOW() WHERE "id" = $1`, [sub.id])
    sub.status = CoachSubscriptionStatus.EXPIRED
  }
  return sub
}

// ─── List for admin ───────────────────────────────────────────────────────

export async function listCoachSubscriptions(params: {
  status?: CoachSubscriptionStatus | string
  q?: string
  filter?: string // "expiring_soon"
  page?: number
  perPage?: number
}) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10
  const offset = (page - 1) * perPage

  const whereParts: string[] = []
  const whereParams: unknown[] = []
  let idx = 1

  if (params.status) {
    whereParts.push(`cs."status" = $${idx}::"CoachSubscriptionStatus"`)
    whereParams.push(params.status)
    idx++
  }
  if (params.filter === "expiring_soon") {
    whereParts.push(`cs."status" = 'ACTIVE'::"CoachSubscriptionStatus" AND cs."endDate" BETWEEN NOW() AND NOW() + INTERVAL '7 days'`)
  }
  if (params.q) {
    whereParts.push(`(tp."fullName" ILIKE $${idx} OR tp."phone" ILIKE $${idx})`)
    whereParams.push(`%${params.q}%`)
    idx++
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : ""

  // Total coaches vs subscriptions: we list subscriptions only; expired coaches without sub won't appear — we also want to show coaches without sub as expired? Simpler: list subscriptions table.
  const [totalRes, rowsRes] = await Promise.all([
    pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "CoachSubscription" cs JOIN "TrainerProfile" tp ON tp."id" = cs."coachId" ${whereSql}`,
      whereParams
    ),
    pool.query(
      `SELECT cs.*, tp."fullName" as "coachName", tp."phone" as "coachPhone", tp."accountStatus"
       FROM "CoachSubscription" cs
       JOIN "TrainerProfile" tp ON tp."id" = cs."coachId"
       ${whereSql}
       ORDER BY cs."endDate" ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...whereParams, perPage, offset]
    ),
  ])

  // Also compute expiring_soon count if needed elsewhere
  return {
    subscriptions: rowsRes.rows,
    total: (totalRes.rows[0] as { count: number }).count,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil((totalRes.rows[0] as { count: number }).count / perPage)),
  }
}

export async function listPaymentRecords(coachId: string) {
  const res = await pool.query(`SELECT * FROM "PaymentRecord" WHERE "coachId" = $1 ORDER BY "paymentDate" DESC`, [coachId])
  return res.rows
}
