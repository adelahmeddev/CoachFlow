"use server"

import { hashPassword } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import { pool, generateId } from "@/lib/db"
import { createClientManuallySchema, type CreateClientManuallyInput } from "@/lib/validations/client"

export async function resetClientPasswordAction(
  clientId: string,
  newPassword: string,
  forceChange: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "COACH")
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const clientRes = await pool.query(
    `SELECT "id", "userId", "trainerId" FROM "Client" WHERE "id"=$1 LIMIT 1`,
    [clientId]
  )
  const client = clientRes.rows[0] as
    | { id: string; userId: string | null; trainerId: string }
    | undefined

  if (!client) {
    return { ok: false, error: "CLIENT_NOT_FOUND" }
  }

  if (
    session.user.role === "COACH" &&
    client.trainerId !== session.user.trainerProfileId
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  if (!client.userId) {
    return { ok: false, error: "CLIENT_NO_ACCOUNT" }
  }

  const passwordHash = await hashPassword(newPassword)
  await pool.query(`UPDATE "User" SET "passwordHash"=$1, "mustChangePassword"=$2, "updatedAt"=NOW() WHERE "id"=$3`, [
    passwordHash,
    forceChange,
    client.userId,
  ])

  revalidatePath(`/clients/${clientId}`)
  invalidate([`client:${clientId}:profile`])
  return { ok: true }
}

