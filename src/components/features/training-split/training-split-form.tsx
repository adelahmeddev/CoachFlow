"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CalendarRange, SlidersHorizontal, Calendar } from "lucide-react"
import {
  trainingSplitSchema,
  type TrainingSplitDayInput,
  type TrainingSplitInput,
} from "@/lib/validations/training-split"
import {
  SPLIT_TYPE_OPTIONS,
  SPLIT_TYPE_DEFAULT_TEMPLATES,
  PLAN_STATUS_OPTIONS,
} from "@/lib/constants"
import { autoAssignWeekdays } from "@/lib/calculations/week-schedule"
import {
  createTrainingSplitAction,
  updateTrainingSplitAction,
} from "@/server/actions/training-split"
import {
  PlanStatus,
  ScheduleMode,
  SplitType,
  TrainingDayFocus,
  Weekday,
  WeekStartDay,
  Goal,
} from "@/lib/db/enums"
import {
  DaysEditor,
  toExerciseDraft,
} from "@/components/features/training-split/days-editor"
import {
  findConflicts,
  suggestAlternative,
  type ExerciseOption,
  type PainFlags,
} from "@/lib/exercise-safety"
import {
  SafetyWarningDialog,
  type ConflictResolution,
} from "@/components/features/training-split/safety-warning-dialog"
import { GlassCard } from "./liquid-glass/glass-card"
import { GlassConfirmDialog } from "./liquid-glass/glass-confirm-dialog"
import { SplitStarterHub } from "./split-starter-hub"
import { LiveVolumeRadar } from "./live-volume-radar"
import { FloatingBuilderDock } from "./floating-builder-dock"
import type { TemplatePreviewData } from "./template-preview-drawer"

interface TrainingSplitFormProps {
  clientId: string
  exercises: ExerciseOption[]
  templates: {
    id: string
    name: string
    goal: Goal | null
    level: string | null
    splitType: SplitType
    daysPerWeek: number
    description: string | null
    days: {
      focus: TrainingDayFocus
      customFocus: string | null
      exercises: {
        exerciseId: string | null
        exerciseName: string
        targetSets: number | null
        targetReps: number | null
        targetWeightKg: number | null
        restSeconds: number | null
        notes: string | null
        videoUrl: string | null
      }[]
    }[]
  }[]
  cloneSources: {
    id: string
    client: { fullName: string | null }
    splitType: SplitType
    days: {
      focus: TrainingDayFocus
      customFocus: string | null
      exercises: {
        exerciseId: string | null
        exerciseName: string
        targetSets: number | null
        targetReps: number | null
        targetWeightKg: number | null
        restSeconds: number | null
        notes: string | null
        videoUrl: string | null
      }[]
    }[]
  }[]
  split?: {
    id: string
    splitType: SplitType
    scheduleMode: ScheduleMode
    status: PlanStatus
    notes: string | null
    days: {
      id: string
      dayNumber: number
      weekday: Weekday | null
      focus: TrainingDayFocus
      customFocus: string | null
      notes: string | null
      exercises: {
        id: string
        exerciseId: string | null
        exerciseName: string
        targetSets: number | null
        targetReps: number | null
        targetWeightKg: number | null
        restSeconds: number | null
        notes: string | null
        videoUrl: string | null
      }[]
    }[]
  }
  painFlags?: PainFlags | null
  weekStartDay?: WeekStartDay
}

function splitDaysToInputs(
  split: TrainingSplitFormProps["split"]
): TrainingSplitDayInput[] {
  if (!split) {
    const defaultTemplate =
      SPLIT_TYPE_DEFAULT_TEMPLATES[SplitType.FULL_BODY]
    return defaultTemplate.days.map((focus) => ({
      focus,
      customFocus: "",
      notes: "",
      exercises: [],
    }))
  }

  return split.days.map((day) => ({
    focus: day.focus,
    customFocus: day.customFocus ?? "",
    notes: day.notes ?? "",
    weekday: day.weekday ?? null,
    exercises: day.exercises.map((exercise) =>
      toExerciseDraft({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        targetWeightKg: exercise.targetWeightKg,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
        videoUrl: exercise.videoUrl,
      })
    ),
  }))
}

