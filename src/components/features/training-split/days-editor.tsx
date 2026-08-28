"use client"

import { useMemo } from "react"
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DAY_FOCUS_OPTIONS, MAX_TRAINING_DAYS } from "@/lib/constants/training-split"
import { WEEKDAY_CYCLE } from "@/lib/calculations/week-schedule"
import type { TrainingSplitDayInput } from "@/lib/validations/training-split"
import type { SplitDayExerciseInput } from "@/lib/validations/exercise"
import { MAX_EXERCISES_PER_DAY } from "@/lib/validations/exercise"
import type { TrainingDayFocus, Weekday } from "@/generated/prisma/enums"
import { ScheduleMode } from "@/generated/prisma/enums"
import { ExercisePicker } from "@/components/features/training-split/exercise-picker"
import type { ExerciseOption } from "@/lib/exercise-safety"

interface DaysEditorProps {
  days: TrainingSplitDayInput[]
  disabled?: boolean
  onChange: (days: TrainingSplitDayInput[]) => void
  exerciseLibrary?: ExerciseOption[]
  onExerciseAdded?: (dayIndex: number, exercise: ExerciseOption) => void
  scheduleMode?: ScheduleMode
}

export function toExerciseDraft(
  exercise: {
    exerciseId?: string | null
    exerciseName: string
    targetSets?: number | string | null
    targetReps?: number | string | null
    targetWeightKg?: number | string | null
    restSeconds?: number | string | null
    notes?: string | null
    videoUrl?: string | null
  }
): SplitDayExerciseInput {
  return {
    exerciseId: exercise.exerciseId ?? null,
    exerciseName: exercise.exerciseName,
    targetSets:
      exercise.targetSets == null ? "" : String(exercise.targetSets),
    targetReps: exercise.targetReps == null ? "" : String(exercise.targetReps),
    targetWeightKg:
      exercise.targetWeightKg == null ? "" : String(exercise.targetWeightKg),
    restSeconds:
      exercise.restSeconds == null ? "" : String(exercise.restSeconds),
    notes: exercise.notes ?? "",
    videoUrl: exercise.videoUrl ?? "",
  }
}

