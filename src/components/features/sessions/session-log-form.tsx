"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { getDayFocusLabel } from "@/lib/i18n/labels"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createSessionLogAction,
} from "@/server/actions/session-log"
import type { SplitDayExerciseInput } from "@/lib/validations/exercise"
import type { TrainingDayFocus } from "@/lib/db/enums"

interface SessionFormExercise extends SplitDayExerciseInput {
  id: string
}

interface SessionSplitDay {
  id: string
  dayNumber: number
  focus: TrainingDayFocus
  customFocus: string | null
  exercises: SessionFormExercise[]
}

interface SessionSplit {
  id: string
  splitType: string
  days: SessionSplitDay[]
}

interface SessionLogFormProps {
  clientId: string
  split: SessionSplit
}

interface Entry {
  actualSets: string
  actualReps: string
  actualWeightKg: string
  rpe: string
  notes: string
}

function todayString(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function defaultDayId(days: SessionSplitDay[]): string {
  if (days.length === 0) return ""
  const weekday = (new Date().getDay() + 6) % 7
  const dayNumber = (weekday % days.length) + 1
  return (
    days.find((day) => day.dayNumber === dayNumber)?.id ?? days[0].id
  )
}

function defaultEntries(
  exercises: SessionFormExercise[]
): Record<string, Entry> {
  return Object.fromEntries(
    exercises.map((exercise) => [
      exercise.id,
      {
        actualSets: exercise.targetSets != null ? String(exercise.targetSets) : "",
        actualReps: exercise.targetReps != null ? String(exercise.targetReps) : "",
        actualWeightKg:
          exercise.targetWeightKg != null
            ? String(exercise.targetWeightKg)
            : "",
        rpe: "",
        notes: "",
      },
    ])
  )
}

export function SessionLogForm({ clientId, split }: SessionLogFormProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState(todayString())
  const [dayId, setDayId] = useState(() => defaultDayId(split.days))
  const [entries, setEntries] = useState<Record<string, Entry>>(() =>
    defaultEntries(
      split.days.find((day) => day.id === defaultDayId(split.days))
        ?.exercises ?? []
    )
  )

  const selectedDay = useMemo(
    () => split.days.find((day) => day.id === dayId) ?? split.days[0],
    [split.days, dayId]
  )

  function handleDayChange(nextDayId: string) {
    setDayId(nextDayId)
    const day = split.days.find((item) => item.id === nextDayId)
    setEntries(defaultEntries(day?.exercises ?? []))
  }

  function handleField(
    exerciseId: string,
    field: keyof Entry,
    value: string
  ) {
    setEntries((current) => ({
      ...current,
      [exerciseId]: { ...current[exerciseId], [field]: value },
    }))
  }

  async function onSubmit() {
    setIsSubmitting(true)
    setServerError(null)

    const payload = {
      splitDayId: selectedDay.id,
      date,
      entries: selectedDay.exercises
        .filter((exercise) => {
          const entry = entries[exercise.id]
          return (
            entry &&
            (entry.actualSets !== "" ||
              entry.actualReps !== "" ||
              entry.actualWeightKg !== "" ||
              entry.rpe !== "")
          )
        })
        .map((exercise) => {
          const entry = entries[exercise.id]
          return {
            splitDayExerciseId: exercise.id,
            actualSets: entry.actualSets === "" ? null : Number(entry.actualSets),
            actualReps: entry.actualReps === "" ? null : Number(entry.actualReps),
            actualWeightKg:
              entry.actualWeightKg === ""
                ? null
                : Number(entry.actualWeightKg),
            rpe: entry.rpe === "" ? null : Number(entry.rpe),
            notes: entry.notes.trim() || null,
          }
        }),
    }

    try {
      const result = await createSessionLogAction(clientId, payload)
      if (!result.ok) {
        if ("fieldErrors" in result && result.fieldErrors) {
          Object.values(result.fieldErrors).forEach((errors) => {
            if (errors && errors.length > 0) {
              toast.error(errors[0])
            }
          })
        }
        if ("error" in result && result.error) {
          setServerError(result.error)
        }
        return
      }

      toast.success(t.sessions.savedToast)
      router.push(`/clients/${clientId}?tab=progress`)
    } catch (e) {
      const err = e as { digest?: string }
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw e
      }
      setServerError(t.toasts.genericError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.sessions.sessionDetails}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t.sessions.selectDay}</Label>
            <Select value={selectedDay.id} onValueChange={handleDayChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {split.days.map((day) => (
                  <SelectItem key={day.id} value={day.id}>
                    {t.sessions.dayPrefix} {day.dayNumber} ·{" "}
                    {day.focus === "CUSTOM"
                      ? day.customFocus || t.trainingSplit.custom
                      : getDayFocusLabel(day.focus, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionDate">{t.sessions.date}</Label>
            <Input
              id="sessionDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.sessions.exercisesForDay}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDay.exercises.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t.sessions.noExercisesInDay}
            </p>
          ) : (
            selectedDay.exercises.map((exercise) => {
              const entry = entries[exercise.id] ?? {
                actualSets: "",
                actualReps: "",
                actualWeightKg: "",
                rpe: "",
                notes: "",
              }
              return (
                <div key={exercise.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 text-sm font-medium">
                      {exercise.exerciseName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exercise.targetSets ? `${exercise.targetSets} × ${exercise.targetReps ?? "—"} · ${exercise.targetWeightKg ?? "—"} kg` : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">{t.sessions.actualSets}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={entry.actualSets}
                        onChange={(e) =>
                          handleField(exercise.id, "actualSets", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.sessions.actualReps}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={entry.actualReps}
                        onChange={(e) =>
                          handleField(exercise.id, "actualReps", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.sessions.actualWeightKg}</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={entry.actualWeightKg}
                        onChange={(e) =>
                          handleField(
                            exercise.id,
                            "actualWeightKg",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.sessions.rpe}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={entry.rpe}
                        onChange={(e) =>
                          handleField(exercise.id, "rpe", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <Input
                    placeholder={t.sessions.notesPlaceholder}
                    value={entry.notes}
                    onChange={(e) =>
                      handleField(exercise.id, "notes", e.target.value)
                    }
                  />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[160px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t.common.saving}
            </>
          ) : (
            t.sessions.saveSession
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/clients/${clientId}?tab=progress`)}
          disabled={isSubmitting}
          className="min-w-[160px]"
        >
          {t.common.cancel}
        </Button>
      </div>
    </form>
  )
}
