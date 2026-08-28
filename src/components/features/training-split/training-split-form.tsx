"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CalendarRange, Loader2 } from "lucide-react"
import {
  trainingSplitSchema,
  type TrainingSplitDayInput,
  type TrainingSplitInput,
} from "@/lib/validations/training-split"
import {
  SPLIT_TYPE_OPTIONS,
  SPLIT_TYPE_DEFAULT_TEMPLATES,
} from "@/lib/constants/training-split"
import { autoAssignWeekdays } from "@/lib/calculations/week-schedule"
import {
  createTrainingSplitAction,
  updateTrainingSplitAction,
} from "@/server/actions/training-split"
import {
  PlanStatus,
  ScheduleMode,
  SplitType,
  Weekday,
  type Goal,
} from "@/generated/prisma/enums"
import type { TrainingSplit } from "@/generated/prisma/client"
import { PLAN_STATUS_OPTIONS } from "@/lib/constants"
import {
  DaysEditor,
  toExerciseDraft,
} from "@/components/features/training-split/days-editor"
import {
  SafetyWarningDialog,
  type ConflictResolution,
} from "@/components/features/training-split/safety-warning-dialog"
import {
  findConflicts,
  suggestAlternative,
  type ExerciseOption,
  type PainFlags,
} from "@/lib/exercise-safety"

interface FormExercise {
  exerciseId: string | null
  exerciseName: string
  targetSets: number | null
  targetReps: number | null
  targetWeightKg: number | null
  restSeconds: number | null
  notes: string | null
  videoUrl: string | null
}

interface FormDay {
  focus: TrainingSplitDayInput["focus"]
  customFocus: string | null
  exercises: FormExercise[]
}

export interface TemplateSource {
  id: string
  name: string
  goal: Goal | null
  daysPerWeek: number
  splitType: SplitType
  days: FormDay[]
}

export interface CloneSource {
  id: string
  splitType: SplitType
  client: { fullName: string | null }
  days: FormDay[]
}

interface TrainingSplitFormProps {
  clientId: string
  split?: TrainingSplit
  exercises: ExerciseOption[]
  templates?: TemplateSource[]
  cloneSources?: CloneSource[]
  painFlags?: PainFlags | null
  weekStartDay?: Weekday
}

function splitDaysToInputs(split: TrainingSplit | undefined): TrainingSplitDayInput[] {
  if (!split) return []
  const days = (split as TrainingSplit & { days?: unknown[] }).days ?? []
  return days.map((day) => ({
    focus: (day as { focus: TrainingSplitDayInput["focus"] }).focus,
    customFocus:
      (day as { customFocus?: string | null }).customFocus ?? "",
    notes: (day as { notes?: string | null }).notes ?? "",
    weekday:
      ((day as { weekday?: Weekday | null }).weekday as Weekday | null) ?? null,
    exercises: ((day as { exercises?: FormExercise[] }).exercises ?? []).map(
      (exercise) => toExerciseDraft(exercise)
    ),
  }))
}

