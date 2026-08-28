"use client"

import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function WorkoutSummary({
  totalExercises,
  completedCount,
  onFinish,
}: {
  totalExercises: number
  completedCount: number
  onFinish?: () => void
}) {
  const { t } = useI18n()
  const progress =
    totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">{lookup(t, "client.workout.summary")}</p>
          <p className="text-sm text-muted-foreground">
            {completedCount} / {totalExercises}
          </p>
        </div>
        <Progress value={progress} className="h-2" />
        {onFinish ? (
          <Button className="w-full" onClick={onFinish}>
            {lookup(t, "client.workout.finishWorkout")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
