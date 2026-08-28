"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { getClientStatusLabel } from "@/lib/i18n/labels"
import { CLIENT_STATUS_BADGE_VARIANTS } from "@/lib/constants"
import type { ClientStatus } from "@/generated/prisma/enums"

export function ClientStatusBadge({
  status,
}: {
  status: ClientStatus
}) {
  const { locale } = useI18n()
  return (
    <Badge variant={CLIENT_STATUS_BADGE_VARIANTS[status]}>
      {getClientStatusLabel(status, locale)}
    </Badge>
  )
}
