import { pool, generateId } from "@/lib/db"
import { ClientStatus, Goal, SubscriptionStatus } from "@/lib/db/enums"
import {
  clientCreateSchema,
  type ClientCreateInput,
} from "@/lib/validations/client"
import { invalidateDashboard } from "@/lib/cache"

export async function createClientManually(
  trainerProfileId: string,
  input: unknown
) {
  const parsed = clientCreateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data as ClientCreateInput

  const trainerProfile = await pool.query(
    `SELECT "id" FROM "TrainerProfile" WHERE "id" = $1`,
    [trainerProfileId]
  )
  if (trainerProfile.rowCount === 0) {
    return {
      ok: false as const,
      error: "Trainer profile not found. Please log out and log in again.",
    } as const
  }

  try {
    const id = generateId()
    const now = new Date()
    const res = await pool.query(
      `INSERT INTO "Client" ("id", "trainerId", "fullName", "phone", "birthDate", "goal", "status", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING "id"`,
      [
        id,
        trainerProfileId,
        data.fullName,
        data.phone ?? null,
        data.birthDate ?? null,
        data.goal ?? null,
        data.status,
        now,
      ]
    )
    invalidateDashboard(trainerProfileId)
    return { ok: true as const, clientId: res.rows[0].id as string }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23503"
    ) {
      return {
        ok: false as const,
        error: "Trainer profile no longer exists. Please log out and log in again.",
      } as const
    }
    throw error
  }
}

export async function getTrainerClients(
  trainerProfileId: string,
  params: {
    q?: string
    goal?: Goal
    status?: ClientStatus
    page?: number
    perPage?: number
  }
) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10

  const conditions: string[] = [`"trainerId" = $1`]
  const countParams: unknown[] = [trainerProfileId]
  let paramIdx = 2

  const whereClauses: string[] = [`"trainerId" = $1`]
  const queryParams: unknown[] = [trainerProfileId]

  if (params.q) {
    const qPattern = `%${params.q}%`
    whereClauses.push(`("fullName" ILIKE $${paramIdx} OR "phone" ILIKE $${paramIdx})`)
    conditions.push(`("fullName" ILIKE $${paramIdx} OR "phone" ILIKE $${paramIdx})`)
    queryParams.push(qPattern)
    countParams.push(qPattern)
    paramIdx++
  }
  if (params.status) {
    whereClauses.push(`"status" = $${paramIdx}::"ClientStatus"`)
    conditions.push(`"status" = $${paramIdx}::"ClientStatus"`)
    queryParams.push(params.status)
    countParams.push(params.status)
    paramIdx++
  }
  if (params.goal) {
    whereClauses.push(`"goal" = $${paramIdx}::"Goal"`)
    conditions.push(`"goal" = $${paramIdx}::"Goal"`)
    queryParams.push(params.goal)
    countParams.push(params.goal)
    paramIdx++
  }

  const whereSql = whereClauses.join(" AND ")
  const countWhereSql = conditions.join(" AND ")

  const [totalRes, clientsRes] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM "Client" WHERE ${countWhereSql}`, countParams),
    pool.query(
      `SELECT "id", "fullName", "phone", "birthDate", "goal", "status", "basicInfoCompletedAt", "createdAt"
       FROM "Client" WHERE ${whereSql}
       ORDER BY "createdAt" DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...queryParams, perPage, (page - 1) * perPage]
    ),
  ])

  const total = (totalRes.rows[0] as { count: number }).count
  const clients = clientsRes.rows as {
    id: string
    fullName: string | null
    phone: string | null
    birthDate: Date | null
    goal: Goal | null
    status: ClientStatus
    basicInfoCompletedAt: Date | null
    createdAt: Date
  }[]

  let subscriptions: {
    id: string
    clientId: string
    planName: string
    status: SubscriptionStatus
    createdAt: Date
  }[] = []
  if (clients.length > 0) {
    const clientIds = clients.map((c) => c.id)
    const placeholders = clientIds.map((_, i) => `$${i + 1}`).join(",")
    const subRes = await pool.query(
      `SELECT "id", "clientId", "planName", "status", "createdAt"
       FROM "Subscription"
       WHERE "clientId" IN (${placeholders}) AND "status" IN ('ACTIVE','TRIAL')
       ORDER BY "createdAt" DESC`,
      clientIds
    )
    subscriptions = subRes.rows as typeof subscriptions
  }

  const subscriptionsByClient = new Map<string, typeof subscriptions>()
  for (const sub of subscriptions) {
    if (!subscriptionsByClient.has(sub.clientId)) {
      subscriptionsByClient.set(sub.clientId, [sub])
    }
  }

  const rows = clients.map((client) => {
    const subs = subscriptionsByClient.get(client.id) ?? []
    const preferred = subs[0] ?? null
    return { ...client, subscription: preferred }
  })

  return {
    clients: rows,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function getTrainerClient(
  trainerProfileId: string,
  clientId: string
) {
  const clientRes = await pool.query(
    `SELECT * FROM "Client" WHERE "id" = $1 AND "trainerId" = $2`,
    [clientId, trainerProfileId]
  )
  if (clientRes.rowCount === 0) return null
  const client = clientRes.rows[0] as Record<string, unknown> & { id: string }

  const [trainer, bodyCompositions, subscriptions, trainingSplits, progressReviews, workoutLogs] =
    await Promise.all([
      pool.query(`SELECT "id", "fullName" FROM "TrainerProfile" WHERE "id" = $1`, [
        trainerProfileId,
      ]),
      pool.query(`SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" DESC LIMIT 3`, [
        clientId,
      ]),
      pool.query(`SELECT * FROM "Subscription" WHERE "clientId" = $1 ORDER BY "createdAt" DESC LIMIT 2`, [
        clientId,
      ]),
      pool.query(`SELECT * FROM "TrainingSplit" WHERE "clientId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [
        clientId,
      ]),
      pool.query(
        `SELECT * FROM "ProgressReview" WHERE "clientId" = $1 ORDER BY "reviewDate" DESC LIMIT 1`,
        [clientId]
      ),
      pool.query(`SELECT * FROM "WorkoutLog" WHERE "clientId" = $1 ORDER BY "date" DESC LIMIT 5`, [
        clientId,
      ]),
    ])

  let days: unknown[] = []
  let trainingSplitWithDays: unknown = null
  if (trainingSplits.rows[0]) {
    const split = trainingSplits.rows[0] as { id: string }
    const daysRes = await pool.query(
      `SELECT * FROM "TrainingSplitDay" WHERE "splitId" = $1 ORDER BY "dayNumber" ASC`,
      [split.id]
    )
    days = daysRes.rows
    trainingSplitWithDays = { ...split, days }
  }

  return {
    ...client,
    trainer: trainer.rows[0] ?? null,
    bodyCompositions: bodyCompositions.rows,
    subscriptions: subscriptions.rows,
    trainingSplits: trainingSplitWithDays ? [trainingSplitWithDays] : [],
    progressReviews: progressReviews.rows,
    workoutLogs: workoutLogs.rows,
  }
}

export async function deleteTrainerClient(
  trainerProfileId: string,
  clientId: string
): Promise<boolean> {
  const check = await pool.query(
    `SELECT "id", "userId" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2`,
    [clientId, trainerProfileId]
  )
  if (check.rowCount === 0) return false

  await pool.query(`DELETE FROM "Client" WHERE "id" = $1`, [clientId])
  return true
}
