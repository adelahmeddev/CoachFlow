import { prisma } from "@/lib/prisma"
import { ClientStatus } from "@/generated/prisma/enums"
import { withCache, toIso } from "@/lib/cache"

export async function getDashboardData(trainerProfileId: string) {
  return withCache(
    async () => {
      const now = Date.now()
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000)

      const [
        // Current-period counts — 3 targeted COUNTs is still fewer than the
        // original 5, and avoids the groupBy-on-timestamp granularity problem.
        totalClients,
        pendingAssessment,
        activeClients,
        // Added this period (last 30 days)
        recentlyAdded,
        // Previous period (30–60 days ago) for delta calculation
        prevPeriodAdded,
        prevPendingAssessment,
        prevActiveClients,
        recentClients,
      ] = await Promise.all([
        prisma.client.count({
          where: { trainerId: trainerProfileId },
        }),
        prisma.client.count({
          where: { trainerId: trainerProfileId, status: ClientStatus.PENDING_ASSESSMENT },
        }),
        prisma.client.count({
          where: { trainerId: trainerProfileId, status: ClientStatus.ACTIVE },
        }),
        prisma.client.count({
          where: { trainerId: trainerProfileId, createdAt: { gte: thirtyDaysAgo } },
        }),
        // Previous 30-day window for "recently added" delta
        prisma.client.count({
          where: {
            trainerId: trainerProfileId,
            createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          },
        }),
        // Snapshot: how many were PENDING_ASSESSMENT 30 days ago (proxy: created before window)
        // We approximate trend using total counts at window boundaries.
        // For PENDING and ACTIVE we compare current vs 30-days-ago snapshot via
        // counting clients that changed into those states in the window.
        prisma.client.count({
          where: {
            trainerId: trainerProfileId,
            status: ClientStatus.PENDING_ASSESSMENT,
            createdAt: { lt: thirtyDaysAgo },
          },
        }),
        prisma.client.count({
          where: {
            trainerId: trainerProfileId,
            status: ClientStatus.ACTIVE,
            createdAt: { lt: thirtyDaysAgo },
          },
        }),
        prisma.client.findMany({
          where: { trainerId: trainerProfileId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            fullName: true,
            phone: true,
            goal: true,
            status: true,
            createdAt: true,
          },
        }),
      ])

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
