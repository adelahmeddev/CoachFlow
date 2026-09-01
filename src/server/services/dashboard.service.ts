import { pool } from "@/lib/db"
import { ClientStatus } from "@/lib/db/enums"
import { withCache, toIso } from "@/lib/cache"

export async function getDashboardData(trainerProfileId: string) {
  return withCache(
    async () => {
      const now = Date.now()
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000)

      // Reduced from 8 parallel queries to 2 to avoid pool exhaustion / Neon "Connection terminated"
      // Single aggregated stats query + recent clients
      const statsQuery = `
        SELECT
          COUNT(*)::int AS "totalClients",
          COUNT(*) FILTER (WHERE "status" = $4::"ClientStatus")::int AS "pendingAssessment",
          COUNT(*) FILTER (WHERE "status" = $5::"ClientStatus")::int AS "activeClients",
          COUNT(*) FILTER (WHERE "createdAt" >= $2::timestamptz)::int AS "recentlyAdded",
          COUNT(*) FILTER (WHERE "createdAt" >= $3::timestamptz AND "createdAt" < $2::timestamptz)::int AS "prevPeriodAdded",
          COUNT(*) FILTER (WHERE "status" = $4::"ClientStatus" AND "createdAt" < $2::timestamptz)::int AS "prevPendingAssessment",
          COUNT(*) FILTER (WHERE "status" = $5::"ClientStatus" AND "createdAt" < $2::timestamptz)::int AS "prevActiveClients"
        FROM "Client"
        WHERE "trainerId" = $1
      `
      const recentQuery = `
        SELECT "id", "fullName", "phone", "goal", "status", "createdAt"
        FROM "Client"
        WHERE "trainerId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 5
      `

      let statsRow: {
        totalClients: number
        pendingAssessment: number
        activeClients: number
        recentlyAdded: number
        prevPeriodAdded: number
        prevPendingAssessment: number
        prevActiveClients: number
      } | null = null
      let recentClientsRes: { rows: unknown[] } | null = null

      try {
        const [statsRes, recentRes] = await Promise.all([
          pool.query(statsQuery, [
            trainerProfileId,
            thirtyDaysAgo,
            sixtyDaysAgo,
            ClientStatus.PENDING_ASSESSMENT,
            ClientStatus.ACTIVE,
          ]),
          pool.query(recentQuery, [trainerProfileId]),
        ])
        statsRow = statsRes.rows[0] as typeof statsRow
        recentClientsRes = recentRes
      } catch (err) {
        // Fallback: log and return degraded data instead of crashing DashboardPage
        console.error("[dashboard] query failed, returning fallback", err)
        // Try single recent query at least, if stats fails
        try {
          if (!recentClientsRes) {
            const fallbackRecent = await pool.query(recentQuery, [trainerProfileId])
            recentClientsRes = fallbackRecent
          }
        } catch {}
        statsRow = statsRow ?? {
          totalClients: 0,
          pendingAssessment: 0,
          activeClients: 0,
          recentlyAdded: 0,
          prevPeriodAdded: 0,
          prevPendingAssessment: 0,
          prevActiveClients: 0,
        }
        recentClientsRes = recentClientsRes ?? { rows: [] as unknown[] }
      }

      const totalClients = statsRow!.totalClients
      const pendingAssessment = statsRow!.pendingAssessment
      const activeClients = statsRow!.activeClients
      const recentlyAdded = statsRow!.recentlyAdded
      const prevPeriodAdded = statsRow!.prevPeriodAdded
      const prevPendingAssessment = statsRow!.prevPendingAssessment
      const prevActiveClients = statsRow!.prevActiveClients
      const recentClients = (recentClientsRes!.rows as unknown) as {
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
