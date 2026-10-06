import { pool } from "@/lib/db"
import { ClientStatus, Goal } from "@/lib/db/enums"
import { withCache, toIso } from "@/lib/cache"
import { parseGoals } from "@/lib/goals"

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
      const expiringSoonQuery = `
        SELECT COUNT(DISTINCT s."clientId")::int AS "expiringSoon"
        FROM "Subscription" s
        JOIN "Client" c ON c.id = s."clientId"
        WHERE c."trainerId" = $1
          AND s."status" IN ('ACTIVE'::"SubscriptionStatus", 'TRIAL'::"SubscriptionStatus")
          AND s."endDate" IS NOT NULL
          AND s."endDate" >= NOW()
          AND s."endDate" <= NOW() + INTERVAL '7 days'
      `
      const recentQuery = `
        SELECT "id", "fullName", "phone", "goals", "status", "createdAt"
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
      let expiringSoonCount = 0
      let recentClientsRes: { rows: unknown[] } | null = null

      try {
        const [statsRes, expiringSoonRes, recentRes] = await Promise.all([
          pool.query(statsQuery, [
            trainerProfileId,
            thirtyDaysAgo,
            sixtyDaysAgo,
            ClientStatus.PENDING_ASSESSMENT,
            ClientStatus.ACTIVE,
          ]),
          pool.query(expiringSoonQuery, [trainerProfileId]),
          pool.query(recentQuery, [trainerProfileId]),
        ])
        statsRow = statsRes.rows[0] as typeof statsRow
        expiringSoonCount = (expiringSoonRes.rows[0] as { expiringSoon: number })?.expiringSoon ?? 0
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

      const totalClients = Number(statsRow?.totalClients) || 0
      const pendingAssessment = Number(statsRow?.pendingAssessment) || 0
      const activeClients = Number(statsRow?.activeClients) || 0
      const recentlyAdded = Number(statsRow?.recentlyAdded) || 0
      const prevPeriodAdded = Number(statsRow?.prevPeriodAdded) || 0
      const prevPendingAssessment = Number(statsRow?.prevPendingAssessment) || 0
      const prevActiveClients = Number(statsRow?.prevActiveClients) || 0
      const expiringSoon = Number(expiringSoonCount) || 0

      const recentClients = (recentClientsRes?.rows as unknown as {
        id: string
        fullName: string | null
        phone: string | null
        goals: Goal[]
        status: ClientStatus
        createdAt: Date
      }[]) ?? []

      return {
        stats: {
          totalClients,
          pendingAssessment,
          activeClients,
          recentlyAdded,
          expiringSoon,
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
            // Expiring soon: zero delta baseline
            expiringSoon: 0,
          },
        },
        recentClients: recentClients.map((client) => ({
          ...client,
          goals: parseGoals(client.goals),
          createdAt: toIso(client.createdAt)!,
        })),
      }
    },
    ["trainer-dashboard", trainerProfileId],
    [`trainer:${trainerProfileId}:dashboard`],
    300
  )()
}
