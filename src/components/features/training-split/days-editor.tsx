"use client"

import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Sparkles,
  Zap,
  Magnet,
  Footprints,
  PersonStanding,
  Activity,
  HeartPulse,
  Wind,
  MoonStar,
  Bike,
  Layers,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
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
import { DAY_FOCUS_OPTIONS, MAX_TRAINING_DAYS } from "@/lib/constants"
import type { TrainingSplitDayInput } from "@/lib/validations/training-split"
import type { SplitDayExerciseInput } from "@/lib/validations/exercise"
import { MAX_EXERCISES_PER_DAY } from "@/lib/validations/exercise"
import type { TrainingDayFocus, Weekday } from "@/lib/db/enums"
import { ScheduleMode } from "@/lib/db/enums"
import { BatchExercisePicker } from "@/components/features/training-split/batch-exercise-picker"
import { WeekdayStripSelector } from "@/components/features/training-split/weekday-strip-selector"
import { GlassCard } from "./liquid-glass/glass-card"
import type { ExerciseOption } from "@/lib/exercise-safety"

interface DaysEditorProps {
  days: TrainingSplitDayInput[]
  disabled?: boolean
  onChange: (days: TrainingSplitDayInput[]) => void
  exerciseLibrary?: ExerciseOption[]
  onExerciseAdded?: (dayIndex: number, exercise: ExerciseOption) => void
  scheduleMode?: ScheduleMode
}

