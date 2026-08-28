"use client"

import { Dumbbell, Loader2, Play } from "lucide-react"
import { useState } from "react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VideoDialog } from "@/components/shared/video-dialog"
import { cn } from "@/lib/utils"

export interface ExerciseLogValues {
  weightKg: string
  reps: string
  notes: string
}

interface ExerciseLogCardProps {
  exercise: {
    id: string
    exerciseName: string
    sets: number
    reps: number
    targetWeight: number | null
    restSeconds?: number | null
    notes?: string | null
    youtubeUrl?: string | null
    videoUrl?: string | null
  }
  logging?: boolean
  done?: boolean
  skipped?: boolean
  values?: ExerciseLogValues
  saving?: boolean
  onFieldChange?: (field: keyof ExerciseLogValues, value: string) => void
  onSave?: () => void
  onSkip?: () => void
}

export function ExerciseLogCard({
  exercise,
  logging = false,
  done = false,
  skipped = false,
  values,
  saving = false,
  onFieldChange,
  onSave,
  onSkip,
}: ExerciseLogCardProps) {
  const { t } = useI18n()
  const [showVideo, setShowVideo] = useState(false)
  const videoUrl = exercise.videoUrl ?? exercise.youtubeUrl

  return (
    <Card className={cn(skipped && "opacity-50")}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 min-w-0">
          <Dumbbell className="size-5 shrink-0 text-brand-600 dark:text-brand-400" />
          <p className="truncate font-medium">{exercise.exerciseName}</p>
          {done ? (
            <span className="ms-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">
              ✓
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg border p-2">
            <p className="text-xs text-muted-foreground">
              {lookup(t, "client.workout.sets")}
            </p>
            <p className="font-medium">{exercise.sets}</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-xs text-muted-foreground">
              {lookup(t, "client.workout.reps")}
            </p>
            <p className="font-medium">{exercise.reps}</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-xs text-muted-foreground">
              {lookup(t, "client.workout.weight")}
            </p>
            <p className="font-medium">
              {exercise.targetWeight ? `${exercise.targetWeight}kg` : "—"}
            </p>
          </div>
        </div>
        {exercise.notes && !logging ? (
          <p className="break-words text-sm text-muted-foreground">{exercise.notes}</p>
        ) : null}
        {videoUrl ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full min-h-[44px]"
              onClick={() => setShowVideo(true)}
            >
              <Play className="size-4 me-1" />
              {t.clients.watchExercise}
            </Button>
            <VideoDialog
              url={videoUrl}
              title={exercise.exerciseName}
              open={showVideo}
              onOpenChange={setShowVideo}
            />
          </>
        ) : null}
        {logging && values ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {lookup(t, "client.workout.weight")} (kg)
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  className="min-h-[44px]"
                  value={values.weightKg}
                  onChange={(e) => onFieldChange?.("weightKg", e.target.value)}
                  placeholder={exercise.targetWeight ? String(exercise.targetWeight) : "0"}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {lookup(t, "client.workout.reps")}
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="min-h-[44px]"
                  value={values.reps}
                  onChange={(e) => onFieldChange?.("reps", e.target.value)}
                  placeholder={String(exercise.reps)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                {lookup(t, "client.workout.addNote")}
              </label>
              <Input
                inputMode="text"
                className="min-h-[44px]"
                value={values.notes}
                onChange={(e) => onFieldChange?.("notes", e.target.value)}
                placeholder={lookup(t, "client.workout.addNote")}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={done ? "secondary" : "default"}
                className={cn("min-h-[44px] flex-1", done && "bg-emerald-600 hover:bg-emerald-600/90")}
                disabled={saving}
                onClick={onSave}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {done
                  ? lookup(t, "client.common.done")
                  : lookup(t, "client.common.save")}
              </Button>
              {!done && onSkip ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-[44px]"
                  onClick={onSkip}
                >
                  {lookup(t, "client.workout.skipExercise")}
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
