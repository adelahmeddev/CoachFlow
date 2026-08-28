"use client"

import { CircleCheck, CircleDotDashed } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"

export function BasicInfoBadge({
  completedAt,
}: {
  completedAt: Date | null
}) {
  const { t } = useI18n()
  if (completedAt) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CircleCheck className="size-3.5 text-emerald-500" />
        {t.admin.clients.basicInfoCompleted}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1">
      <CircleDotDashed className="size-3.5" />
      {t.admin.clients.basicInfoPending}
    </Badge>
  )
}
