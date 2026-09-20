"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { getGoalLabel, parseGoals } from "@/lib/i18n/labels"
import type { Goal } from "@/lib/db/enums"

export function ClientGoalBadge({
  goal,
  goals,
}: {
  goal?: Goal | null
  goals?: Goal[] | unknown
}) {
  const { locale } = useI18n()
  const list = parseGoals(goals && (Array.isArray(goals) ? goals.length > 0 : true) ? goals : goal ? [goal] : [])
  if (list.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <>
      {list.map((g) => (
        <Badge key={g} variant="outline">
          {getGoalLabel(g, locale)}
        </Badge>
      ))}
    </>
  )
}
