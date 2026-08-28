"use client"

import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function DailyProgressBars({
  progress,
}: {
  progress: number
}) {
  const { t } = useI18n()
  const compliant = progress >= 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lookup(t, "client.nutrition.dailyProgress")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p
          className={
            compliant
              ? "text-sm font-medium text-emerald-600"
              : "text-sm font-medium text-amber-600"
          }
        >
          {compliant
            ? lookup(t, "client.nutrition.compliant")
            : lookup(t, "client.nutrition.notCompliant")}
        </p>
      </CardContent>
    </Card>
  )
}
