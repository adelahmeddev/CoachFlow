import { CalendarClock, CheckCircle2, Clock3, Users } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getDashboardData } from "@/server/services/dashboard.service"
import { StatCard } from "@/components/features/dashboard/stat-card"
import { RecentClients } from "@/components/features/dashboard/recent-clients"
import {
  DashboardEmpty,
  DashboardQuickActions,
} from "@/components/features/dashboard/dashboard-empty"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getI18n } from "@/lib/i18n"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.dashboard.title,
    description: t.dashboard.subtitle,
  }
}

export default async function DashboardPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  const trainerProfileId = session?.user.trainerProfileId
  if (!trainerProfileId) {
    return (
      <div className="space-y-6">
        <DashboardEmpty />
      </div>
    )
  }

  const { stats, recentClients } = await getDashboardData(trainerProfileId)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-[28px]">
            {t.dashboard.welcomeBack.replace("{name}", session?.user.name ?? t.nav.clientProfile)}
          </h1>
          <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {t.dashboard.whatsHappening}
          </p>
        </div>
        <DashboardQuickActions />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:animate-in [&>*]:fade-in-50 [&>*]:slide-in-from-bottom-2 motion-reduce:[&>*]:animate-none">
        <div className="contents [&>*]:[animation-delay:0ms]"><StatCard
          label={t.dashboard.totalClients}
          value={stats.totalClients}
          icon={Users}
          delta={stats.deltas.totalClients}
        /></div>
        <div className="contents [&>*]:[animation-delay:60ms]"><StatCard
          label={t.dashboard.pendingAssessment}
          value={stats.pendingAssessment}
          icon={Clock3}
          delta={stats.deltas.pendingAssessment}
        /></div>
        <div className="contents [&>*]:[animation-delay:120ms]"><StatCard
          label={t.dashboard.activeClients}
          value={stats.activeClients}
          icon={CheckCircle2}
          delta={stats.deltas.activeClients}
        /></div>
        <div className="contents [&>*]:[animation-delay:180ms]"><StatCard
          label={t.dashboard.recentlyAdded}
          value={stats.recentlyAdded}
          icon={CalendarClock}
          delta={stats.deltas.recentlyAdded}
        /></div>
      </div>

      {recentClients.length === 0 ? (
        <DashboardEmpty />
      ) : (
        <Card className="overflow-hidden border bg-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 py-4">
            <CardTitle className="text-sm font-semibold tracking-tight">{t.dashboard.recentClientsTitle}</CardTitle>
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {recentClients.length}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <RecentClients clients={recentClients} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