export function TrainingSplitForm({
  clientId,
  split,
  exercises,
  templates = [],
  cloneSources = [],
  painFlags,
  weekStartDay = "SAT",
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

  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]))

  function withAssignedWeekdays(
    nextDays: TrainingSplitDayInput[]
  ): TrainingSplitDayInput[] {
    const assigned = autoAssignWeekdays(nextDays.length, weekStartDay)
    return nextDays.map((day, index) => ({
      ...day,
      weekday: assigned[index] ?? null,
    }))
  }

  // Sync form's days value with local state for validation.
  // In FIXED mode a day-count change re-runs auto-assign after confirmation.
  const setDaysSynced = (
    nextDays: TrainingSplitDayInput[] | ((prev: TrainingSplitDayInput[]) => TrainingSplitDayInput[])
  ) => {
    const resolved = typeof nextDays === "function" ? nextDays(days) : nextDays
    let final = resolved
    if (
      scheduleMode === ScheduleMode.FIXED_WEEKDAYS &&
      resolved.length !== days.length
    ) {
      if (window.confirm(t.trainingSplit.autoAssignConfirm)) {
        final = withAssignedWeekdays(resolved)
      }
    }
    setDays(final)
    form.setValue("days", final, { shouldValidate: true })
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

  function handleSplitTypeChange(value: SplitType) {
    setSplitType(value)
    form.setValue("splitType", value, { shouldValidate: false })
    const template = SPLIT_TYPE_DEFAULT_TEMPLATES[value]
    if (template) {
      let nextDays: TrainingSplitDayInput[] = template.days.map((focus) => ({
        focus,
        customFocus: "",
        notes: "",
        exercises: [],
      }))
      if (scheduleMode === ScheduleMode.FIXED_WEEKDAYS) {
        nextDays = withAssignedWeekdays(nextDays)
      }
      setDaysSynced(nextDays)
    }
  }

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

  function handleTemplateChange(templateId: string) {
    if (!templateId) return
    const template = templates.find((item) => item.id === templateId)
    if (!template) return
    const nextDays = template.days.map((day) => ({
      focus: day.focus,
      customFocus: day.customFocus ?? "",
      notes: "",
      exercises: day.exercises.map((exercise) => toExerciseDraft(exercise)),
    }))
    applyDays(nextDays, template.splitType)
  }

  function handleCloneChange(splitId: string) {
    if (!splitId) return
    const source = cloneSources.find((item) => item.id === splitId)
    if (!source) return
    const nextDays = source.days.map((day) => ({
      focus: day.focus,
      customFocus: day.customFocus ?? "",
      notes: "",
      exercises: day.exercises.map((exercise) => toExerciseDraft(exercise)),
    }))
    applyDays(nextDays, source.splitType)
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

  return (
    <form
      onSubmit={form.handleSubmit(() => onSubmit())}
      className="space-y-6"
    >
      <SafetyWarningDialog
        open={conflicts.length > 0}
        conflicts={conflicts}
        onReplace={handleReplace}
        onKeep={handleKeep}
      />

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {(templates.length > 0 || cloneSources.length > 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.trainingSplit.startFromTemplate}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.trainingSplit.startFromTemplate}</Label>
              <Select onValueChange={handleTemplateChange} disabled={isSubmitting}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.trainingSplit.selectTemplate} />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      {t.trainingSplit.noTemplatesMatch}
                    </SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} · {template.daysPerWeek} {t.trainingSplit.activeDays}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.trainingSplit.cloneFromClient}</Label>
              <Select onValueChange={handleCloneChange} disabled={isSubmitting}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.trainingSplit.selectCloneSource} />
                </SelectTrigger>
                <SelectContent>
                  {cloneSources.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      {t.trainingSplit.noClonableSplits}
                    </SelectItem>
                  ) : (
                    cloneSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.client.fullName ?? t.common.none} ·{" "}
                        {source.days.length} {t.trainingSplit.activeDays}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t.trainingSplit.details}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="splitType">{t.trainingSplit.splitType}</Label>
              <Select
                value={form.watch("splitType")}
                onValueChange={(value) =>
                  handleSplitTypeChange(value as SplitType)
                }
              >
                <SelectTrigger id="splitType" className="w-full">
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
                <p className="text-sm text-destructive">
                  {form.formState.errors.splitType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t.trainingSplit.status}</Label>
              <Select
                value={status}
                onValueChange={(value) => form.setValue("status", value as PlanStatus)}
              >
                <SelectTrigger id="status" className="w-full">
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
              <p className="text-xs text-muted-foreground">
                {t.trainingSplit.activeStatusHint}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.trainingSplit.scheduleMode}</Label>
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
                  "rounded-xl border p-4 text-start transition-colors",
                  scheduleMode === ScheduleMode.FIXED_WEEKDAYS
                    ? "border-brand-500/60 bg-brand-50/60 ring-1 ring-brand-500/40 dark:bg-brand-900/40"
                    : "hover:bg-white/60 dark:hover:bg-white/5"
                )}
              >
                <span className="block text-sm font-semibold">
                  {t.trainingSplit.scheduleModeFixed}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
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
                  "rounded-xl border p-4 text-start transition-colors",
                  scheduleMode === ScheduleMode.SEQUENTIAL
                    ? "border-brand-500/60 bg-brand-50/60 ring-1 ring-brand-500/40 dark:bg-brand-900/40"
                    : "hover:bg-white/60 dark:hover:bg-white/5"
                )}
              >
                <span className="block text-sm font-semibold">
                  {t.trainingSplit.scheduleModeSequential}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t.trainingSplit.scheduleModeSequentialHint}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t.trainingSplit.notes}</Label>
            <Textarea
              id="notes"
              placeholder={t.trainingSplit.splitNotesPlaceholder}
              rows={3}
              {...form.register("notes")}
            />
            {form.formState.errors.notes && (
              <p className="text-sm text-destructive">
                {form.formState.errors.notes.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t.trainingSplit.weeklySchedule}</CardTitle>
          {scheduleMode === ScheduleMode.FIXED_WEEKDAYS ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting || days.length === 0}
              onClick={handleAutoAssign}
            >
              <CalendarRange className="size-4" />
              {t.trainingSplit.autoAssignDays}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <DaysEditor
            days={days}
            disabled={isSubmitting}
            onChange={setDaysSynced}
            exerciseLibrary={exercises}
            onExerciseAdded={handleExerciseAdded}
            scheduleMode={scheduleMode}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t.common.saving}
            </>
          ) : isEdit ? (
            t.common.save
          ) : (
            t.trainingSplit.createSplit
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/clients/${clientId}?tab=training-split`)}
          disabled={isSubmitting}
          className="min-w-[160px]"
        >
          {t.common.cancel}
        </Button>
      </div>
    </form>
  )
}
