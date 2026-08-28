"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { getSubscriptionStatusLabel } from "@/lib/i18n/labels"
import { SUBSCRIPTION_STATUS_BADGE_VARIANTS } from "@/lib/constants"
import type { SubscriptionStatus } from "@/generated/prisma/enums"

export function SubscriptionBadge({
  planName,
  status,
}: {
  planName: string
  status: SubscriptionStatus
}) {
  const { locale } = useI18n()
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-medium">{planName}</span>
      <Badge variant={SUBSCRIPTION_STATUS_BADGE_VARIANTS[status]}>
        {getSubscriptionStatusLabel(status, locale)}
      </Badge>
    </div>
  )
}

export function NoSubscriptionBadge() {
  const { t } = useI18n()
  return (
    <span className="text-sm text-muted-foreground">
      {t.admin.clients.noSubscription}
    </span>
  )
}
