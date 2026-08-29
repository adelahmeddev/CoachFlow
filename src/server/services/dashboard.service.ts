import { pool } from "@/lib/db"
import { ClientStatus } from "@/lib/db/enums"
import { withCache, toIso } from "@/lib/cache"

export async function getDashboardData(trainerProfileId: string) {
  return withCache(
    async () => {
      const now = Date.now()
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000)

      const [
        totalClientsRes,
        pendingAssessmentRes,
        activeClientsRes,
        recentlyAddedRes,
        prevPeriodAddedRes,
        prevPendingAssessmentRes,
        prevActiveClientsRes,
        recentClientsRes,
      ] = await Promise.all([
        pool.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "Client" WHERE "trainerId" = $1`, [
          trainerProfileId,
        ]),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "Client" WHERE "trainerId" = $1 AND "status" = $2::"ClientStatus"`,
          [trainerProfileId, ClientStatus.PENDING_ASSESSMENT]
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "Client" WHERE "trainerId" = $1 AND "status" = $2::"ClientStatus"`,
          [trainerProfileId, ClientStatus.ACTIVE]
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "Client" WHERE "trainerId" = $1 AND "createdAt" >= $2::timestamptz`,
          [trainerProfileId, thirtyDaysAgo]
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "Client" WHERE "trainerId" = $1 AND "createdAt" >= $2::timestamptz AND "createdAt" < $3::timestamptz`,
          [trainerProfileId, sixtyDaysAgo, thirtyDaysAgo]
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "Client" WHERE "trainerId" = $1 AND "status" = $2::"ClientStatus" AND "createdAt" < $3::timestamptz`,
          [trainerProfileId, ClientStatus.PENDING_ASSESSMENT, thirtyDaysAgo]
        ),
        pool.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM "Client" WHERE "trainerId" = $1 AND "status" = $2::"ClientStatus" AND "createdAt" < $3::timestamptz`,
          [trainerProfileId, ClientStatus.ACTIVE, thirtyDaysAgo]
        ),
        pool.query(
          `SELECT "id", "fullName", "phone", "goal", "status", "createdAt"
           FROM "Client"
           WHERE "trainerId" = $1
           ORDER BY "createdAt" DESC
           LIMIT 5`,
          [trainerProfileId]
        ),
      ])

      const totalClients = (totalClientsRes.rows[0] as { count: number }).count
      const pendingAssessment = (pendingAssessmentRes.rows[0] as { count: number }).count
      const activeClients = (activeClientsRes.rows[0] as { count: number }).count
      const recentlyAdded = (recentlyAddedRes.rows[0] as { count: number }).count
      const prevPeriodAdded = (prevPeriodAddedRes.rows[0] as { count: number }).count
      const prevPendingAssessment = (prevPendingAssessmentRes.rows[0] as { count: number }).count
      const prevActiveClients = (prevActiveClientsRes.rows[0] as { count: number }).count
      const recentClients = recentClientsRes.rows as {
        id: string
        fullName: string | null
        phone: string | null
        goal: string | null
        status: ClientStatus
        createdAt: Date
      }[]

      return {
        stats: {
          totalClients,
          pendingAssessment,
          activeClients,
          recentlyAdded,
          // Deltas: positive = up, negative = down, null = no previous data
          deltas: {
            // Total clients: new this period vs new last period
            totalClients: recentlyAdded - prevPeriodAdded,
            // Pending assessment: current vs pre-window baseline (rough trend)
            pendingAssessment: pendingAssessment - prevPendingAssessment,
            // Active clients: current vs pre-window baseline
            activeClients: activeClients - prevActiveClients,
            // Recently added: current period vs previous period
            recentlyAdded: recentlyAdded - prevPeriodAdded,
          },
        },
        recentClients: recentClients.map((client) => ({
          ...client,
          createdAt: toIso(client.createdAt)!,
        })),
      }
    },
    ["trainer-dashboard", trainerProfileId],
    [`trainer:${trainerProfileId}:dashboard`],
    300
  )()
}
