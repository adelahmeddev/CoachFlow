import { pool } from "@/lib/db"
import { CoachSubscriptionStatus } from "@/lib/db/enums"
import { getCurrentSession } from "@/server/auth"

export type SubscriptionCheckResult = {
  hasActiveSubscription: boolean
  status: CoachSubscriptionStatus | null
  endDate: Date | null
  daysRemaining: number | null
  subscriptionId: string | null
}

function daysRemaining(endDate: Date | string | null): number | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

/**
 * Centralized guard — single source of truth.
 * ACTIVE with future endDate => hasActiveSubscription true.
 * EXPIRED/SUSPENDED or past endDate => false.
 * Mutates ACTIVE past endDate to EXPIRED.
 */
export async function checkSubscriptionStatus(coachId: string): Promise<SubscriptionCheckResult> {
  try {
    const res = await pool.query(
      `SELECT "id", "status", "endDate" FROM "CoachSubscription" WHERE "coachId" = $1 LIMIT 1`,
      [coachId]
    )

    if (res.rowCount === 0) {
      return { hasActiveSubscription: false, status: null, endDate: null, daysRemaining: null, subscriptionId: null }
    }

    const row = res.rows[0] as { id: string; status: CoachSubscriptionStatus; endDate: Date }
    let status = row.status
    const endDate = row.endDate ? new Date(row.endDate) : null

    // Auto-expire if past endDate
    if (status === CoachSubscriptionStatus.ACTIVE && endDate && new Date() > endDate) {
      try {
        await pool.query(`UPDATE "CoachSubscription" SET "status" = 'EXPIRED'::"CoachSubscriptionStatus", "updatedAt" = NOW() WHERE "id" = $1`, [row.id])
      } catch {}
      status = CoachSubscriptionStatus.EXPIRED
    }

    const remaining = endDate ? daysRemaining(endDate) : null
    const hasActive = status === CoachSubscriptionStatus.ACTIVE && remaining !== null && remaining >= 0

    return { hasActiveSubscription: hasActive, status, endDate, daysRemaining: remaining, subscriptionId: row.id }
  } catch {
    // DB unreachable — fail open to avoid blocking coach (other services already fallback)
    return { hasActiveSubscription: true, status: CoachSubscriptionStatus.ACTIVE, endDate: null, daysRemaining: null, subscriptionId: null }
  }
}

export async function requireActiveSubscription() {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) return null
  const result = await checkSubscriptionStatus(session.user.trainerProfileId)
  if (!result.hasActiveSubscription) {
    return { ok: false as const, status: result.status, endDate: result.endDate, daysRemaining: result.daysRemaining }
  }
  return { ok: true as const, status: result.status, subscriptionId: result.subscriptionId }
}

export async function getCoachSubscription(coachId: string) {
  try {
    const res = await pool.query(`SELECT * FROM "CoachSubscription" WHERE "coachId" = $1 LIMIT 1`, [coachId])
    return res.rows[0] ?? null
  } catch {
    return null
  }
}