export function DaysEditor({
  days,
  disabled,
  onChange,
  exerciseLibrary,
  onExerciseAdded,
  scheduleMode = ScheduleMode.FIXED_WEEKDAYS,
}: DaysEditorProps) {
  const { t } = useI18n()

  function updateDays(next: TrainingSplitDayInput[]) {
    onChange(next)
  }

  function handleWeekdayChange(index: number, weekday: Weekday) {
    const next = days.map((day, i) =>
      i === index ? { ...day, weekday } : { ...day }
    )
    updateDays(next)
  }

  function updateDayExercises(
    index: number,
    exercises: SplitDayExerciseInput[]
  ) {
    const next = days.map((day, i) =>
      i === index ? { ...day, exercises } : day
    )
    updateDays(next)
  }

  function handleFocusChange(index: number, focus: TrainingDayFocus) {
    const next = days.map((day, i) =>
      i === index
        ? {
            ...day,
            focus,
            customFocus:
              focus === "CUSTOM"
                ? day.customFocus ?? ""
                : day.customFocus,
          }
        : { ...day }
    )
    updateDays(next)
  }

  function handleCustomFocusChange(index: number, value: string) {
    const next = days.map((day, i) =>
      i === index ? { ...day, customFocus: value } : { ...day }
    )
    updateDays(next)
  }

  function handleNotesChange(index: number, value: string) {
    const next = days.map((day, i) =>
      i === index ? { ...day, notes: value } : { ...day }
    )
    updateDays(next)
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= days.length) return
    const next = [...days]
    ;[next[index], next[target]] = [next[target], next[index]]
    updateDays(next)
  }

  function handleRemove(index: number) {
    if (days.length <= 1) return
    updateDays(days.filter((_, i) => i !== index))
  }

  function handleAdd() {
    if (days.length >= MAX_TRAINING_DAYS) return
    updateDays([
      ...days,
      {
        focus: "CUSTOM" as TrainingDayFocus,
        customFocus: "",
        notes: "",
        exercises: [],
      },
    ])
  }

  function handleExerciseSelect(
    dayIndex: number,
    exerciseIndex: number,
    exercise: ExerciseOption
  ) {
    const day = days[dayIndex]
    if (!day) return
    const exercises = day.exercises ?? []
    const current = exercises[exerciseIndex]
    const nextExercises = exercises.map((ex, i) =>
      i === exerciseIndex
        ? {
            ...ex,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            targetSets: current?.targetSets
              ? current.targetSets
              : exercise.defaultSets != null
                ? String(exercise.defaultSets)
                : "",
            targetReps: current?.targetReps
              ? current.targetReps
              : exercise.defaultReps != null
                ? String(exercise.defaultReps)
                : "",
            restSeconds: current?.restSeconds
              ? current.restSeconds
              : exercise.defaultRestSeconds != null
                ? String(exercise.defaultRestSeconds)
                : "",
          }
        : ex
    )
    updateDayExercises(dayIndex, nextExercises)
  }

  function handleExerciseField(
    dayIndex: number,
    exerciseIndex: number,
    field: keyof SplitDayExerciseInput,
    value: string
  ) {
    const day = days[dayIndex]
    if (!day) return
    const exercises = day.exercises ?? []
    updateDayExercises(
      dayIndex,
      exercises.map((ex, i) =>
        i === exerciseIndex ? { ...ex, [field]: value } : ex
      )
    )
  }

  function handleRemoveExercise(dayIndex: number, exerciseIndex: number) {
    const day = days[dayIndex]
    if (!day) return
    updateDayExercises(
      dayIndex,
      (day.exercises ?? []).filter((_, i) => i !== exerciseIndex)
    )
  }

  function handleAddExercise(dayIndex: number) {
    const day = days[dayIndex]
    if (!day) return
    updateDayExercises(dayIndex, [
      ...(day.exercises ?? []),
      {
        exerciseId: null,
        exerciseName: "",
        targetSets: "",
        targetReps: "",
        targetWeightKg: "",
        restSeconds: "",
        notes: "",
      },
    ])
  }

  const invalidCustomIndexes = useMemo(
    () =>
      days
        .map((day, index) =>
          day.focus === "CUSTOM" && !day.customFocus?.trim() ? index : -1
        )
        .filter((index) => index !== -1),
    [days]
  )

  // FIXED mode: rows with missing or duplicated weekdays
  const weekdayIssueIndexes = useMemo(() => {
    if (scheduleMode !== ScheduleMode.FIXED_WEEKDAYS) return []
    const counts = new Map<string, number>()
    for (const day of days) {
      if (!day.weekday) continue
      counts.set(day.weekday, (counts.get(day.weekday) ?? 0) + 1)
    }
    const seen = new Set<string>()
    const issues: number[] = []
    days.forEach((day, index) => {
      if (!day.weekday) {
        issues.push(index)
        return
      }
      if ((counts.get(day.weekday) ?? 0) > 1 && seen.has(day.weekday)) {
        issues.push(index)
      }
      seen.add(day.weekday)
    })
    return issues
  }, [days, scheduleMode])

  const isFixed = scheduleMode === ScheduleMode.FIXED_WEEKDAYS

  const hasLibrary = Boolean(exerciseLibrary && exerciseLibrary.length > 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{t.trainingSplit.days}</Label>
        <span className="text-xs text-muted-foreground">
          {days.length} / {MAX_TRAINING_DAYS}
        </span>
      </div>

      {days.map((day, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="h-7 px-3">
              {t.trainingSplit.dayPrefix} {index + 1}
            </Badge>
            <div className="ms-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t.trainingSplit.moveDayUp}
                disabled={disabled || index === 0}
                onClick={() => handleMove(index, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t.trainingSplit.moveDayDown}
                disabled={disabled || index === days.length - 1}
                onClick={() => handleMove(index, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${t.trainingSplit.removeDay} ${index + 1}`}
                disabled={disabled || days.length <= 1}
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "space-y-2",
              isFixed && "grid gap-2 sm:grid-cols-2 sm:space-y-0"
            )}
          >
            <div className="space-y-2">
              <Label>{t.trainingSplit.focus}</Label>
              <Select
                value={day.focus}
                disabled={disabled}
                onValueChange={(value) =>
                  handleFocusChange(index, value as TrainingDayFocus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.trainingSplit.selectFocus} />
                </SelectTrigger>
                <SelectContent>
                  {DAY_FOCUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isFixed ? (
              <div className="space-y-2">
                <Label>{t.trainingSplit.weekday}</Label>
                <Select
                  value={day.weekday ?? ""}
                  disabled={disabled}
                  onValueChange={(value) =>
                    handleWeekdayChange(index, value as Weekday)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.trainingSplit.selectWeekday} />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_CYCLE.map((weekday) => (
                      <SelectItem key={weekday} value={weekday}>
                        {lookup(t, `trainingSplit.weekdays.${weekday}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {weekdayIssueIndexes.includes(index) ? (
                  <p className="text-xs text-destructive">
                    {day.weekday
                      ? t.trainingSplit.duplicateWeekday
                      : t.trainingSplit.weekdayRequired}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {day.focus === "CUSTOM" ? (
            <div className="space-y-2">
              <Label>{t.trainingSplit.customFocus}</Label>
              <Input
                placeholder={t.trainingSplit.dayFocusPlaceholder}
                disabled={disabled}
                value={day.customFocus ?? ""}
                onChange={(e) => handleCustomFocusChange(index, e.target.value)}
              />
              {invalidCustomIndexes.includes(index) ? (
                <p className="text-sm text-destructive">
                  {t.trainingSplit.customFocusRequired}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>{t.trainingSplit.notes}</Label>
            <Input
              placeholder={t.trainingSplit.dayNotesPlaceholder}
              disabled={disabled}
              value={day.notes ?? ""}
              onChange={(e) => handleNotesChange(index, e.target.value)}
            />
          </div>

          {hasLibrary ? (
            <div className="space-y-2 rounded-lg bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t.trainingSplit.exercises}</Label>
                <span className="text-xs text-muted-foreground">
                  {(day.exercises ?? []).length} / {MAX_EXERCISES_PER_DAY}
                </span>
              </div>

              {(day.exercises ?? []).map((exercise, exIndex) => (
                <div
                  key={exIndex}
                  className="space-y-2 rounded-lg border bg-background p-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <ExercisePicker
                      value={exercise.exerciseId ?? null}
                      exercises={exerciseLibrary ?? []}
                      disabled={disabled}
                      onSelect={(option) => {
                        if (option) {
                          handleExerciseSelect(index, exIndex, option)
                          onExerciseAdded?.(index, option)
                        }
                      }}
                    />
                    <Input
                      placeholder={t.trainingSplit.exerciseName}
                      disabled={disabled}
                      value={exercise.exerciseName}
                      onChange={(e) =>
                        handleExerciseField(
                          index,
                          exIndex,
                          "exerciseName",
                          e.target.value
                        )
                      }
                      className="min-w-0 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t.trainingSplit.removeExercise}
                      disabled={disabled}
                      onClick={() => handleRemoveExercise(index, exIndex)}
                    >
                      <X className="size-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">{t.trainingSplit.targetSets}</Label>
                      <Input
                        type="number"
                        min={1}
                        disabled={disabled}
                        value={exercise.targetSets ?? ""}
                        onChange={(e) =>
                          handleExerciseField(
                            index,
                            exIndex,
                            "targetSets",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.trainingSplit.targetReps}</Label>
                      <Input
                        type="number"
                        min={1}
                        disabled={disabled}
                        value={exercise.targetReps ?? ""}
                        onChange={(e) =>
                          handleExerciseField(
                            index,
                            exIndex,
                            "targetReps",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.trainingSplit.targetWeightKg}</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        disabled={disabled}
                        value={exercise.targetWeightKg ?? ""}
                        onChange={(e) =>
                          handleExerciseField(
                            index,
                            exIndex,
                            "targetWeightKg",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.trainingSplit.restSeconds}</Label>
                      <Input
                        type="number"
                        min={0}
                        disabled={disabled}
                        value={exercise.restSeconds ?? ""}
                        onChange={(e) =>
                          handleExerciseField(
                            index,
                            exIndex,
                            "restSeconds",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <Input
                    placeholder={t.trainingSplit.exerciseNotesPlaceholder}
                    disabled={disabled}
                    value={exercise.notes ?? ""}
                    onChange={(e) =>
                      handleExerciseField(
                        index,
                        exIndex,
                        "notes",
                        e.target.value
                      )
                    }
                  />
                  <Input
                    placeholder={t.clients.videoLink}
                    disabled={disabled}
                    value={exercise.videoUrl ?? ""}
                    onChange={(e) =>
                      handleExerciseField(
                        index,
                        exIndex,
                        "videoUrl",
                        e.target.value
                      )
                    }
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  disabled ||
                  (day.exercises ?? []).length >= MAX_EXERCISES_PER_DAY
                }
                onClick={() => handleAddExercise(index)}
              >
                <Plus className="size-4" />
                {t.trainingSplit.addExercise}
              </Button>
            </div>
          ) : null}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || days.length >= MAX_TRAINING_DAYS}
        onClick={handleAdd}
      >
        <Plus className="size-4" />
        {t.trainingSplit.addDay}
      </Button>
    </div>
  )
}
