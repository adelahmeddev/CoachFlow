import { pool, generateId, withTransaction } from "@/lib/db"
import { PlanType, SubscriptionStatus } from "@/lib/db/enums"
import type { Subscription } from "@/lib/db/types"
import type {
  RenewSubscriptionInput,
  SubscriptionInput,
} from "@/lib/validations/subscription"

const DAY_MS = 24 * 60 * 60 * 1000

type SubscriptionLike = {
  status: SubscriptionStatus
  createdAt: Date
}

/**
 * Shared "current subscription" selector.
 * Prefers the latest subscription with status ACTIVE or TRIAL,
 * otherwise falls back to the latest subscription by createdAt.
 * Input should be sorted by createdAt descending.
 */
export function pickCurrentSubscription<T extends SubscriptionLike>(
  subscriptions: T[]
): T | null {
  if (subscriptions.length === 0) return null
  return (
    subscriptions.find(
      (subscription) =>
        subscription.status === SubscriptionStatus.ACTIVE ||
        subscription.status === SubscriptionStatus.TRIAL
    ) ??
    subscriptions[0] ??
    null
  )
}

function toDateOrNull(value: string | undefined): Date | null {
  if (!value) return null
  return new Date(`${value}T00:00:00Z`)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

type NormalizedSubscriptionData = Pick<
  Subscription,
  | "planType"
  | "startDate"
  | "endDate"
  | "durationDays"
  | "sessionsCount"
  | "remainingSessions"
>

/**
 * Normalize form input by plan type:
 * - SESSIONS plans keep session counters and never carry a duration/end date.
 * - PERIOD plans carry a duration in days; the end date is derived
 *   from start date + duration when not provided explicitly.
 */
function normalizeSubscriptionData(
  data: SubscriptionInput
): NormalizedSubscriptionData {
  const startDate = toDateOrNull(data.startDate ?? "")

  const explicitEndDate = toDateOrNull(data.endDate ?? "")

  if (data.planType === PlanType.SESSIONS) {
    const sessionsCount =
      data.sessionsCount === "" || data.sessionsCount === undefined
        ? null
        : data.sessionsCount
    let remainingSessions =
      data.remainingSessions === "" || data.remainingSessions === undefined
        ? null
        : data.remainingSessions
    if (sessionsCount !== null && remainingSessions === null) {
      remainingSessions = sessionsCount
    }

    return {
      planType: PlanType.SESSIONS,
      startDate,
      endDate: null,
      durationDays: null,
      sessionsCount,
      remainingSessions,
    }
  }

  const durationDays =
    data.durationDays === "" || data.durationDays === undefined
      ? null
      : data.durationDays
  const endDate =
    explicitEndDate ??
    (startDate && durationDays ? addDays(startDate, durationDays) : null)

  return {
    planType: PlanType.PERIOD,
    startDate,
    endDate,
    durationDays,
    sessionsCount: null,
    remainingSessions: null,
  }
}

export async function getOwnedClient(
  clientId: string,
  trainerProfileId: string
) {
  const res = await pool.query(
    `SELECT "id", "fullName" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
    [clientId, trainerProfileId]
  )
  return (res.rows[0] as { id: string; fullName: string | null } | undefined) ?? null
}

export async function getCurrentSubscription(
  clientId: string,
  trainerProfileId: string
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const res = await pool.query<Subscription>(
    `SELECT * FROM "Subscription" WHERE "clientId" = $1 ORDER BY "createdAt" DESC`,
    [client.id]
  )
  const subscriptions = res.rows as Subscription[]
  return pickCurrentSubscription(subscriptions)
}

export async function getClientSubscriptionData(
  clientId: string,
  trainerProfileId: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const res = await pool.query<Subscription>(
    `SELECT * FROM "Subscription" WHERE "clientId" = $1 ORDER BY "createdAt" DESC`,
    [client.id]
  )
  const subscriptions = res.rows as Subscription[]
  return {
    client,
    subscriptions,
    currentSubscription: pickCurrentSubscription(subscriptions),
  }
}

export async function getSubscriptionForEdit(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const res = await pool.query<Subscription>(
    `SELECT * FROM "Subscription" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [subscriptionId, client.id]
  )
  return (res.rows[0] as Subscription) ?? null
}

export async function createSubscription(
  clientId: string,
  trainerProfileId: string,
  data: SubscriptionInput
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const status = data.status
  const isCurrentStatus =
    status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL
  const normalized = normalizeSubscriptionData(data)

  return withTransaction(async (tx) => {
    if (isCurrentStatus) {
      await tx.query(
        `UPDATE "Subscription" SET "status" = 'EXPIRED'::"SubscriptionStatus", "updatedAt" = NOW() WHERE "clientId" = $1 AND "status" IN ('ACTIVE'::"SubscriptionStatus", 'TRIAL'::"SubscriptionStatus")`,
        [client.id]
      )
    }

    const id = generateId()
    const res = await tx.query(
      `INSERT INTO "Subscription" ("id", "clientId", "planName", "planType", "status", "paymentStatus", "startDate", "endDate", "durationDays", "sessionsCount", "remainingSessions", "autoRenew", "notes", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::"PlanType", $5::"SubscriptionStatus", $6::"PaymentStatus", $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        id,
        client.id,
        (data.planName ?? "").trim(),
        normalized.planType,
        status,
        data.paymentStatus,
        normalized.startDate,
        normalized.endDate,
        normalized.durationDays,
        normalized.sessionsCount,
        normalized.remainingSessions,
        data.autoRenew,
        data.notes?.trim() || null,
      ]
    )
    return res.rows[0] as Subscription
  })
}

export async function updateSubscription(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string,
  data: SubscriptionInput
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const checkRes = await pool.query(
    `SELECT "id", "status" FROM "Subscription" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [subscriptionId, client.id]
  )
  const subscription = checkRes.rows[0] as { id: string; status: string } | undefined
  if (!subscription) return null

  const status = data.status
  const isCurrentStatus =
    status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL
  const normalized = normalizeSubscriptionData(data)

  return withTransaction(async (tx) => {
    if (isCurrentStatus && subscription.status !== status) {
      await tx.query(
        `UPDATE "Subscription" SET "status" = 'EXPIRED'::"SubscriptionStatus", "updatedAt" = NOW() WHERE "clientId" = $1 AND "status" IN ('ACTIVE'::"SubscriptionStatus", 'TRIAL'::"SubscriptionStatus")`,
        [client.id]
      )
    }

    const res = await tx.query(
      `UPDATE "Subscription" SET "planName" = $1, "planType" = $2::"PlanType", "status" = $3::"SubscriptionStatus", "paymentStatus" = $4::"PaymentStatus", "startDate" = $5, "endDate" = $6, "durationDays" = $7, "sessionsCount" = $8, "remainingSessions" = $9, "autoRenew" = $10, "notes" = $11, "updatedAt" = NOW() WHERE "id" = $12 RETURNING *`,
      [
        (data.planName ?? "").trim(),
        normalized.planType,
        status,
        data.paymentStatus,
        normalized.startDate,
        normalized.endDate,
        normalized.durationDays,
        normalized.sessionsCount,
        normalized.remainingSessions,
        data.autoRenew,
        data.notes?.trim() || null,
        subscriptionId,
      ]
    )
    return (res.rows[0] as Subscription) ?? null
  })
}

export async function updateSubscriptionStatus(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string,
  status: SubscriptionStatus
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const checkRes = await pool.query(
    `SELECT "id" FROM "Subscription" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [subscriptionId, client.id]
  )
  if (!checkRes.rows[0]) return null

  return withTransaction(async (tx) => {
    if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL) {
      await tx.query(
        `UPDATE "Subscription" SET "status" = 'EXPIRED'::"SubscriptionStatus", "updatedAt" = NOW() WHERE "clientId" = $1 AND "status" IN ('ACTIVE'::"SubscriptionStatus", 'TRIAL'::"SubscriptionStatus")`,
        [client.id]
      )
    }

    const res = await tx.query(
      `UPDATE "Subscription" SET "status" = $1::"SubscriptionStatus", "updatedAt" = NOW() WHERE "id" = $2 RETURNING *`,
      [status, subscriptionId]
    )
    return (res.rows[0] as Subscription) ?? null
  })
}

export async function renewSubscription(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string,
  data: RenewSubscriptionInput
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const checkRes = await pool.query(
    `SELECT "id", "planType", "durationDays", "endDate", "startDate", "sessionsCount" FROM "Subscription" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [subscriptionId, client.id]
  )
  const subscription = checkRes.rows[0] as
    | {
        id: string
        planType: string
        durationDays: number | null
        endDate: Date | null
        startDate: Date | null
        sessionsCount: number | null
      }
    | undefined
  if (!subscription) return null

  const newEndDate = toDateOrNull(data.newEndDate ?? "")

  // PERIOD plans without an explicit end date are extended by their
  // own duration from the later of today and the current end date.
  let periodEndDate: Date | undefined
  if (subscription.planType === PlanType.PERIOD && !newEndDate) {
    const durationDays = subscription.durationDays
    if (durationDays) {
      const now = new Date()
      const base =
        subscription.endDate && subscription.endDate > now
          ? subscription.endDate
          : now
      periodEndDate = addDays(base, durationDays)
    }
  }

  return withTransaction(async (tx) => {
    await tx.query(
      `UPDATE "Subscription" SET "status" = 'EXPIRED'::"SubscriptionStatus", "updatedAt" = NOW() WHERE "clientId" = $1 AND "status" IN ('ACTIVE'::"SubscriptionStatus", 'TRIAL'::"SubscriptionStatus")`,
      [client.id]
    )

    const setClauses: string[] = []
    const values: unknown[] = []
    let idx = 1

    setClauses.push(`"status" = $${idx++}::"SubscriptionStatus"`)
    values.push(SubscriptionStatus.ACTIVE)
    setClauses.push(`"paymentStatus" = $${idx++}::"PaymentStatus"`)
    values.push(data.paymentStatus)

    if (newEndDate || periodEndDate) {
      const end = newEndDate ?? periodEndDate!
      setClauses.push(`"endDate" = $${idx++}`)
      values.push(end)
      const start =
        subscription.startDate ?? toDateOrNull(data.newEndDate ?? "") ?? new Date()
      setClauses.push(`"startDate" = $${idx++}`)
      values.push(start)
    }

    if (
      data.resetSessions &&
      subscription.planType === PlanType.SESSIONS &&
      subscription.sessionsCount !== null
    ) {
      setClauses.push(`"remainingSessions" = $${idx++}`)
      values.push(subscription.sessionsCount)
    }

    setClauses.push(`"updatedAt" = NOW()`)

    const sql = `UPDATE "Subscription" SET ${setClauses.join(", ")} WHERE "id" = $${idx} RETURNING *`
    values.push(subscriptionId)

    const res = await tx.query(sql, values)
    return (res.rows[0] as Subscription) ?? null
  })
}

export async function consumeOneSession(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  // Atomic conditional decrement — eliminates the read-check-write race condition.
  // The WHERE clause on remainingSessions > 0 ensures the decrement only happens
  // if sessions are still available at the moment of the write, not at the time
  // of a prior read. Two concurrent requests can no longer both "see" remaining > 0
  // and both decrement past zero.
  const updated = await pool.query(
    `UPDATE "Subscription" SET "remainingSessions" = "remainingSessions" - 1, "updatedAt" = NOW() WHERE "id" = $1 AND "clientId" = $2 AND "remainingSessions" > 0`,
    [subscriptionId, client.id]
  )

  if ((updated.rowCount ?? 0) === 0) return null

  // Fetch and return the updated record for the action layer.
  const res = await pool.query<Subscription>(
    `SELECT * FROM "Subscription" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [subscriptionId, client.id]
  )
  return (res.rows[0] as Subscription) ?? null
}
