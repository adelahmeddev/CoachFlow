"use client"

import { Timer } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent } from "@/components/ui/card"

export function RestTimer({
  remainingSeconds,
}: {
  remainingSeconds: number
}) {
  const { t } = useI18n()
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Timer className="size-5 text-brand-600 dark:text-brand-400" />
          <span className="font-medium">{lookup(t, "client.workout.restTimer")}</span>
        </div>
        <span className="text-xl font-semibold tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </CardContent>
    </Card>
  )
}
