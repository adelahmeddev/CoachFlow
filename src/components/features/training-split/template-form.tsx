"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { getGoalLabel } from "@/lib/i18n/labels"
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  trainingSplitTemplateSchema,
  type TrainingSplitTemplateInput,
} from "@/lib/validations/training-split-template"
import type { TrainingSplitDayInput } from "@/lib/validations/training-split"
import { SPLIT_TYPE_OPTIONS } from "@/lib/constants"
import { DaysEditor, toExerciseDraft } from "@/components/features/training-split/days-editor"
import {
  createTrainingSplitTemplateAction,
  updateTrainingSplitTemplateAction,
} from "@/server/actions/training-split-template"
import { Goal, SplitType } from "@/lib/db/enums"
import type { ExerciseOption } from "@/lib/exercise-safety"

interface TemplateFormProps {
  exercises: ExerciseOption[]
  template?: {
    id: string
    name: string
    goal: Goal | null
    level: string | null
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

const GOAL_OPTIONS: Goal[] = [
  Goal.WEIGHT_LOSS,
  Goal.MUSCLE_BUILDING,
  Goal.STRENGTH,
  Goal.GENERAL_FITNESS,
  Goal.WEIGHT_GAIN,
  Goal.REHAB,
]

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
  const { t, locale } = useI18n()
  const isEdit = Boolean(template)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [days, setDays] = useState<TrainingSplitDayInput[]>(
    templateDaysToState(template)
  )

  // Sync form's days value with local state for validation
  const setDaysSynced = (nextDays: TrainingSplitDayInput[]) => {
    setDays(nextDays)
    form.setValue("days", nextDays, { shouldValidate: true })
  }

  const form = useForm<TrainingSplitTemplateInput>({
    resolver: zodResolver(trainingSplitTemplateSchema) as Resolver<TrainingSplitTemplateInput>,
    defaultValues: {
      name: template?.name ?? "",
      goal: template?.goal ?? undefined,
      level: template?.level ?? "",
      splitType: template?.splitType ?? SplitType.FULL_BODY,
      daysPerWeek: template?.daysPerWeek ?? 3,
      description: template?.description ?? "",
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
      goal: values.goal ?? null,
      level: values.level?.trim() || null,
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
                    | "goal"
                    | "level"
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

  return (
    <form
      onSubmit={form.handleSubmit(() => onSubmit())}
      className="space-y-6"
    >
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.templates.details}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="templateName">{t.templates.templateName}</Label>
              <Input
                id="templateName"
                placeholder={t.templates.templateNamePlaceholder}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateGoal">{t.templates.goal}</Label>
              <Select
                value={form.watch("goal") ?? "none"}
                onValueChange={(value) =>
                  form.setValue(
                    "goal",
                    value === "none" ? null : (value as Goal)
                  )
                }
              >
                <SelectTrigger id="templateGoal" className="w-full">
                  <SelectValue placeholder={t.templates.selectGoal} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.templates.noGoal}</SelectItem>
                  {GOAL_OPTIONS.map((goal) => (
                    <SelectItem key={goal} value={goal}>
                      {getGoalLabel(goal, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateLevel">{t.templates.level}</Label>
              <Input
                id="templateLevel"
                placeholder={t.templates.levelPlaceholder}
                {...form.register("level")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateSplitType">{t.templates.splitType}</Label>
              <Select
                value={form.watch("splitType")}
                onValueChange={(value) =>
                  handleSplitTypeChange(value as SplitType)
                }
              >
                <SelectTrigger id="templateSplitType" className="w-full">
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
                <p className="text-sm text-destructive">
                  {form.formState.errors.splitType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateDays">{t.templates.daysPerWeek}</Label>
              <Input
                id="templateDays"
                type="number"
                min={1}
                max={7}
                {...form.register("daysPerWeek", { valueAsNumber: true })}
              />
              {form.formState.errors.daysPerWeek && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.daysPerWeek.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateDescription">{t.templates.description}</Label>
            <Textarea
              id="templateDescription"
              placeholder={t.templates.descriptionPlaceholder}
              rows={3}
              {...form.register("description")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.templates.daysSchedule}</CardTitle>
        </CardHeader>
        <CardContent>
          <DaysEditor
            days={days}
            disabled={isSubmitting}
            onChange={setDaysSynced}
            exerciseLibrary={exercises}
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
            t.templates.createTemplate
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/training-split-templates")}
          disabled={isSubmitting}
          className="min-w-[160px]"
        >
          {t.common.cancel}
        </Button>
      </div>
    </form>
  )
}
