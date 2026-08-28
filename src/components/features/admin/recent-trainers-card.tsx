import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getI18n } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { getAdminDashboardStats } from "@/server/services/admin.service"

type Trainer = Awaited<
  ReturnType<typeof getAdminDashboardStats>
>["recentTrainers"][number]

export async function RecentTrainersCard({ trainers }: { trainers: Trainer[] }) {
  const { t, locale } = await getI18n()

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t.admin.dashboard.recentTrainers}</CardTitle>
        <Link
          href="/admin/trainers"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t.admin.dashboard.viewAll}
          <ArrowRight className="size-3.5 rtl:-scale-x-100" />
        </Link>
      </CardHeader>
      <CardContent>
        {trainers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t.admin.dashboard.noTrainers}
          </p>
        ) : (
          <ul className="divide-y">
            {trainers.map((trainer) => (
              <li key={trainer.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{trainer.fullName}</p>
                  <p className="truncate text-sm text-muted-foreground" dir="ltr">
                    {trainer.phone}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-muted-foreground">
                  {formatDate(trainer.createdAt, locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
