import {
  CreditCard,
  ShieldCheck,
  ClipboardList,
  Users,
  type LucideIcon,
} from "lucide-react"
import { getI18n } from "@/lib/i18n"
import { formatNumber } from "@/lib/i18n/format"
import { Card, CardContent } from "@/components/ui/card"
import type { getAdminDashboardStats } from "@/server/services/admin.service"

type Stats = Awaited<ReturnType<typeof getAdminDashboardStats>>

export async function AdminStatsCards({ stats }: { stats: Stats }) {
  const { t, locale } = await getI18n()

  const items: { label: string; value: number; icon: LucideIcon }[] = [
    {
      label: t.admin.dashboard.totalTrainers,
      value: stats.totalTrainers,
      icon: ShieldCheck,
    },
    {
      label: t.admin.dashboard.totalClients,
      value: stats.totalClients,
      icon: Users,
    },
    {
      label: t.admin.dashboard.activeSubscriptions,
      value: stats.activeSubscriptions,
      icon: CreditCard,
    },
    {
      label: t.admin.dashboard.pendingAssessments,
      value: stats.pendingAssessments,
      icon: ClipboardList,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="glass">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold tracking-tight">
                {formatNumber(item.value, locale)}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-brand-500/15 to-brand-600/15 text-brand-600 dark:text-brand-400">
              <item.icon className="size-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
