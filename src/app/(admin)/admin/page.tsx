import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getI18n } from "@/lib/i18n"
import { getAdminDashboardStats } from "@/server/services/admin.service"
import { AdminStatsCards } from "@/components/features/admin/admin-stats-cards"
import { RecentTrainersCard } from "@/components/features/admin/recent-trainers-card"
import { RecentClientsCard } from "@/components/features/admin/recent-clients-card"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.admin.dashboard.title }
}

export default async function AdminDashboardPage() {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    notFound()
  }

  const { t } = await getI18n()
  const stats = await getAdminDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.admin.dashboard.title}
        </h1>
        <p className="text-muted-foreground">{t.admin.dashboard.subtitle}</p>
      </div>

      <AdminStatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTrainersCard trainers={stats.recentTrainers} />
        <RecentClientsCard clients={stats.recentClients} />
      </div>
    </div>
  )
}
