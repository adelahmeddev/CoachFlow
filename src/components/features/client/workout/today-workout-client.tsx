"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Play, Timer, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { saveExerciseLogAction } from "@/server/actions/client-portal"
import {
  ExerciseLogCard,
  type ExerciseLogValues,
} from "./exercise-log-card"

type Exercise = {
  id: string
  exerciseName: string
  sets: number
  reps: number
  targetWeight: number | null
  restSeconds?: number | null
  notes?: string | null
  youtubeUrl?: string | null
  videoUrl?: string | null
  log: {
    actualSets: number | null
    actualReps: number | null
    actualWeightKg: number | null
    rpe: number | null
    notes: string | null
  } | null
}

function initialValues(exercise: Exercise): ExerciseLogValues {
  return {
    weightKg:
      exercise.log?.actualWeightKg != null
        ? String(exercise.log.actualWeightKg)
        : exercise.targetWeight != null
          ? String(exercise.targetWeight)
          : "",
    reps:
      exercise.log?.actualReps != null
        ? String(exercise.log.actualReps)
        : String(exercise.reps),
    notes: exercise.notes ?? "",
  }
}

export function TodayWorkoutClient({
  exercises,
  dayId,
}: {
  exercises: Exercise[]
  dayId?: string | null
}) {
  const { t } = useI18n()
  const router = useRouter()

  const initialSaved = useMemo(
    () => new Set(exercises.filter((ex) => ex.log).map((ex) => ex.id)),
    [exercises]
  )

  const [started] = useState(initialSaved.size > 0)
  const [forms, setForms] = useState<Record<string, ExerciseLogValues>>(() =>
    Object.fromEntries(exercises.map((ex) => [ex.id, initialValues(ex)]))
  )
  const [savedIds, setSavedIds] = useState<Set<string>>(initialSaved)
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [restRemaining, setRestRemaining] = useState<number | null>(null)

  const firstUnsavedRef = useRef<HTMLDivElement | null>(null)

  const required = exercises.filter((ex) => !skippedIds.has(ex.id))
  const completedCount = required.filter((ex) => savedIds.has(ex.id)).length
  const firstUnsavedId =
    required.find((ex) => !savedIds.has(ex.id))?.id ?? null

  useEffect(() => {
    if (restRemaining === null) return
    if (restRemaining <= 0) {
      const t = setTimeout(() => setRestRemaining(null), 0)
      return () => clearTimeout(t)
    }
    const id = setInterval(() => {
      setRestRemaining((v) => (v === null ? null : v - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [restRemaining])

  function handleStart() {
    router.push(
      dayId
        ? `/client/workout/session?dayId=${encodeURIComponent(dayId)}`
        : "/client/workout/session"
    )
  }

  async function handleSave(exercise: Exercise) {
    const values = forms[exercise.id]
    if (!values) return
    setSavingId(exercise.id)
    try {
      const result = await saveExerciseLogAction(exercise.id, {
        actualSets: exercise.sets,
        actualReps: Number(values.reps) || exercise.reps,
        actualWeightKg: values.weightKg.trim() === "" ? undefined : Number(values.weightKg),
        notes: values.notes.trim() || undefined,
      })
      if (!result.ok) {
        toast.error(t.auth.errors.generic)
        return
      }
      setSavedIds((prev) => new Set(prev).add(exercise.id))
      const rest = exercise.restSeconds ?? 0
      if (rest > 0) setRestRemaining(rest)
    } finally {
      setSavingId(null)
    }
  }

  function handleFinish() {
    toast.success(lookup(t, "client.workout.greatWorkoutTitle"), {
      description: lookup(t, "client.workout.greatWorkoutDescription"),
    })
    router.push("/client/home")
  }

  return (
    <>
      {exercises.map((exercise, idx) => {
        const isDone = savedIds.has(exercise.id)
        const isSkipped = skippedIds.has(exercise.id)
        return (
          <div
            key={exercise.id}
            ref={exercise.id === firstUnsavedId ? firstUnsavedRef : undefined}
            className="animate-slide-soft opacity-0"
            style={{ animationDelay: `${idx * 70}ms`, animationFillMode: "forwards" }}
          >
            <ExerciseLogCard
              exercise={exercise}
              logging={started}
              done={isDone}
              skipped={isSkipped}
              values={forms[exercise.id]}
              saving={savingId === exercise.id}
              onFieldChange={(field, value) =>
                setForms((prev) => ({
                  ...prev,
                  [exercise.id]: { ...prev[exercise.id], [field]: value },
                }))
              }
              onSave={() => handleSave(exercise)}
              onSkip={() =>
                setSkippedIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(exercise.id)) next.delete(exercise.id)
                  else next.add(exercise.id)
                  return next
                })
              }
            />
          </div>
        )
      })}

      {!started && exercises.length > 0 ? (
        <div className="sticky bottom-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-slide-soft">
          <Button size="lg" className="w-full min-h-[48px] text-base btn-pop" onClick={handleStart}>
            <Play className="size-5" />
            {lookup(t, "client.workout.startWorkout")}
          </Button>
        </div>
      ) : null}

      {started && exercises.length > 0 ? (
        <div className="sticky bottom-0 z-30 space-y-2 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-slide-soft">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {lookup(t, "client.workout.exercisesDone")}
            </span>
            <span className="font-medium tabular-nums">
              {completedCount} / {required.length}
            </span>
          </div>
          <Progress value={required.length ? (completedCount / required.length) * 100 : 0} className="h-2" />
          <Button
            size="lg"
            variant={completedCount === required.length ? "default" : "outline"}
            className="w-full min-h-[48px]"
            onClick={handleFinish}
          >
            {lookup(t, "client.workout.finishWorkout")}
          </Button>
        </div>
      ) : null}

      {restRemaining !== null && restRemaining > 0 ? (
        <div className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-sm items-center justify-between rounded-2xl border bg-card/95 px-4 py-3 shadow-glow backdrop-blur animate-pop-in">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 animate-breathe">
              <Timer className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rest — breathe</p>
              <span className="font-bold tabular-nums text-lg leading-none">
                {String(Math.floor(restRemaining / 60)).padStart(2, "0")}:
                {String(restRemaining % 60).padStart(2, "0")}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={lookup(t, "client.workout.skipExercise")}
            onClick={() => setRestRemaining(null)}
            className="rounded-xl"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
    </>
  )
}
