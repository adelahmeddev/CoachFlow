"use client"

import { Flame, TrendingUp } from "lucide-react"
import type { SubscriptionStatus } from "@/generated/prisma/enums"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function QuickStatsRow({
  workoutsDone,
  workoutsPlanned,
  streak,
  subscriptionStatus,
}: {
  workoutsDone: number
  workoutsPlanned: number
  streak: number
  subscriptionStatus: SubscriptionStatus | null
}) {
  const { t } = useI18n()

  const stats = [
    {
      label: lookup(t, "client.week.workoutsThisWeek"),
      value: `${workoutsDone}/${workoutsPlanned}`,
      icon: TrendingUp,
    },
    {
      label: lookup(t, "client.progress.consistencyStreak"),
      value: `${streak} days`,
      icon: Flame,
    },
    {
      label: lookup(t, "client.profile.planStatus"),
      value: subscriptionStatus
        ? lookup(
            t,
            `client.common.${subscriptionStatus.toLowerCase()}`
          ) || subscriptionStatus
        : lookup(t, "client.common.paused"),
      icon: Flame,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <stat.icon className="size-5 text-brand-600 dark:text-brand-400" />
            <span className="text-xl font-semibold">{stat.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
