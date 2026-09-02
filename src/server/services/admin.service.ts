import { hashPassword } from "@/lib/auth"
import { pool, generateId, withTransaction } from "@/lib/db"
import {
  ClientStatus,
  Goal,
  PaymentStatus,
  PlanType,
  SubscriptionStatus,
} from "@/lib/db/enums"
import {
  createTrainerSchema,
  type AdminClientsQuery,
  type AdminSubscriptionsQuery,
  type AdminTrainersQuery,
} from "@/lib/validations/admin"
import { pickCurrentSubscription } from "@/server/services/subscription.service"
import { withCache, toIso } from "@/lib/cache"

export async function getAdminDashboardStats() {
  return withCache(
    async () => {
      const [
        totalTrainersRes,
        activeTrainersRes,
        suspendedTrainersRes,
        totalClientsRes,
        activeSubscriptionsRes,
        pendingAssessmentsRes,
        activeCoachSubsRes,
        expiredCoachSubsRes,
        expiringSoonRes,
        recentTrainersRes,
        recentClientsRes,
      ] = await Promise.all([
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "TrainerProfile"`
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "TrainerProfile" WHERE "accountStatus" = 'ACTIVE'`
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "TrainerProfile" WHERE "accountStatus" = 'SUSPENDED'`
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "Client"`
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "Subscription" WHERE "status" IN ($1::"SubscriptionStatus", $2::"SubscriptionStatus")`,
          [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "Client" WHERE "status" = $1::"ClientStatus"`,
          [ClientStatus.PENDING_ASSESSMENT]
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "CoachSubscription" WHERE "status" = 'ACTIVE'::"CoachSubscriptionStatus"`
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "CoachSubscription" WHERE "status" = 'EXPIRED'::"CoachSubscriptionStatus"`
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "CoachSubscription" WHERE "status" = 'ACTIVE'::"CoachSubscriptionStatus" AND "endDate" BETWEEN NOW() AND NOW() + INTERVAL '7 days'`
        ),
        pool.query<{
          id: string
          fullName: string
          phone: string
          createdAt: Date
          accountStatus: string
        }>(
          `SELECT "id", "fullName", "phone", "createdAt", "accountStatus" FROM "TrainerProfile" ORDER BY "createdAt" DESC LIMIT 5`
        ),
        pool.query<{
          id: string
          fullName: string | null
          status: ClientStatus
          createdAt: Date
          trainerFullName: string | null
        }>(
          `SELECT c."id", c."fullName", c."status", c."createdAt", tp."fullName" AS "trainerFullName"
           FROM "Client" c
           LEFT JOIN "TrainerProfile" tp ON tp."id" = c."trainerId"
           ORDER BY c."createdAt" DESC
           LIMIT 5`
        ),
      ])

      const totalTrainers = (totalTrainersRes.rows[0] as { count: number }).count
      const activeTrainers = (activeTrainersRes.rows[0] as { count: number }).count
      const suspendedTrainers = (suspendedTrainersRes.rows[0] as { count: number }).count
      const totalClients = (totalClientsRes.rows[0] as { count: number }).count
      const activeSubscriptions = (activeSubscriptionsRes.rows[0] as { count: number }).count
      const pendingAssessments = (pendingAssessmentsRes.rows[0] as { count: number }).count
      const activeCoachSubscriptions = (activeCoachSubsRes.rows[0] as { count: number }).count
      const expiredCoachSubscriptions = (expiredCoachSubsRes.rows[0] as { count: number }).count
      const expiringSoon = (expiringSoonRes.rows[0] as { count: number }).count

      const recentTrainers = recentTrainersRes.rows as {
        id: string
        fullName: string
        phone: string
        createdAt: Date
        accountStatus: string
      }[]

      const recentClientsRaw = recentClientsRes.rows as {
        id: string
        fullName: string | null
        status: ClientStatus
        createdAt: Date
        trainerFullName: string | null
      }[]

      const recentClients = recentClientsRaw.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        status: c.status,
        createdAt: c.createdAt,
        trainer: c.trainerFullName ? { fullName: c.trainerFullName } : { fullName: "" },
      }))

      return {
        totalTrainers,
        activeTrainers,
        suspendedTrainers,
        totalClients,
        activeSubscriptions,
        pendingAssessments,
        activeCoachSubscriptions,
        expiredCoachSubscriptions,
        expiringSoon,
        recentTrainers: recentTrainers.map((trainer) => ({
          ...trainer,
          createdAt: toIso(trainer.createdAt)!,
        })),
        recentClients: recentClients.map((client) => ({
          ...client,
          createdAt: toIso(client.createdAt)!,
        })),
      }
    },
    ["admin-dashboard-stats"],
    ["admin:stats"],
    300
  )()
}

export async function getAdminTrainers(params: AdminTrainersQuery & { status?: string; filter?: string }) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10
  const offset = (page - 1) * perPage

  const whereParts: string[] = []
  const whereParams: unknown[] = []
  let idx = 1

  if (params.q) {
    whereParts.push(`(tp."fullName" ILIKE $${idx} OR tp."phone" ILIKE $${idx})`)
    whereParams.push(`%${params.q}%`)
    idx++
  }
  if ((params as { status?: string }).status) {
    whereParts.push(`cs."status" = $${idx}::"CoachSubscriptionStatus"`)
    whereParams.push((params as { status: string }).status)
    idx++
  }
  if ((params as { filter?: string }).filter === "expiring_soon") {
    whereParts.push(`cs."status" = 'ACTIVE'::"CoachSubscriptionStatus" AND cs."endDate" BETWEEN NOW() AND NOW() + INTERVAL '7 days'`)
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : ""
  const joinSql = `LEFT JOIN "CoachSubscription" cs ON cs."coachId" = tp."id" LEFT JOIN "CoachBranding" cb ON cb."coachId" = tp."id"`

  const [totalRes, trainersRes] = await Promise.all([
    pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "TrainerProfile" tp ${joinSql} ${whereSql}`,
      whereParams
    ),
    pool.query<{
      id: string
      fullName: string
      phone: string
      createdAt: Date
      username: string | null
      clientsCount: number
      accountStatus: string
      subscriptionStatus: string | null
      subscriptionEndDate: Date | null
      amountPaid: string | null
      brandName: string | null
      logoUrl: string | null
      primaryColor: string | null
    }>(
      `SELECT tp."id", tp."fullName", tp."phone", tp."createdAt", tp."accountStatus", u."username",
              (SELECT COUNT(*)::int FROM "Client" c WHERE c."trainerId" = tp."id") AS "clientsCount",
              cs."status" AS "subscriptionStatus", cs."endDate" AS "subscriptionEndDate", cs."amountPaid",
              cb."brandName", cb."logoUrl", cb."primaryColor"
       FROM "TrainerProfile" tp
       LEFT JOIN "User" u ON u."id" = tp."userId"
       ${joinSql}
       ${whereSql}
       ORDER BY tp."createdAt" DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...whereParams, perPage, offset]
    ),
  ])

  const total = (totalRes.rows[0] as { count: number }).count
  const trainers = trainersRes.rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    phone: r.phone,
    createdAt: r.createdAt,
    accountStatus: r.accountStatus,
    subscriptionStatus: r.subscriptionStatus,
    subscriptionEndDate: r.subscriptionEndDate,
    amountPaid: r.amountPaid ? String(r.amountPaid) : null,
    brandName: r.brandName,
    logoUrl: r.logoUrl,
    primaryColor: r.primaryColor,
    hasCustomBranding: !!(r.brandName || r.logoUrl || r.primaryColor),
    user: r.username !== null ? { username: r.username } : null,
    _count: { clients: Number(r.clientsCount) },
  }))

  return {
    trainers,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function getAdminTrainerOptions() {
  const res = await pool.query<{ id: string; fullName: string }>(
    `SELECT "id", "fullName" FROM "TrainerProfile" ORDER BY "fullName" ASC`
  )
  return res.rows as { id: string; fullName: string }[]
}

export async function getAdminClients(params: AdminClientsQuery) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10
  const offset = (page - 1) * perPage

  const whereParts: string[] = []
  const whereParams: unknown[] = []
  let idx = 1

  if (params.trainerId) {
    whereParts.push(`c."trainerId" = $${idx}`)
    whereParams.push(params.trainerId)
    idx++
  }
  if (params.goal) {
    whereParts.push(`c."goal" = $${idx}::"Goal"`)
    whereParams.push(params.goal)
    idx++
  }
  if (params.status) {
    whereParts.push(`c."status" = $${idx}::"ClientStatus"`)
    whereParams.push(params.status)
    idx++
  }
  if (params.q) {
    whereParts.push(`(c."fullName" ILIKE $${idx} OR c."phone" ILIKE $${idx})`)
    whereParams.push(`%${params.q}%`)
    idx++
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : ""

  const [totalRes, clientsRes] = await Promise.all([
    pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "Client" c ${whereSql}`,
      whereParams
    ),
    pool.query<{
      id: string
      fullName: string | null
      phone: string | null
      goal: Goal | null
      status: ClientStatus
      birthDate: Date | null
      basicInfoCompletedAt: Date | null
      createdAt: Date
      trainerId: string | null
      trainerFullName: string | null
    }>(
      `SELECT c."id", c."fullName", c."phone", c."goal", c."status", c."birthDate", c."basicInfoCompletedAt", c."createdAt",
              tp."id" AS "trainerId", tp."fullName" AS "trainerFullName"
       FROM "Client" c
       LEFT JOIN "TrainerProfile" tp ON tp."id" = c."trainerId"
       ${whereSql}
       ORDER BY c."createdAt" DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...whereParams, perPage, offset]
    ),
  ])

  const total = (totalRes.rows[0] as { count: number }).count
  const clients = clientsRes.rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    phone: r.phone,
    goal: r.goal,
    status: r.status,
    birthDate: r.birthDate,
    basicInfoCompletedAt: r.basicInfoCompletedAt,
    createdAt: r.createdAt,
    trainer: r.trainerId ? { id: r.trainerId, fullName: r.trainerFullName! } : null,
  }))

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
       WHERE "clientId" IN (${placeholders})
       ORDER BY "createdAt" DESC`,
      clientIds
    )
    subscriptions = subRes.rows as typeof subscriptions
  }

  const subscriptionsByClient = new Map<string, typeof subscriptions>()
  for (const subscription of subscriptions) {
    const list = subscriptionsByClient.get(subscription.clientId) ?? []
    list.push(subscription)
    subscriptionsByClient.set(subscription.clientId, list)
  }

  const rows = clients.map((client) => {
    const subs = subscriptionsByClient.get(client.id) ?? []
    return { ...client, subscription: pickCurrentSubscription(subs) ?? null }
  })

  return {
    clients: rows,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function getAdminSubscriptions(params: AdminSubscriptionsQuery) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10
  const offset = (page - 1) * perPage

  const whereParts: string[] = []
  const whereParams: unknown[] = []
  let idx = 1

  if (params.status) {
    whereParts.push(`s."status" = $${idx}::"SubscriptionStatus"`)
    whereParams.push(params.status)
    idx++
  }
  if (params.paymentStatus) {
    whereParts.push(`s."paymentStatus" = $${idx}::"PaymentStatus"`)
    whereParams.push(params.paymentStatus)
    idx++
  }
  if (params.q) {
    whereParts.push(`(s."planName" ILIKE $${idx} OR c."fullName" ILIKE $${idx})`)
    whereParams.push(`%${params.q}%`)
    idx++
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : ""

  const [totalRes, subscriptionsRes] = await Promise.all([
    pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM "Subscription" s
       LEFT JOIN "Client" c ON c."id" = s."clientId"
       ${whereSql}`,
      whereParams
    ),
    pool.query<{
      id: string
      planName: string
      planType: PlanType
      status: SubscriptionStatus
      paymentStatus: PaymentStatus
      startDate: Date | null
      endDate: Date | null
      durationDays: number | null
      sessionsCount: number | null
      remainingSessions: number | null
      createdAt: Date
      clientId: string | null
      clientFullName: string | null
      trainerFullName: string | null
    }>(
      `SELECT s."id", s."planName", s."planType", s."status", s."paymentStatus", s."startDate", s."endDate", s."durationDays", s."sessionsCount", s."remainingSessions", s."createdAt",
              c."id" AS "clientId", c."fullName" AS "clientFullName", tp."fullName" AS "trainerFullName"
       FROM "Subscription" s
       LEFT JOIN "Client" c ON c."id" = s."clientId"
       LEFT JOIN "TrainerProfile" tp ON tp."id" = c."trainerId"
       ${whereSql}
       ORDER BY s."createdAt" DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...whereParams, perPage, offset]
    ),
  ])

  const total = (totalRes.rows[0] as { count: number }).count

  const subscriptions = subscriptionsRes.rows.map((r) => ({
    id: r.id,
    planName: r.planName,
    planType: r.planType,
    status: r.status,
    paymentStatus: r.paymentStatus,
    startDate: r.startDate,
    endDate: r.endDate,
    durationDays: r.durationDays,
    sessionsCount: r.sessionsCount,
    remainingSessions: r.remainingSessions,
    createdAt: r.createdAt,
    client: {
      id: r.clientId!,
      fullName: r.clientFullName ?? "",
      trainer: r.trainerFullName ? { fullName: r.trainerFullName } : null,
    },
  }))

  return {
    subscriptions,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function createTrainer(data: unknown) {
  const parsed = createTrainerSchema.safeParse(data)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { fullName, phone, password } = parsed.data

  const existing = await pool.query(
    `SELECT "id" FROM "User" WHERE "phone" = $1 OR "username" = $1 LIMIT 1`,
    [phone]
  )
  if ((existing.rowCount ?? 0) > 0) {
    return { ok: false as const, code: "PHONE_EXISTS" as const }
  }

  const passwordHash = await hashPassword(password)

  const userId = await withTransaction(async (client) => {
    const id = generateId()
    const trainerId = generateId()
    const now = new Date()

    await client.query(
      `INSERT INTO "User" ("id", "username", "phone", "passwordHash", "role", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5::"Role", $6, $6)`,
      [id, phone, phone, passwordHash, "COACH", now]
    )

    await client.query(
      `INSERT INTO "TrainerProfile" ("id", "userId", "fullName", "phone", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [trainerId, id, fullName, phone, now]
    )

    return id
  })

  return { ok: true as const, userId }
}

export async function getAdminCoachDetails(coachId: string) {
  const res = await pool.query(
    `SELECT tp."id", tp."fullName", tp."phone", tp."createdAt", tp."accountStatus",
            u."id" AS "userId", u."username", u."email", u."mustChangePassword",
            (SELECT COUNT(*)::int FROM "Client" c WHERE c."trainerId" = tp."id") AS "clientsCount"
     FROM "TrainerProfile" tp
     LEFT JOIN "User" u ON u."id" = tp."userId"
     WHERE tp."id" = $1 LIMIT 1`,
    [coachId]
  )
  if (res.rowCount === 0) return null
  const row = res.rows[0] as {
    id: string
    fullName: string
    phone: string
    createdAt: Date
    accountStatus: string
    userId: string
    username: string | null
    email: string | null
    mustChangePassword: boolean
    clientsCount: number
  }
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    createdAt: toIso(row.createdAt)!,
    accountStatus: row.accountStatus,
    userId: row.userId,
    username: row.username,
    email: row.email,
    mustChangePassword: row.mustChangePassword,
    clientsCount: row.clientsCount,
  }
}

export async function suspendCoach(coachId: string): Promise<boolean> {
  const res = await pool.query(
    `UPDATE "TrainerProfile" SET "accountStatus" = 'SUSPENDED', "updatedAt" = NOW() WHERE "id" = $1 RETURNING "id"`,
    [coachId]
  )
  return (res.rowCount ?? 0) > 0
}

export async function activateCoach(coachId: string): Promise<boolean> {
  const res = await pool.query(
    `UPDATE "TrainerProfile" SET "accountStatus" = 'ACTIVE', "updatedAt" = NOW() WHERE "id" = $1 RETURNING "id"`,
    [coachId]
  )
  return (res.rowCount ?? 0) > 0
}
