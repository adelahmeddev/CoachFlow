"use client"

import { Check } from "lucide-react"
import { useState } from "react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function SetInputRow({
  exercise,
  setNumber,
  onComplete,
}: {
  exercise: {
    id: string
    exerciseName: string
    sets: number
    reps: number
    targetWeight: number | null
  }
  setNumber: number
  onComplete: () => void
}) {
  const { t } = useI18n()
  const [done, setDone] = useState(false)

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">
            {exercise.exerciseName}
            <span className="ms-2 text-xs text-muted-foreground">
              Set {setNumber + 1} / {exercise.sets}
            </span>
          </p>
          {done ? <Check className="size-5 text-emerald-600" /> : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {lookup(t, "client.workout.weight")} (kg)
            </label>
            <Input
              type="number"
              defaultValue={
                exercise.targetWeight ?? exercise.targetWeight ?? undefined
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {lookup(t, "client.workout.reps")}
            </label>
            <Input type="number" defaultValue={exercise.reps} placeholder="0" />
          </div>
        </div>
        <Button
          variant={done ? "secondary" : "default"}
          className="w-full"
          onClick={() => {
            setDone((v) => !v)
            onComplete()
          }}
        >
          {done ? lookup(t, "client.common.done") : lookup(t, "client.common.save")}
        </Button>
      </CardContent>
    </Card>
  )
}
