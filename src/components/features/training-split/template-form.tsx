"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, SlidersHorizontal, Calendar } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  trainingSplitTemplateSchema,
  type TrainingSplitTemplateInput,
} from "@/lib/validations/training-split-template"
import type { TrainingSplitDayInput } from "@/lib/validations/training-split"
import { SPLIT_TYPE_OPTIONS, SPLIT_TYPE_DEFAULT_TEMPLATES } from "@/lib/constants"
import { DaysEditor, toExerciseDraft } from "@/components/features/training-split/days-editor"
import {
  createTrainingSplitTemplateAction,
  updateTrainingSplitTemplateAction,
} from "@/server/actions/training-split-template"
import { SplitType } from "@/lib/db/enums"
import type { ExerciseOption } from "@/lib/exercise-safety"
import { GlassCard } from "./liquid-glass/glass-card"
import { LiveVolumeRadar } from "./live-volume-radar"

interface TemplateFormProps {
  exercises: ExerciseOption[]
  template?: {
    id: string
    name: string
    goal?: unknown
    level?: string | null
    splitType: SplitType
    daysPerWeek: number
    description: string | null
    days: {
      focus: TrainingSplitDayInput["focus"]
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
  }
}

function templateDaysToState(
  template: TemplateFormProps["template"]
): TrainingSplitDayInput[] {
  if (!template) return []
  return template.days.map((day) => ({
    focus: day.focus,
    customFocus: day.customFocus ?? "",
    notes: "",
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

export function TemplateForm({
  exercises,
  template,
}: TemplateFormProps) {
  const router = useRouter()
  const { t } = useI18n()
  const isEdit = Boolean(template)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [days, setDays] = useState<TrainingSplitDayInput[]>(
    templateDaysToState(template)
  )

  // Sync form's days value with local state for validation
  const setDaysSynced = (nextDays: TrainingSplitDayInput[]) => {
    setDays(nextDays)
    form.setValue("days", nextDays, { shouldValidate: false })
  }

  const form = useForm<TrainingSplitTemplateInput>({
    resolver: zodResolver(trainingSplitTemplateSchema) as Resolver<TrainingSplitTemplateInput>,
    defaultValues: {
      name: template?.name ?? "",
      splitType: template?.splitType ?? SplitType.FULL_BODY,
      daysPerWeek: template?.daysPerWeek ?? 3,
      description: template?.description ?? "",
      days: template
        ? templateDaysToState(template)
        : SPLIT_TYPE_DEFAULT_TEMPLATES[SplitType.FULL_BODY].days.map((focus) => ({
            focus,
            customFocus: "",
            notes: "",
            exercises: [],
          })),
    },
  })

  function handleSplitTypeChange(value: SplitType) {
    form.setValue("splitType", value, { shouldValidate: false })
    form.setValue("daysPerWeek", days.length || 3, {
      shouldValidate: false,
    })
  }

  async function onSubmit() {
    setIsSubmitting(true)
    setServerError(null)

    const values = form.getValues()
    const payload: TrainingSplitTemplateInput = {
      name: values.name,
      splitType: values.splitType,
      daysPerWeek: values.daysPerWeek,
      description: values.description?.trim() || null,
      days,
    }

    try {
      const result =
        isEdit && template
          ? await updateTrainingSplitTemplateAction(template.id, payload)
          : await createTrainingSplitTemplateAction(payload)

      if (!result.ok) {
        if ("fieldErrors" in result && result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              if (field === "days") {
                toast.error(errors[0] ?? t.toasts.invalidTrainingDays)
              } else {
                form.setError(
                  field as
                    | "name"
                    | "splitType"
                    | "daysPerWeek"
                    | "description",
                  { type: "server", message: errors[0] }
                )
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
        isEdit ? t.templates.updatedToast : t.templates.createdToast
      )
      router.push("/training-split-templates")
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

      function onInvalid(errors: any) {
        const firstError = Object.values(errors).flat()[0] as any
        if (firstError && firstError.message) {
          toast.error(firstError.message)
        } else {
          toast.error(t.toasts.invalidTrainingDays)
        }
      }

      return (
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-6"
        >
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <GlassCard variant="neutral" className="p-5" showSheen={true}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <SlidersHorizontal className="size-4 text-brand-400" />
          <h3 className="text-sm font-bold tracking-wide">
            {t.templates.details}
          </h3>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="templateName" className="text-xs font-semibold">
                {t.templates.templateName}
              </Label>
              <Input
                id="templateName"
                placeholder={t.templates.templateNamePlaceholder}
                className="rounded-xl border-white/15 bg-white/[0.04] text-xs"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="templateSplitType" className="text-xs font-semibold">
                {t.templates.splitType}
              </Label>
              <Select
                value={form.watch("splitType")}
                onValueChange={(value) =>
                  handleSplitTypeChange(value as SplitType)
                }
              >
                <SelectTrigger id="templateSplitType" className="w-full rounded-xl border-white/15 bg-white/[0.04] text-xs">
                  <SelectValue placeholder={t.templates.selectSplitType} />
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
              <Label htmlFor="templateDays" className="text-xs font-semibold">
                {t.templates.daysPerWeek}
              </Label>
              <Input
                id="templateDays"
                type="number"
                min={1}
                max={7}
                className="rounded-xl border-white/15 bg-white/[0.04] text-xs font-mono"
                {...form.register("daysPerWeek", { valueAsNumber: true })}
              />
              {form.formState.errors.daysPerWeek && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.daysPerWeek.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="templateDescription" className="text-xs font-semibold">
              {t.templates.description}
            </Label>
            <Textarea
              id="templateDescription"
              placeholder={t.templates.descriptionPlaceholder}
              rows={2}
              className="rounded-xl border-white/15 bg-white/[0.04] text-xs"
              {...form.register("description")}
            />
          </div>
        </div>
      </GlassCard>

      {/* Live Volume Radar */}
      <LiveVolumeRadar days={days} exerciseLibrary={exercises} />

      <GlassCard variant="neutral" className="p-5" showSheen={true}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <Calendar className="size-4 text-brand-400" />
          <h3 className="text-sm font-bold tracking-wide">
            {t.templates.daysSchedule}
          </h3>
        </div>

        <DaysEditor
          days={days}
          disabled={isSubmitting}
          onChange={setDaysSynced}
          exerciseLibrary={exercises}
        />
      </GlassCard>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px] rounded-xl shadow-glow">
          {isSubmitting ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t.common.saving}
            </>
          ) : isEdit ? (
            t.common.save
          ) : (
            t.templates.createTemplate
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/training-split-templates")}
          disabled={isSubmitting}
          className="min-w-[160px] rounded-xl border-white/15 bg-white/[0.04]"
        >
          {t.common.cancel}
        </Button>
      </div>
    </form>
  )
}
