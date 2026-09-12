/**
 * Needs-Action rule evaluation (pure — safe to unit test).
 *
 * The service layer fetches one batched snapshot per client; this module
 * turns each snapshot into zero or more action items. No I/O here.
 */

export type ActionPriority = "HIGH" | "MEDIUM" | "LOW"

export type NeedActionKind =
  | "inactive_5d"
  | "inactive_3d"
  | "sub_expired"
  | "sub_expiring"
  | "no_inbody"
  | "payment_pending"
  | "missed_checkin"
  | "checkin_today"
  | "media_pending"
  | "goal_deadline"

export interface NeedActionItem {
  clientId: string
  clientName: string | null
  kind: NeedActionKind
  priority: ActionPriority
  /** Days relevant to the rule (days inactive / days until expiry / …). */
  days: number | null
  /** Extra context (e.g. pending proof count, goal title for deadlines). */
  count: number | null
  title: string | null
  /** ISO timestamp of the underlying event (log date, expiry, review…). */
  at: string | null
  cta: string
}

export interface ClientActionSnapshot {
  clientId: string
  clientName: string | null
  /** Only ACTIVE clients are evaluated for activity/check-in/InBody rules. */
  isActive: boolean
  /** Days since last workout log, null when never. */
  daysSinceActivity: number | null
  lastActivityAt?: string | null
  latestSubscription: { status: string; endDate: string | null } | null
  /** Days since last body-composition entry, null when never. */
  daysSinceInBody: number | null
  lastInbodyAt?: string | null
  pendingProofs: number
  lastProofAt?: string | null
  /** Days since last daily check-in, null when never. */
  daysSinceCheckin: number | null
  lastCheckinAt?: string | null
  pendingMedia?: number
  lastMediaAt?: string | null
  nearestGoalDeadline?: { deadline: string; title: string } | null
}

export const INACTIVITY_HIGH_DAYS = 5
export const INACTIVITY_MEDIUM_DAYS = 3
export const SUB_EXPIRY_WINDOW_DAYS = 7
export const INBODY_STALE_DAYS = 30
export const CHECKIN_MISSED_DAYS = 2

export function daysUntil(endDateIso: string, nowMs: number): number {
  return Math.ceil((new Date(endDateIso).getTime() - nowMs) / (24 * 60 * 60 * 1000))
}

/**
 * Evaluate every rule for one client. Returns actions sorted HIGH → LOW.
 * Never emits duplicates: at most one item per kind per client.
 */
export function evaluateClientActions(
  snap: ClientActionSnapshot,
  nowMs: number = Date.now()
): NeedActionItem[] {
  const items: NeedActionItem[] = []
  const base = { clientId: snap.clientId, clientName: snap.clientName }

  if (snap.isActive) {
    if (snap.daysSinceActivity === null || snap.daysSinceActivity > INACTIVITY_HIGH_DAYS) {
      items.push({
        ...base,
        kind: "inactive_5d",
        priority: "HIGH",
        days: snap.daysSinceActivity,
        count: null,
        title: null,
        at: snap.lastActivityAt ?? null,
        cta: `/clients/${snap.clientId}`,
      })
    } else if (snap.daysSinceActivity > INACTIVITY_MEDIUM_DAYS) {
      items.push({
        ...base,
        kind: "inactive_3d",
        priority: "MEDIUM",
        days: snap.daysSinceActivity,
        count: null,
        title: null,
        at: snap.lastActivityAt ?? null,
        cta: `/clients/${snap.clientId}`,
      })
    }

    if (snap.daysSinceInBody === null || snap.daysSinceInBody > INBODY_STALE_DAYS) {
      items.push({
        ...base,
        kind: "no_inbody",
        priority: "LOW",
        days: snap.daysSinceInBody,
        count: null,
        title: null,
        at: snap.lastInbodyAt ?? null,
        cta: `/clients/${snap.clientId}?tab=body-composition`,
      })
    }

    if (snap.daysSinceCheckin === null || snap.daysSinceCheckin >= CHECKIN_MISSED_DAYS) {
      items.push({
        ...base,
        kind: "missed_checkin",
        priority: "LOW",
        days: snap.daysSinceCheckin,
        count: null,
        title: null,
        at: snap.lastCheckinAt ?? null,
        cta: `/messages/${snap.clientId}`,
      })
    } else if (snap.daysSinceCheckin === 1) {
      // Checked in yesterday but not today — gentle nudge for engaged clients.
      items.push({
        ...base,
        kind: "checkin_today",
        priority: "LOW",
        days: 1,
        count: null,
        title: null,
        at: snap.lastCheckinAt ?? null,
        cta: `/clients/${snap.clientId}`,
      })
    }

    if ((snap.pendingMedia ?? 0) > 0) {
      items.push({
        ...base,
        kind: "media_pending",
        priority: "MEDIUM",
        days: null,
        count: snap.pendingMedia ?? 0,
        title: null,
        at: snap.lastMediaAt ?? null,
        cta: `/clients/${snap.clientId}?tab=media`,
      })
    }

    if (snap.nearestGoalDeadline) {
      const left = daysUntil(snap.nearestGoalDeadline.deadline, nowMs)
      if (left >= 0 && left <= SUB_EXPIRY_WINDOW_DAYS) {
        items.push({
          ...base,
          kind: "goal_deadline",
          priority: "LOW",
          days: left,
          count: null,
          title: snap.nearestGoalDeadline.title,
          at: snap.nearestGoalDeadline.deadline,
          cta: `/clients/${snap.clientId}?tab=goals`,
        })
      }
    }
  }

  const sub = snap.latestSubscription
  if (sub) {
    if (sub.status === "EXPIRED") {
      items.push({
        ...base,
        kind: "sub_expired",
        priority: "HIGH",
        days: null,
        count: null,
        title: null,
        at: sub.endDate,
        cta: `/clients/${snap.clientId}?tab=subscription`,
      })
    } else if (
      (sub.status === "ACTIVE" || sub.status === "TRIAL") &&
      sub.endDate
    ) {
      const left = daysUntil(sub.endDate, nowMs)
      if (left >= 0 && left <= SUB_EXPIRY_WINDOW_DAYS) {
        items.push({
          ...base,
          kind: "sub_expiring",
          priority: "MEDIUM",
          days: left,
          count: null,
          title: null,
          at: sub.endDate,
          cta: `/clients/${snap.clientId}?tab=subscription`,
        })
      } else if (left < 0) {
        // Past end date but status not yet flipped — treat as expired.
        items.push({
          ...base,
          kind: "sub_expired",
          priority: "HIGH",
          days: null,
          count: null,
          title: null,
          at: sub.endDate,
          cta: `/clients/${snap.clientId}?tab=subscription`,
        })
      }
    }
  }

  if (snap.pendingProofs > 0) {
    items.push({
      ...base,
      kind: "payment_pending",
      priority: "HIGH",
      days: null,
      count: snap.pendingProofs,
      title: null,
      at: snap.lastProofAt ?? null,
      cta: `/clients/${snap.clientId}?tab=subscription`,
    })
  }

  const rank: Record<ActionPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  return items.sort((a, b) => rank[a.priority] - rank[b.priority])
}