export function TrainingSplitForm({
  clientId,
  exercises,
  templates,
  cloneSources,
  split,
  painFlags,
  weekStartDay = WeekStartDay.SAT,
}: TrainingSplitFormProps) {
  const router = useRouter()
  const { t } = useI18n()
  const isEdit = Boolean(split)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [splitType, setSplitType] = useState<SplitType | undefined>(
    split?.splitType
  )
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(
    split?.scheduleMode ?? ScheduleMode.FIXED_WEEKDAYS
  )
  const [days, setDays] = useState<TrainingSplitDayInput[]>(
    splitDaysToInputs(split)
  )
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([])

  // Modal confirmation for replacing custom exercises
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pendingOverwriteAction, setPendingOverwriteAction] = useState<(() => void) | null>(null)

  // Auto assign confirmation dialog
  const [autoAssignConfirmOpen, setAutoAssignConfirmOpen] = useState(false)

  const exerciseMap = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises]
  )

  function withAssignedWeekdays(
    nextDays: TrainingSplitDayInput[]
  ): TrainingSplitDayInput[] {
    const assigned = autoAssignWeekdays(nextDays.length, weekStartDay)
    return nextDays.map((day, index) => ({
      ...day,
      weekday: assigned[index] ?? null,
    }))
  }

  const setDaysSynced = (
    nextDays: TrainingSplitDayInput[] | ((prev: TrainingSplitDayInput[]) => TrainingSplitDayInput[])
  ) => {
    const resolved = typeof nextDays === "function" ? nextDays(days) : nextDays
    setDays(resolved)
    form.setValue("days", resolved, { shouldValidate: true })
  }

  function handleAutoAssign() {
    setDaysSynced(withAssignedWeekdays(days))
  }

  function handleScheduleModeChange(value: ScheduleMode) {
    if (value === scheduleMode) return
    setScheduleMode(value)
    form.setValue("scheduleMode", value, { shouldValidate: false })
    if (value === ScheduleMode.FIXED_WEEKDAYS) {
      const missing = days.some((day) => !day.weekday)
      if (missing) {
        handleAutoAssign()
      }
    }
  }

  const form = useForm<TrainingSplitInput>({
    resolver: zodResolver(trainingSplitSchema) as Resolver<TrainingSplitInput>,
    defaultValues: {
      splitType: split?.splitType ?? undefined,
      status: split?.status ?? PlanStatus.ACTIVE,
      notes: split?.notes ?? "",
      days: splitDaysToInputs(split),
    },
  })

  const status = form.watch("status")

  const hasExistingExercises = useMemo(() => {
    return days.some((d) => (d.exercises?.length ?? 0) > 0)
  }, [days])

  function checkSafety(nextDays: TrainingSplitDayInput[]) {
    if (!painFlags) return
    const found = findConflicts(nextDays, exerciseMap, painFlags)
    if (found.length === 0) {
      setConflicts([])
      return
    }
    setConflicts(
      found.map((conflict) => ({
        ...conflict,
        suggestion: suggestAlternative(conflict.exerciseId, exerciseMap, painFlags),
      }))
    )
  }

  function applyDays(nextDays: TrainingSplitDayInput[], splitTypeValue: SplitType) {
    const resolved =
      scheduleMode === ScheduleMode.FIXED_WEEKDAYS
        ? withAssignedWeekdays(nextDays)
        : nextDays
    setDaysSynced(resolved)
    setSplitType(splitTypeValue)
    form.setValue("splitType", splitTypeValue, { shouldValidate: false })
    checkSafety(resolved)
  }

  function executeOrConfirm(action: () => void) {
    if (hasExistingExercises) {
      setPendingOverwriteAction(() => action)
      setConfirmModalOpen(true)
    } else {
      action()
    }
  }

  function handleSplitTypeChange(value: SplitType) {
    const template = SPLIT_TYPE_DEFAULT_TEMPLATES[value]
    if (!template) {
      setSplitType(value)
      form.setValue("splitType", value, { shouldValidate: false })
      return
    }

    executeOrConfirm(() => {
      const nextDays: TrainingSplitDayInput[] = template.days.map((focus) => ({
        focus,
        customFocus: "",
        notes: "",
        exercises: [],
      }))
      applyDays(nextDays, value)
    })
  }

  function handlePresetSelect(presetType: SplitType) {
    handleSplitTypeChange(presetType)
  }

  function handleTemplateApply(template: TemplatePreviewData) {
    executeOrConfirm(() => {
      const nextDays: TrainingSplitDayInput[] = template.days.map((day) => ({
        focus: day.focus,
        customFocus: day.customFocus ?? "",
        notes: "",
        exercises: (day.exercises ?? []).map((ex) => toExerciseDraft(ex)),
      }))
      applyDays(nextDays, template.splitType)
    })
  }

  function handleCloneApply(splitId: string) {
    const source = cloneSources.find((item) => item.id === splitId)
    if (!source) return
    executeOrConfirm(() => {
      const nextDays: TrainingSplitDayInput[] = source.days.map((day) => ({
        focus: day.focus,
        customFocus: day.customFocus ?? "",
        notes: "",
        exercises: day.exercises.map((exercise) => toExerciseDraft(exercise)),
      }))
      applyDays(nextDays, source.splitType)
    })
  }

  function handleReplace(conflict: ConflictResolution) {
    if (!conflict.suggestion) return
    setDaysSynced((current: TrainingSplitDayInput[]): TrainingSplitDayInput[] =>
      current.map((day, dayIndex) =>
        dayIndex === conflict.dayIndex
          ? {
              ...day,
              exercises: (day.exercises ?? []).map((exercise, exIndex) =>
                exIndex === conflict.exerciseIndex
                  ? {
                      ...exercise,
                      exerciseId: conflict.suggestion!.id,
                      exerciseName: conflict.suggestion!.name,
                      targetSets:
                        conflict.suggestion!.defaultSets != null &&
                        !exercise.targetSets
                          ? String(conflict.suggestion!.defaultSets)
                          : exercise.targetSets,
                      targetReps:
                        conflict.suggestion!.defaultReps != null &&
                        !exercise.targetReps
                          ? String(conflict.suggestion!.defaultReps)
                          : exercise.targetReps,
                      restSeconds:
                        conflict.suggestion!.defaultRestSeconds != null &&
                        !exercise.restSeconds
                          ? String(conflict.suggestion!.defaultRestSeconds)
                          : exercise.restSeconds,
                    }
                  : exercise
              ),
            }
          : day
      )
    )
    setConflicts((current) =>
      current.filter(
        (item) =>
          !(
            item.dayIndex === conflict.dayIndex &&
            item.exerciseIndex === conflict.exerciseIndex
          )
      )
    )
  }

  function handleKeep(conflict: ConflictResolution) {
    setConflicts((current) =>
      current.filter(
        (item) =>
          !(
            item.dayIndex === conflict.dayIndex &&
            item.exerciseIndex === conflict.exerciseIndex
          )
      )
    )
  }

  function handleExerciseAdded(dayIndex: number, exercise: ExerciseOption) {
    if (!painFlags) return
    const conflictsForExercise = findConflicts(
      [{ exercises: [{ exerciseId: exercise.id, exerciseName: exercise.name }] }],
      exerciseMap,
      painFlags
    )
    if (conflictsForExercise.length > 0) {
      setConflicts((current) => [
        ...current,
        ...conflictsForExercise.map((conflict) => ({
          ...conflict,
          dayIndex,
          suggestion: suggestAlternative(conflict.exerciseId, exerciseMap, painFlags),
        })),
      ])
    }
  }

  async function onSubmit() {
    setIsSubmitting(true)
    setServerError(null)

    const payload: TrainingSplitInput = {
      splitType: splitType as SplitType,
      scheduleMode,
      status,
      notes: form.getValues("notes") || undefined,
      days: days.map((day) => ({
        focus: day.focus,
        customFocus: day.customFocus?.trim() || undefined,
        notes: day.notes?.trim() || undefined,
        weekday:
          scheduleMode === ScheduleMode.FIXED_WEEKDAYS
            ? day.weekday ?? null
            : null,
        exercises: (day.exercises ?? []).map((exercise) => ({
          exerciseId: exercise.exerciseId ?? null,
          exerciseName: exercise.exerciseName.trim(),
          targetSets: exercise.targetSets,
          targetReps: exercise.targetReps,
          targetWeightKg: exercise.targetWeightKg,
          restSeconds: exercise.restSeconds,
          notes: exercise.notes?.trim() || null,
          videoUrl: exercise.videoUrl?.trim() || null,
        })),
      })),
    }

    try {
      const result = isEdit && split
        ? await updateTrainingSplitAction(clientId, split.id, payload)
        : await createTrainingSplitAction(clientId, payload)

      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              if (field === "days") {
                toast.error(errors[0] ?? t.toasts.invalidTrainingDays)
              } else {
                form.setError(field as "splitType" | "status" | "notes", {
                  type: "server",
                  message: errors[0],
                })
              }
            }
          })
        }
        if ("error" in result && result.error) {
          setServerError(result.error)
        }
        return
      }

      toast.success(
        isEdit ? t.trainingSplit.updatedToast : t.trainingSplit.createdToast
      )
      router.push(`/clients/${clientId}?tab=training-split`)
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

  const totalExercisesCount = useMemo(() => {
    return days.reduce((acc, d) => acc + (d.exercises?.length ?? 0), 0)
  }, [days])

  return (
    <form
      onSubmit={form.handleSubmit(() => onSubmit())}
      className="space-y-6 pb-20"
    >
      {/* Safety Warning Dialog */}
      <SafetyWarningDialog
        open={conflicts.length > 0}
        conflicts={conflicts}
        onReplace={handleReplace}
        onKeep={handleKeep}
      />

      {/* Confirmation Dialog for Overwriting Existing Split */}
      <GlassConfirmDialog
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title="Replace Current Split Structure?"
        description="You have already added exercises to this split. Loading a new preset or template will replace your current days and exercise list."
        confirmLabel="Replace & Apply"
        cancelLabel="Keep Current Work"
        destructive={true}
        onConfirm={() => {
          pendingOverwriteAction?.()
          setPendingOverwriteAction(null)
        }}
      />

      {/* Auto Assign Confirmation Dialog */}
      <GlassConfirmDialog
        open={autoAssignConfirmOpen}
        onOpenChange={setAutoAssignConfirmOpen}
        title={t.trainingSplit.autoAssignDays}
        description={t.trainingSplit.autoAssignConfirm}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
        onConfirm={handleAutoAssign}
      />

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* 1. Split Starter Hub (Presets, Templates, Clones) */}
      <SplitStarterHub
        templates={templates}
        cloneSources={cloneSources}
        activeSplitType={splitType}
        hasExistingExercises={hasExistingExercises}
        onSelectPreset={handlePresetSelect}
        onSelectTemplate={handleTemplateApply}
        onSelectClone={handleCloneApply}
      />

      {/* 2. Split Meta & Details (GlassCard) */}
      <GlassCard variant="neutral" className="p-5" showSheen={true}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <SlidersHorizontal className="size-4 text-brand-400" />
          <h3 className="text-sm font-bold tracking-wide">
            {t.trainingSplit.details}
          </h3>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="splitType" className="text-xs font-semibold">
                {t.trainingSplit.splitType}
              </Label>
              <Select
                value={splitType}
                onValueChange={(value) =>
                  handleSplitTypeChange(value as SplitType)
                }
              >
                <SelectTrigger id="splitType" className="w-full rounded-xl border-white/15 bg-white/[0.04] backdrop-blur-md">
                  <SelectValue placeholder={t.trainingSplit.selectSplitType} />
                </SelectTrigger>
                <SelectContent>
                  {SPLIT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.splitType && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.splitType.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">
                {t.trainingSplit.status}
              </Label>
              <Select
                value={status}
                onValueChange={(value) => form.setValue("status", value as PlanStatus)}
              >
                <SelectTrigger id="status" className="w-full rounded-xl border-white/15 bg-white/[0.04] backdrop-blur-md">
                  <SelectValue placeholder={t.trainingSplit.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {t.trainingSplit.activeStatusHint}
              </p>
            </div>
          </div>

          {/* Schedule Mode Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t.trainingSplit.scheduleMode}</Label>
            <div
              role="radiogroup"
              aria-label={t.trainingSplit.scheduleMode}
              className="grid gap-3 sm:grid-cols-2"
            >
              <button
                type="button"
                role="radio"
                aria-checked={scheduleMode === ScheduleMode.FIXED_WEEKDAYS}
                disabled={isSubmitting}
                onClick={() =>
                  handleScheduleModeChange(ScheduleMode.FIXED_WEEKDAYS)
                }
                className={cn(
                  "rounded-2xl border p-3.5 text-start transition-all backdrop-blur-md",
                  scheduleMode === ScheduleMode.FIXED_WEEKDAYS
                    ? "border-brand-400/80 bg-brand-500/15 ring-1 ring-brand-400/40 shadow-glow"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                )}
              >
                <span className="block text-xs font-bold text-foreground">
                  {t.trainingSplit.scheduleModeFixed}
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground leading-snug">
                  {t.trainingSplit.scheduleModeFixedHint}
                </span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={scheduleMode === ScheduleMode.SEQUENTIAL}
                disabled={isSubmitting}
                onClick={() =>
                  handleScheduleModeChange(ScheduleMode.SEQUENTIAL)
                }
                className={cn(
                  "rounded-2xl border p-3.5 text-start transition-all backdrop-blur-md",
                  scheduleMode === ScheduleMode.SEQUENTIAL
                    ? "border-brand-400/80 bg-brand-500/15 ring-1 ring-brand-400/40 shadow-glow"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                )}
              >
                <span className="block text-xs font-bold text-foreground">
                  {t.trainingSplit.scheduleModeSequential}
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground leading-snug">
                  {t.trainingSplit.scheduleModeSequentialHint}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">
              {t.trainingSplit.notes}
            </Label>
            <Textarea
              id="notes"
              placeholder={t.trainingSplit.splitNotesPlaceholder}
              rows={2}
              className="rounded-xl border-white/15 bg-white/[0.04] backdrop-blur-md text-xs"
              {...form.register("notes")}
            />
            {form.formState.errors.notes && (
              <p className="text-xs text-destructive">
                {form.formState.errors.notes.message}
              </p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 3. Live Muscle Volume Radar */}
      <LiveVolumeRadar days={days} exerciseLibrary={exercises} />

      {/* 4. Weekly Schedule Days Editor */}
      <GlassCard variant="neutral" className="p-5" showSheen={true}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-brand-400" />
            <h3 className="text-sm font-bold tracking-wide">
              {t.trainingSplit.weeklySchedule}
            </h3>
          </div>

          {scheduleMode === ScheduleMode.FIXED_WEEKDAYS && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={isSubmitting || days.length === 0}
              onClick={() => setAutoAssignConfirmOpen(true)}
              className="h-7 rounded-xl text-xs gap-1.5 border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
            >
              <CalendarRange className="size-3.5" />
              <span>{t.trainingSplit.autoAssignDays}</span>
            </Button>
          )}
        </div>

        <DaysEditor
          days={days}
          disabled={isSubmitting}
          onChange={setDaysSynced}
          exerciseLibrary={exercises}
          onExerciseAdded={handleExerciseAdded}
          scheduleMode={scheduleMode}
        />
      </GlassCard>

      {/* 5. Floating Builder Dock (Always accessible) */}
      <FloatingBuilderDock
        daysCount={days.length}
        exercisesCount={totalExercisesCount}
        conflictCount={conflicts.length}
        isSubmitting={isSubmitting}
        isEdit={isEdit}
        onAddDay={() => {
          if (days.length < 7) {
            setDaysSynced([
              ...days,
              {
                focus: TrainingDayFocus.CUSTOM,
                customFocus: "",
                notes: "",
                exercises: [],
              },
            ])
          }
        }}
        onSave={() => form.handleSubmit(() => onSubmit())()}
        onCancel={() => router.push(`/clients/${clientId}?tab=training-split`)}
      />
    </form>
  )
}
