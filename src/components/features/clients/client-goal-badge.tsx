"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { getGoalLabel } from "@/lib/i18n/labels"
import type { Goal } from "@/generated/prisma/enums"

export function ClientGoalBadge({ goal }: { goal: Goal | null }) {
  const { locale } = useI18n()
  if (!goal) {
    return <span className="text-muted-foreground">—</span>
  }
  return <Badge variant="outline">{getGoalLabel(goal, locale)}</Badge>
}
