"use client"

import { CreditCard } from "lucide-react"
import type { SubscriptionStatus } from "@/lib/db/enums"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MySubscriptionSection({
  client,
}: {
  client: {
    subscriptions: Array<{
      id: string
      planName: string
      status: SubscriptionStatus
      remainingSessions: number | null
      endDate: Date | null
    }>
  }
}) {
  const { t, locale } = useI18n()
  const subscription = client.subscriptions[0]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-brand-600 dark:text-brand-400" />
          <CardTitle>{lookup(t, "client.profile.mySubscription")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.profile.planName")}
          </label>
          <p className="font-medium">{subscription?.planName ?? "—"}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.profile.planStatus")}
          </label>
          <p className="font-medium">
            {subscription
              ? lookup(
                  t,
                  `client.common.${subscription.status.toLowerCase()}`
                ) || subscription.status
              : "—"}
          </p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.profile.remainingSessions")}
          </label>
          <p className="font-medium">{subscription?.remainingSessions ?? "—"}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.profile.endDate")}
          </label>
          <p className="font-medium">
            {subscription?.endDate
              ? new Date(subscription.endDate).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : locale)
              : "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
