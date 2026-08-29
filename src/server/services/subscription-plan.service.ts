import { pool, generateId, withTransaction } from "@/lib/db"
import {
  PaymentStatus,
  PlanType,
  SubscriptionStatus,
} from "@/lib/db/enums"
import type { SubscriptionPlan } from "@/lib/db/types"
import type { SubscriptionPlanInput } from "@/lib/validations/subscription-plan"
import { invalidate } from "@/lib/cache"

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function todayUtc(): Date {
  return new Date(`${new Date().toISOString().split("T")[0]}T00:00:00Z`)
}

async function getOwnedPlan(
  planId: string,
  trainerProfileId: string
): Promise<SubscriptionPlan | null> {
  const res = await pool.query<SubscriptionPlan>(
    `SELECT * FROM "SubscriptionPlan" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
    [planId, trainerProfileId]
  )
  return (res.rows[0] as SubscriptionPlan) ?? null
}

export async function getTrainerSubscriptionPlans(trainerProfileId: string) {
  const res = await pool.query<SubscriptionPlan>(
    `SELECT * FROM "SubscriptionPlan" WHERE "trainerId" = $1 ORDER BY "createdAt" DESC`,
    [trainerProfileId]
  )
  return res.rows as SubscriptionPlan[]
}

export async function getSubscriptionPlanForEdit(
  planId: string,
  trainerProfileId: string
) {
  return getOwnedPlan(planId, trainerProfileId)
}

export async function createSubscriptionPlan(
  trainerProfileId: string,
  data: SubscriptionPlanInput
): Promise<SubscriptionPlan> {
  const isSessions = data.planType === PlanType.SESSIONS
  const id = generateId()
  const res = await pool.query<SubscriptionPlan>(
    `INSERT INTO "SubscriptionPlan" ("id", "trainerId", "name", "planType", "sessionsCount", "durationDays", "notes", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::"PlanType", $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [
      id,
      trainerProfileId,
      data.name.trim(),
      data.planType,
      isSessions && data.sessionsCount !== "" && data.sessionsCount !== undefined
        ? data.sessionsCount
        : null,
      !isSessions && data.durationDays !== "" && data.durationDays !== undefined
        ? data.durationDays
        : null,
      data.notes?.trim() || null,
    ]
  )
  return res.rows[0] as SubscriptionPlan
}

export async function updateSubscriptionPlan(
  planId: string,
  trainerProfileId: string,
  data: SubscriptionPlanInput
): Promise<SubscriptionPlan | null> {
  const plan = await getOwnedPlan(planId, trainerProfileId)
  if (!plan) return null

  const isSessions = data.planType === PlanType.SESSIONS

  const res = await pool.query<SubscriptionPlan>(
    `UPDATE "SubscriptionPlan" SET "name" = $1, "planType" = $2::"PlanType", "sessionsCount" = $3, "durationDays" = $4, "notes" = $5, "updatedAt" = NOW() WHERE "id" = $6 RETURNING *`,
    [
      data.name.trim(),
      data.planType,
      isSessions && data.sessionsCount !== "" && data.sessionsCount !== undefined
        ? data.sessionsCount
        : null,
      !isSessions && data.durationDays !== "" && data.durationDays !== undefined
        ? data.durationDays
        : null,
      data.notes?.trim() || null,
      plan.id,
    ]
  )
  return (res.rows[0] as SubscriptionPlan) ?? null
}

export async function duplicateSubscriptionPlan(
  planId: string,
  trainerProfileId: string
): Promise<SubscriptionPlan | null> {
  const plan = await getOwnedPlan(planId, trainerProfileId)
  if (!plan) return null

  const id = generateId()
  const res = await pool.query<SubscriptionPlan>(
    `INSERT INTO "SubscriptionPlan" ("id", "trainerId", "name", "planType", "sessionsCount", "durationDays", "notes", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::"PlanType", $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [
      id,
      trainerProfileId,
      `${plan.name} (Copy)`,
      plan.planType,
      plan.sessionsCount,
      plan.durationDays,
      plan.notes,
    ]
  )
  return res.rows[0] as SubscriptionPlan
}

export async function deleteSubscriptionPlan(
  planId: string,
  trainerProfileId: string
): Promise<boolean> {
  const plan = await getOwnedPlan(planId, trainerProfileId)
  if (!plan) return false

  await pool.query(`DELETE FROM "SubscriptionPlan" WHERE "id" = $1`, [plan.id])
  return true
}

/**
 * Assign a plan to a client as their current active subscription.
 * The plan snapshot (name, type, sessions/duration) is copied onto the
 * subscription so later edits to the plan do not alter active ones.
 */
export async function assignSubscriptionPlanToClient(
  clientId: string,
  trainerProfileId: string,
  planId: string
) {
  const clientRes = await pool.query(
    `SELECT "id" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
    [clientId, trainerProfileId]
  )
  const client = clientRes.rows[0] as { id: string } | undefined
  if (!client) return null

  const plan = await getOwnedPlan(planId, trainerProfileId)
  if (!plan) return null

  const startDate = todayUtc()
  const isPeriod = plan.planType === PlanType.PERIOD

  const subscription = await withTransaction(async (tx) => {
    await tx.query(
      `UPDATE "Subscription" SET "status" = 'EXPIRED'::"SubscriptionStatus", "updatedAt" = NOW() WHERE "clientId" = $1 AND "status" IN ('ACTIVE'::"SubscriptionStatus", 'TRIAL'::"SubscriptionStatus")`,
      [client.id]
    )

    const id = generateId()
    const res = await tx.query(
      `INSERT INTO "Subscription" ("id", "clientId", "planId", "planName", "planType", "status", "startDate", "endDate", "durationDays", "sessionsCount", "remainingSessions", "paymentStatus", "autoRenew", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5::"PlanType", $6::"SubscriptionStatus", $7, $8, $9, $10, $11, $12::"PaymentStatus", $13, NOW(), NOW())
       RETURNING *`,
      [
        id,
        client.id,
        plan.id,
        plan.name,
        plan.planType,
        SubscriptionStatus.ACTIVE,
        startDate,
        isPeriod && plan.durationDays ? addDays(startDate, plan.durationDays) : null,
        isPeriod ? plan.durationDays : null,
        isPeriod ? null : plan.sessionsCount,
        isPeriod ? null : plan.sessionsCount,
        PaymentStatus.NOT_REQUIRED,
        false,
      ]
    )
    return res.rows[0]
  })

  invalidate([
    `client:${client.id}:profile`,
    `trainer:${trainerProfileId}:clients`,
    `trainer:${trainerProfileId}:dashboard`,
    "admin:stats",
  ])

  return subscription
}