const FOCUS_ICONS: Record<string, LucideIcon> = {
  UPPER: Dumbbell,
  LOWER: Footprints,
  FULL_BODY: PersonStanding,
  PUSH: Zap,
  PULL: Magnet,
  LEGS: Bike,
  SHOULDERS_ARMS: Activity,
  CARDIO: HeartPulse,
  MOBILITY: Wind,
  CUSTOM: Sparkles,
  REST: MoonStar,
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
  exerciseLibrary = [],
  onExerciseAdded,
  scheduleMode = ScheduleMode.FIXED_WEEKDAYS,
}: DaysEditorProps) {
  const { t } = useI18n()
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({})
  const [batchPickerDayIndex, setBatchPickerDayIndex] = useState<number | null>(null)
  const [singlePickerTarget, setSinglePickerTarget] = useState<{
    dayIndex: number
    exerciseIndex: number
  } | null>(null)

  function toggleCollapse(index: number) {
    setCollapsedDays((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  function updateDays(next: TrainingSplitDayInput[]) {
    onChange(next)
  }

  function handleWeekdayChange(index: number, weekday: Weekday) {
    const next = days.map((day, i) =>
      i === index ? { ...day, weekday } : { ...day }
    )
    updateDays(next)
  }

  function handleWeekdaySwap(fromIndex: number, toIndex: number) {
    const next = days.map((day) => ({ ...day }))
    const fromDay = next[fromIndex]
    const toDay = next[toIndex]
    if (!fromDay || !toDay) return
    const temp = fromDay.weekday
    fromDay.weekday = toDay.weekday
    toDay.weekday = temp
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
                : "3",
            targetReps: current?.targetReps
              ? current.targetReps
              : exercise.defaultReps != null
                ? String(exercise.defaultReps)
                : "10",
            restSeconds: current?.restSeconds
              ? current.restSeconds
              : exercise.defaultRestSeconds != null
                ? String(exercise.defaultRestSeconds)
                : "90",
            videoUrl: current?.videoUrl
              ? current.videoUrl
              : exercise.youtubeUrl ?? "",
          }
        : ex
    )
    updateDayExercises(dayIndex, nextExercises)
  }

  function handleBatchAddExercises(
    dayIndex: number,
    selectedOptions: ExerciseOption[]
  ) {
    const day = days[dayIndex]
    if (!day) return
    const currentExercises = day.exercises ?? []
    const newItems: SplitDayExerciseInput[] = selectedOptions.map((opt) => ({
      exerciseId: opt.id,
      exerciseName: opt.name,
      targetSets: opt.defaultSets != null ? String(opt.defaultSets) : "3",
      targetReps: opt.defaultReps != null ? String(opt.defaultReps) : "10",
      targetWeightKg: "",
      restSeconds: opt.defaultRestSeconds != null ? String(opt.defaultRestSeconds) : "90",
      notes: "",
      videoUrl: opt.youtubeUrl ?? "",
    }))

    const combined = [...currentExercises, ...newItems].slice(0, MAX_EXERCISES_PER_DAY)
    updateDayExercises(dayIndex, combined)

    selectedOptions.forEach((opt) => onExerciseAdded?.(dayIndex, opt))
  }

  function handleMoveExercise(
    dayIndex: number,
    exerciseIndex: number,
    direction: -1 | 1
  ) {
    const day = days[dayIndex]
    if (!day) return
    const exercises = [...(day.exercises ?? [])]
    const target = exerciseIndex + direction
    if (target < 0 || target >= exercises.length) return
    ;[exercises[exerciseIndex], exercises[target]] = [
      exercises[target],
      exercises[exerciseIndex],
    ]
    updateDayExercises(dayIndex, exercises)
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

  function handleAddBlankExercise(dayIndex: number) {
    const day = days[dayIndex]
    if (!day) return
    updateDayExercises(dayIndex, [
      ...(day.exercises ?? []),
      {
        exerciseId: null,
        exerciseName: "",
        targetSets: "3",
        targetReps: "10",
        targetWeightKg: "",
        restSeconds: "90",
        notes: "",
        videoUrl: "",
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

  const isFixed = scheduleMode === ScheduleMode.FIXED_WEEKDAYS
  const hasLibrary = Boolean(exerciseLibrary && exerciseLibrary.length > 0)

  const allAssigned = useMemo(() => {
    return days.map((day, index) => ({ index, weekday: day.weekday }))
  }, [days])

  return (
    <div className="space-y-4">
      {/* Batch Exercise Picker Modal */}
      {batchPickerDayIndex !== null && (
        <BatchExercisePicker
          open={batchPickerDayIndex !== null}
          onOpenChange={(open) => !open && setBatchPickerDayIndex(null)}
          exercises={exerciseLibrary}
          dayNumber={batchPickerDayIndex + 1}
          mode="batch"
          onSelectBatch={(selected) => {
            handleBatchAddExercises(batchPickerDayIndex, selected)
            setBatchPickerDayIndex(null)
          }}
        />
      )}

      {/* Single Exercise Picker Modal */}
      {singlePickerTarget !== null && (
        <BatchExercisePicker
          open={singlePickerTarget !== null}
          onOpenChange={(open) => !open && setSinglePickerTarget(null)}
          exercises={exerciseLibrary}
          dayNumber={singlePickerTarget.dayIndex + 1}
          mode="single"
          initialSelectedIds={
            days[singlePickerTarget.dayIndex]?.exercises?.[singlePickerTarget.exerciseIndex]?.exerciseId
              ? [days[singlePickerTarget.dayIndex]!.exercises![singlePickerTarget.exerciseIndex]!.exerciseId!]
              : []
          }
          onSelectSingle={(option) => {
            handleExerciseSelect(singlePickerTarget.dayIndex, singlePickerTarget.exerciseIndex, option)
            onExerciseAdded?.(singlePickerTarget.dayIndex, option)
            setSinglePickerTarget(null)
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-bold tracking-wide">
            {t.trainingSplit.days}
          </Label>
          <Badge variant="outline" className="border-white/15 text-xs">
            {days.length} / {MAX_TRAINING_DAYS}
          </Badge>
        </div>
      </div>

      {days.map((day, index) => {
        const isCollapsed = Boolean(collapsedDays[index])
        const FocusIcon = FOCUS_ICONS[day.focus] ?? Sparkles
        const exerciseCount = (day.exercises ?? []).length
        const totalSets = (day.exercises ?? []).reduce(
          (acc, ex) => acc + (Number(ex.targetSets) || 3),
          0
        )

        return (
          <GlassCard
            key={index}
            variant={day.focus}
            className="p-4 transition-all duration-200"
            showSheen={true}
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="h-7 px-2.5 font-bold tracking-wider bg-white/10 text-white"
                >
                  {t.trainingSplit.dayPrefix} {index + 1}
                </Badge>

                <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs">
                  <FocusIcon className="size-3.5 text-brand-300" />
                  <span className="font-semibold text-foreground/90">
                    {day.focus === "CUSTOM"
                      ? day.customFocus || lookup(t, "trainingSplit.dayFocus.custom")
                      : lookup(t, `trainingSplit.dayFocus.${day.focus.toLowerCase()}`) ?? day.focus}
                  </span>
                </div>

                <span className="text-xs text-muted-foreground hidden sm:inline">
                  • {exerciseCount} {t.trainingSplit.exercises} ({totalSets} Sets)
                </span>
              </div>

              {/* Day card controls */}
              <div className="flex items-center gap-1 ms-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t.trainingSplit.moveDayUp}
                  disabled={disabled || index === 0}
                  onClick={() => handleMove(index, -1)}
                  className="size-7 text-muted-foreground hover:text-foreground"
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t.trainingSplit.moveDayDown}
                  disabled={disabled || index === days.length - 1}
                  onClick={() => handleMove(index, 1)}
                  className="size-7 text-muted-foreground hover:text-foreground"
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${t.trainingSplit.removeDay} ${index + 1}`}
                  disabled={disabled || days.length <= 1}
                  onClick={() => handleRemove(index)}
                  className="size-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={isCollapsed ? "Expand" : "Collapse"}
                  onClick={() => toggleCollapse(index)}
                  className="size-7 text-muted-foreground hover:text-foreground"
                >
                  {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                </Button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="mt-3 space-y-4 border-t border-white/10 pt-3">
                {/* Fixed Weekday Strip Selector */}
                {isFixed && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <WeekdayStripSelector
                      value={day.weekday}
                      allAssigned={allAssigned}
                      currentIndex={index}
                      disabled={disabled}
                      onChange={(w) => handleWeekdayChange(index, w)}
                      onSwap={(fromIdx, toIdx) => handleWeekdaySwap(fromIdx, toIdx)}
                    />
                  </div>
                )}

                {/* Focus selection */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t.trainingSplit.focus}</Label>
                    <Select
                      value={day.focus}
                      disabled={disabled}
                      onValueChange={(value) =>
                        handleFocusChange(index, value as TrainingDayFocus)
                      }
                    >
                      <SelectTrigger className="w-full rounded-xl border-white/15 bg-white/[0.04]">
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

                  {day.focus === "CUSTOM" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{t.trainingSplit.customFocus}</Label>
                      <Input
                        placeholder={t.trainingSplit.dayFocusPlaceholder}
                        disabled={disabled}
                        value={day.customFocus ?? ""}
                        onChange={(e) => handleCustomFocusChange(index, e.target.value)}
                        className="rounded-xl border-white/15 bg-white/[0.04]"
                      />
                      {invalidCustomIndexes.includes(index) && (
                        <p className="text-xs text-destructive">
                          {t.trainingSplit.customFocusRequired}
                        </p>
                      )}
                    </div>
                  )}

                  <div className={cn("space-y-1.5", day.focus !== "CUSTOM" && "sm:col-span-1")}>
                    <Label className="text-xs font-semibold">{t.trainingSplit.notes}</Label>
                    <Input
                      placeholder={t.trainingSplit.dayNotesPlaceholder}
                      disabled={disabled}
                      value={day.notes ?? ""}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      className="rounded-xl border-white/15 bg-white/[0.04]"
                    />
                  </div>
                </div>

                {/* Exercises section */}
                {hasLibrary && (
                  <div className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="size-3.5 text-brand-400" />
                        <Label className="text-xs font-bold tracking-wide">
                          {t.trainingSplit.exercises}
                        </Label>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ({exerciseCount} / {MAX_EXERCISES_PER_DAY})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          disabled={disabled || exerciseCount >= MAX_EXERCISES_PER_DAY}
                          onClick={() => setBatchPickerDayIndex(index)}
                          className="h-7 rounded-xl text-xs gap-1 border-brand-500/40 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20"
                        >
                          <Layers className="size-3" />
                          <span>Batch Add</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          disabled={disabled || exerciseCount >= MAX_EXERCISES_PER_DAY}
                          onClick={() => handleAddBlankExercise(index)}
                          className="h-7 rounded-xl text-xs gap-1 border-white/15 bg-white/[0.04]"
                        >
                          <Plus className="size-3" />
                          <span>Add Single</span>
                        </Button>
                      </div>
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-2">
                      {(day.exercises ?? []).map((exercise, exIndex) => {
                        const isFirst = exIndex === 0
                        const isLast = exIndex === (day.exercises?.length ?? 0) - 1

                        return (
                          <div
                            key={exIndex}
                            className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition-colors hover:border-white/20"
                          >
                            <div className="flex items-center gap-2">
                              {/* Reorder controls */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  disabled={disabled || isFirst}
                                  onClick={() => handleMoveExercise(index, exIndex, -1)}
                                  className="size-6 text-muted-foreground hover:text-foreground"
                                  title="Move exercise up"
                                >
                                  <ArrowUp className="size-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  disabled={disabled || isLast}
                                  onClick={() => handleMoveExercise(index, exIndex, 1)}
                                  className="size-6 text-muted-foreground hover:text-foreground"
                                  title="Move exercise down"
                                >
                                  <ArrowDown className="size-3" />
                                </Button>
                              </div>

                              {/* Exercise library picker */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={disabled}
                                onClick={() => setSinglePickerTarget({ dayIndex: index, exerciseIndex: exIndex })}
                                className="justify-start gap-1.5 font-normal h-8 text-xs max-w-[170px] shrink-0 border-white/15 bg-white/[0.04]"
                              >
                                <Dumbbell className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">
                                  {exercise.exerciseName || t.trainingSplit.selectExercise}
                                </span>
                              </Button>

                              {/* Name input */}
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
                                className="min-w-0 flex-1 h-8 rounded-xl border-white/10 bg-white/[0.04] text-xs"
                              />

                              {/* Remove button */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t.trainingSplit.removeExercise}
                                disabled={disabled}
                                onClick={() => handleRemoveExercise(index, exIndex)}
                                className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>

                            {/* Set / Rep / Weight / Rest Quick Inputs */}
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground font-semibold">
                                  {t.trainingSplit.targetSets}
                                </Label>
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
                                  className="h-7 rounded-lg border-white/10 bg-white/[0.03] text-xs font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground font-semibold">
                                  {t.trainingSplit.targetReps}
                                </Label>
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
                                  className="h-7 rounded-lg border-white/10 bg-white/[0.03] text-xs font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground font-semibold">
                                  {t.trainingSplit.targetWeightKg}
                                </Label>
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
                                  className="h-7 rounded-lg border-white/10 bg-white/[0.03] text-xs font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground font-semibold">
                                  {t.trainingSplit.restSeconds}
                                </Label>
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
                                  className="h-7 rounded-lg border-white/10 bg-white/[0.03] text-xs font-mono"
                                />
                              </div>
                            </div>

                            {/* Notes & Video URL */}
                            <div className="grid gap-2 sm:grid-cols-2">
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
                                className="h-7 rounded-lg border-white/10 bg-white/[0.03] text-[11px]"
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
                                className="h-7 rounded-lg border-white/10 bg-white/[0.03] text-[11px]"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        )
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || days.length >= MAX_TRAINING_DAYS}
        onClick={handleAdd}
        className="w-full rounded-2xl border-white/15 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md h-10 gap-2 font-semibold shadow-sm"
      >
        <Plus className="size-4" />
        {t.trainingSplit.addDay}
      </Button>
    </div>
  )
}
