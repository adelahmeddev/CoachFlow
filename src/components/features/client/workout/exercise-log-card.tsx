"use client"

import { Dumbbell, Loader2, Play, Check, Clock, Weight, Repeat, SkipForward, Trophy } from "lucide-react"
import { useState } from "react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
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
  const isAr = (t as unknown as Record<string, unknown>)?.client ? true : false

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 card-lift animate-slide-soft",
        done && "border-performance-200 bg-performance-50/50 dark:border-performance-800/30 dark:bg-performance-500/10 shadow-[0_0_20px_-8px_#22C55E40] animate-breathe",
        skipped && "opacity-60 grayscale-[0.3]",
        !done && !skipped && "hover:shadow-card-hover hover:-translate-y-0.5 hover:border-brand-200 dark:hover:border-brand-900/30"
      )}
    >
      {/* top accent */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px opacity-60",
          done ? "bg-gradient-to-r from-transparent via-performance-500 to-transparent" : "bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"
        )}
        aria-hidden="true"
      />
      {/* done confetti glow */}
      {done && (
        <div className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-gradient-to-br from-performance-500/15 to-brand-500/10 blur-xl" aria-hidden="true" />
      )}

      <div className="p-4 space-y-3">
        {/* HEADER */}
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-soft ring-1 transition-transform group-hover:scale-105",
              done ? "bg-gradient-to-br from-performance-500 to-performance-600 ring-performance-500/20" : "bg-gradient-to-br from-brand-500 to-brand-600 ring-brand-500/20"
            )}
          >
            {done ? <Check className="size-5 stroke-[3]" /> : <Dumbbell className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight tracking-tight">{exercise.exerciseName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                <Repeat className="size-3 text-muted-foreground" />
                {exercise.sets} × {exercise.reps}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-500/15 dark:bg-brand-500/15 dark:text-brand-300">
                <Weight className="size-3" />
                {exercise.targetWeight ? `${exercise.targetWeight}kg` : "—"}
              </span>
              {exercise.restSeconds ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-500/15 dark:bg-sky-500/15 dark:text-sky-300">
                  <Clock className="size-3" />
                  {exercise.restSeconds}s
                </span>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-performance-500 px-2.5 py-1 text-xs font-bold text-white shadow-soft">
                <Trophy className="size-3" />
                {lookup(t, "client.common.done")}
              </span>
            )}
            {!done && logging && (
              <span className="size-2 rounded-full bg-brand-500 animate-pulse" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* TARGET GRID */}
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("rounded-xl border p-2.5 text-center transition-colors", done ? "bg-performance-500/5 border-performance-200 dark:border-performance-900/30" : "bg-muted/30 hover:bg-muted/50")}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{lookup(t, "client.workout.sets")}</p>
            <p className="mt-1 text-lg font-extrabold leading-none tabular-nums">{exercise.sets}</p>
          </div>
          <div className={cn("rounded-xl border p-2.5 text-center", done ? "bg-performance-500/5 border-performance-200 dark:border-performance-900/30" : "bg-muted/30")}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{lookup(t, "client.workout.reps")}</p>
            <p className="mt-1 text-lg font-extrabold leading-none tabular-nums">{exercise.reps}</p>
          </div>
          <div className={cn("rounded-xl border p-2.5 text-center", done ? "bg-performance-500/5 border-performance-200 dark:border-performance-900/30" : "bg-muted/30")}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{lookup(t, "client.workout.weight")}</p>
            <p className="mt-1 text-lg font-extrabold leading-none tabular-nums">
              {exercise.targetWeight ? (
                <span>
                  {exercise.targetWeight}
                  <span className="text-xs font-medium text-muted-foreground">kg</span>
                </span>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        {exercise.notes && !logging ? (
          <p className="rounded-xl border bg-muted/20 p-2.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{isAr ? "ملاحظة:" : "Note:"}</span> {exercise.notes}
          </p>
        ) : null}

        {videoUrl ? (
          <>
            <Button
              type="button"
              variant={done ? "outline" : "secondary"}
              size="sm"
              className={cn(
                "w-full min-h-[44px] gap-2 rounded-xl font-semibold",
                !done && "bg-gradient-to-r from-brand-500/10 to-energy-500/10 hover:from-brand-500/15 hover:to-energy-500/15 border-brand-200 text-brand-700 dark:text-brand-300 dark:border-brand-800"
              )}
              onClick={() => setShowVideo(true)}
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white shadow-soft">
                <Play className="size-3.5 fill-white ms-0.5" />
              </span>
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
          <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <Weight className="size-3" />
                  {lookup(t, "client.workout.weight")} (kg)
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  className="min-h-[44px] rounded-xl bg-card font-medium tabular-nums"
                  value={values.weightKg}
                  onChange={(e) => onFieldChange?.("weightKg", e.target.value)}
                  placeholder={exercise.targetWeight ? String(exercise.targetWeight) : "0"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <Repeat className="size-3" />
                  {lookup(t, "client.workout.reps")}
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="min-h-[44px] rounded-xl bg-card font-medium tabular-nums"
                  value={values.reps}
                  onChange={(e) => onFieldChange?.("reps", e.target.value)}
                  placeholder={String(exercise.reps)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {lookup(t, "client.workout.addNote")}
              </label>
              <Input
                inputMode="text"
                className="min-h-[44px] rounded-xl bg-card"
                value={values.notes}
                onChange={(e) => onFieldChange?.("notes", e.target.value)}
                placeholder={lookup(t, "client.workout.addNote")}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant={done ? "secondary" : "default"}
                className={cn(
                  "min-h-[44px] flex-1 rounded-xl gap-2 font-bold shadow-soft",
                  done
                    ? "bg-performance-600 hover:bg-performance-700 text-white"
                    : "bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 text-white"
                )}
                disabled={saving}
                onClick={onSave}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : done ? <Check className="size-4" /> : null}
                {done
                  ? lookup(t, "client.common.done")
                  : lookup(t, "client.common.save")}
              </Button>
              {!done && onSkip ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-[44px] rounded-xl gap-1 text-muted-foreground hover:text-foreground"
                  onClick={onSkip}
                >
                  <SkipForward className="size-4" />
                  {lookup(t, "client.workout.skipExercise")}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