export async function createClientManuallyAction(data: CreateClientManuallyInput) {
  const session = await getCurrentSession()
  if (!session?.user?.trainerProfileId) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const trainerId = session.user.trainerProfileId

  const parsed = createClientManuallySchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" }
  }

  const input = parsed.data

  // Check if phone exists
  const existingRes = await pool.query(`SELECT "id" FROM "User" WHERE "phone" = $1 LIMIT 1`, [input.phone])
  if (existingRes.rows.length > 0) {
    return { ok: false, error: "PHONE_EXISTS" }
  }

  const passwordHash = await hashPassword(input.password)

  // Start transaction
  const clientDb = await pool.connect()
  try {
    await clientDb.query("BEGIN")

    const userId = generateId()
    // Create User
    await clientDb.query(
      `INSERT INTO "User" ("id", "username", "phone", "passwordHash", "role", "mustChangePassword", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, 'CLIENT', false, NOW(), NOW())`,
      [userId, input.phone, input.phone, passwordHash]
    )

    const clientId = generateId()
    const birthDate = input.birthDate ? new Date(`${input.birthDate}T00:00:00Z`) : null

    // Create Client
    await clientDb.query(
      `INSERT INTO "Client" (
        "id", "trainerId", "userId", "fullName", "phone", "birthDate", "status", 
        "injuries", "healthConditions", "medications", 
        "neckPain", "shoulderPain", "backPain", "kneePain",
        "goals", "coachingMode",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'ACTIVE',
        $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15,
        NOW(), NOW()
      )`,
      [
        clientId, trainerId, userId, input.fullName, input.phone, birthDate,
        input.injuries || null, input.healthConditions || null, input.medications || null,
        input.neckPain || false, input.shoulderPain || false, input.backPain || false, input.kneePain || false,
        input.goals || [], input.coachingMode || "ONLINE",
      ]
    )

    // Assign Subscription if requested
    if (input.subscriptionPlanId || input.subscriptionDurationDays || input.subscriptionSessionsCount) {
      const subId = generateId()
      const startDate = input.subscriptionStartDate 
        ? new Date(`${input.subscriptionStartDate}T00:00:00Z`) 
        : new Date(`${new Date().toISOString().split("T")[0]}T00:00:00Z`)

      if (input.subscriptionPlanId) {
        // Coach chose an existing plan
        const planRes = await clientDb.query(
          `SELECT * FROM "SubscriptionPlan" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
          [input.subscriptionPlanId, trainerId]
        )
        const plan = planRes.rows[0]
        if (plan) {
          const isPeriod = plan.planType === "PERIOD"
          const endDate = isPeriod && plan.durationDays 
            ? new Date(startDate.getTime() + Number(plan.durationDays) * 24 * 60 * 60 * 1000)
            : null

          await clientDb.query(
            `INSERT INTO "Subscription" (
              "id", "clientId", "planId", "planName", "planType", "status",
              "startDate", "endDate", "durationDays", "sessionsCount", "remainingSessions",
              "paymentStatus", "autoRenew", "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5::"PlanType", 'ACTIVE'::"SubscriptionStatus",
              $6, $7, $8, $9, $10,
              'NOT_REQUIRED'::"PaymentStatus", false, NOW(), NOW()
            )`,
            [
              subId,
              clientId,
              plan.id,
              plan.name,
              plan.planType,
              startDate,
              endDate,
              isPeriod ? plan.durationDays : null,
              isPeriod ? null : plan.sessionsCount,
              isPeriod ? null : plan.sessionsCount,
            ]
          )
        }
      } else if (input.subscriptionDurationDays) {
        // Duration in days
        const days = Number(input.subscriptionDurationDays)
        const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)
        const planName = days === 30 ? "اشتراك شهر" : days === 90 ? "اشتراك 3 أشهر" : days === 180 ? "اشتراك 6 أشهر" : days === 365 ? "اشتراك سنة" : `اشتراك ${days} يوم`

        await clientDb.query(
          `INSERT INTO "Subscription" (
            "id", "clientId", "planName", "planType", "status",
            "startDate", "endDate", "durationDays", "sessionsCount", "remainingSessions",
            "paymentStatus", "autoRenew", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, 'PERIOD'::"PlanType", 'ACTIVE'::"SubscriptionStatus",
            $4, $5, $6, null, null,
            'NOT_REQUIRED'::"PaymentStatus", false, NOW(), NOW()
          )`,
          [
            subId,
            clientId,
            planName,
            startDate,
            endDate,
            days,
          ]
        )
      } else if (input.subscriptionSessionsCount) {
        // Sessions count
        const sessions = Number(input.subscriptionSessionsCount)
        const planName = `${sessions} جلسات`

        await clientDb.query(
          `INSERT INTO "Subscription" (
            "id", "clientId", "planName", "planType", "status",
            "startDate", "endDate", "durationDays", "sessionsCount", "remainingSessions",
            "paymentStatus", "autoRenew", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, 'SESSIONS'::"PlanType", 'ACTIVE'::"SubscriptionStatus",
            $4, null, null, $5, $5,
            'NOT_REQUIRED'::"PaymentStatus", false, NOW(), NOW()
          )`,
          [
            subId,
            clientId,
            planName,
            startDate,
            sessions,
          ]
        )
      }
    }

    // Create BodyComposition if any measurements provided
    const hasInBody = input.weightKg || input.heightCm || input.bodyFatKg || input.muscleMassKg || input.bodyWaterPct || input.fatControlKg || input.bmrKcal || input.fitnessScore || input.waistHipRatio || input.visceralFatLevel
    if (hasInBody) {
      await clientDb.query(
        `INSERT INTO "BodyComposition" (
          "id", "clientId", "date", "source", 
          "weightKg", "heightCm", "bodyFatKg", "muscleMassKg",
          "bodyWaterPct", "fatControlKg", "bmrKcal", "fitnessScore",
          "waistHipRatio", "visceralFatLevel",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, NOW(), 'COACH',
          $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          NOW(), NOW()
        )`,
        [
          generateId(), clientId, 
          input.weightKg || null, 
          input.heightCm || null, 
          input.bodyFatKg || null, 
          input.muscleMassKg || null,
          input.bodyWaterPct || null,
          input.fatControlKg || null,
          input.bmrKcal || null,
          input.fitnessScore || null,
          input.waistHipRatio || null,
          input.visceralFatLevel || null,
        ]
      )
    }

    await clientDb.query("COMMIT")
    revalidatePath("/clients")
    invalidate([`trainer:${trainerId}:clients`, `trainer:${trainerId}:dashboard`, `client:${clientId}:profile`])
    return { ok: true, clientId }
  } catch (err) {
    await clientDb.query("ROLLBACK")
    console.error(err)
    return { ok: false, error: "INTERNAL_ERROR" }
  } finally {
    clientDb.release()
  }
}
