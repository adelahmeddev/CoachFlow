import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"
import { getI18n } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"
import { getClientStatusLabel } from "@/lib/i18n/labels"
import { CLIENT_STATUS_BADGE_VARIANTS } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { getAdminDashboardStats } from "@/server/services/admin.service"

type Client = Awaited<
  ReturnType<typeof getAdminDashboardStats>
>["recentClients"][number]

export async function RecentClientsCard({ clients }: { clients: Client[] }) {
  const { t, locale } = await getI18n()

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t.admin.dashboard.recentClients}</CardTitle>
        <Link
          href="/admin/clients"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t.admin.dashboard.viewAll}
          <ArrowRight className="size-3.5 rtl:-scale-x-100" />
        </Link>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t.admin.dashboard.noClients}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {clients.map((client) => (
              <li key={client.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {client.fullName ?? t.admin.clients.invitedClient}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {client.trainer.fullName}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={CLIENT_STATUS_BADGE_VARIANTS[client.status]}>
                    {getClientStatusLabel(client.status, locale)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(client.createdAt, locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
