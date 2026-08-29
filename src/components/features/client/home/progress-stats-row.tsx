"use client"

"use client"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"


interface ProgressStatsRowProps {
  currentWeight: number | null
  weightChange: number | null
  totalWorkouts: number
  latestAdherence: string | null
}

export function ProgressStatsRow({
  currentWeight,
  weightChange,
  totalWorkouts,
  latestAdherence,
}: ProgressStatsRowProps) {
  const { t } = useI18n()
  const p = t.client.progress

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card>
        <CardHeader className="pb-1">
          <CardDescription>{p.currentWeight}</CardDescription>
          <CardTitle className="text-xl">
            {currentWeight != null ? `${currentWeight.toFixed(1)} kg` : "\u2014"}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-1">
          <CardDescription>{p.weightChange}</CardDescription>
          <CardTitle
            className={
              weightChange === null
                ? "text-xl"
                : weightChange < 0
                  ? "text-xl text-emerald-600"
                  : weightChange > 0
                    ? "text-xl text-destructive"
                    : "text-xl"
            }
          >
            {weightChange === null
              ? "\u2014"
              : `${weightChange > 0 ? "+" : ""}${weightChange} kg`}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-1">
          <CardDescription>{p.totalWorkouts}</CardDescription>
          <CardTitle className="text-xl">{totalWorkouts}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-1">
          <CardDescription>{p.latestAdherence}</CardDescription>
          <CardTitle className="text-xl">{latestAdherence ?? "\u2014"}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
