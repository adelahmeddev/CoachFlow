"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Play, Timer, X, Trophy, Check } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { saveExerciseLogAction } from "@/server/actions/client-portal"
import { haptics } from "@/lib/haptics"
import { CelebrationBurst } from "@/components/ui/celebration-burst"
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
  const [showCelebration, setShowCelebration] = useState(false)

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
    haptics.selection()
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
      haptics.impact("medium")
      setSavedIds((prev) => new Set(prev).add(exercise.id))
      const rest = exercise.restSeconds ?? 0
      if (rest > 0) setRestRemaining(rest)
    } finally {
      setSavingId(null)
    }
  }

  function handleFinish() {
    haptics.success()
    setShowCelebration(true)
    toast.success(lookup(t, "client.workout.greatWorkoutTitle"), {
      description: lookup(t, "client.workout.greatWorkoutDescription"),
    })
    setTimeout(() => {
      router.push("/client/home")
    }, 2000)
  }

  const activeExercise = required.find((ex) => !savedIds.has(ex.id))

  return (
    <>
      {/* Workout progress header */}
      {started && required.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-20 -mx-4 -mt-4 mb-4 border-b bg-card/80 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 md:-mx-0 md:rounded-2xl md:border md:shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {lookup(t, "client.workout.exercisesDone")} • {completedCount}/{required.length}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {required.map((ex) => {
                  const done = savedIds.has(ex.id)
                  const active = activeExercise?.id === ex.id
                  return (
                    <motion.span
                      key={ex.id}
                      layout
                      className={`h-1.5 flex-1 rounded-full transition-colors ${done ? "bg-performance-500" : active ? "bg-brand-500" : "bg-border"}`}
                      initial={{ scaleX: 0.8 }}
                      animate={{ scaleX: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )
                })}
              </div>
            </div>
            {activeExercise && (
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300 sm:inline-flex">
                <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
                {activeExercise.exerciseName}
              </span>
            )}
          </div>
          <Progress value={required.length ? (completedCount / required.length) * 100 : 0} className="mt-3 h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-500 [&>div]:to-energy-500" />
        </motion.div>
      )}

      {exercises.map((exercise, idx) => {
        const isDone = savedIds.has(exercise.id)
        const isSkipped = skippedIds.has(exercise.id)
        const isActive = activeExercise?.id === exercise.id
        return (
          <motion.div
            key={exercise.id}
            ref={exercise.id === firstUnsavedId ? firstUnsavedRef : undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            layout
            className={isActive ? "ring-2 ring-brand-500/20 rounded-2xl" : undefined}
          >
            <ExerciseLogCard
              exercise={exercise}
              logging={started}
              done={isDone}
              skipped={isSkipped}
              isActive={isActive}
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
          </motion.div>
        )
      })}

      {!started && exercises.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 z-30 -mx-4 -mb-4 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:mx-0 md:rounded-2xl md:mb-0"
        >
          <Button size="lg" className="w-full min-h-[48px] text-base rounded-xl bg-gradient-to-r from-brand-600 to-energy-500 shadow-soft hover:brightness-110 gap-2" onClick={handleStart}>
            <Play className="size-5 fill-white" />
            {lookup(t, "client.workout.startWorkout")}
          </Button>
        </motion.div>
      ) : null}

      {started && exercises.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 z-30 -mx-4 -mb-4 space-y-3 border-t bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:mx-0 md:rounded-2xl md:mb-0"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              {completedCount === required.length ? <Trophy className="size-3.5 text-energy-600" /> : <Check className="size-3.5 text-brand-600" />}
              {lookup(t, "client.workout.exercisesDone")}
            </span>
            <span className="font-bold tabular-nums">
              {completedCount} / {required.length}
            </span>
          </div>
          <Progress value={required.length ? (completedCount / required.length) * 100 : 0} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-brand-500 [&>div]:to-energy-500" />
          <Button
            size="lg"
            variant={completedCount === required.length ? "default" : "outline"}
            className={`w-full min-h-[48px] rounded-xl gap-2 ${completedCount === required.length ? "bg-gradient-to-r from-performance-500 to-performance-600 text-white shadow-soft hover:brightness-110" : ""}`}
            onClick={handleFinish}
          >
            {completedCount === required.length && <Trophy className="size-4" />}
            {lookup(t, "client.workout.finishWorkout")}
          </Button>
          {completedCount === required.length && (
            <p className="text-center text-xs font-medium text-performance-700 dark:text-performance-300">
              {lookup(t, "client.workout.greatWorkoutDescription")}
            </p>
          )}
        </motion.div>
      ) : null}

      <AnimatePresence>
        {restRemaining !== null && restRemaining > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-sm items-center justify-between rounded-2xl border bg-card/95 px-4 py-3 shadow-glow backdrop-blur animate-breathe"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-soft">
                <Timer className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rest</p>
                <span className="font-extrabold tabular-nums text-lg leading-none">
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
          </motion.div>
        ) : null}
      </AnimatePresence>

      {showCelebration && <CelebrationBurst onComplete={() => setShowCelebration(false)} />}
    </>
  )
}
