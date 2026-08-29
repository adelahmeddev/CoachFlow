"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { CalendarRange, Loader2, Ticket } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import {
  subscriptionPlanSchema,
  translateSubscriptionPlanFieldError,
  type SubscriptionPlanInput,
} from "@/lib/validations/subscription-plan"
import { getPlanTypeLabel } from "@/lib/i18n/labels"
import {
  createSubscriptionPlanAction,
  updateSubscriptionPlanAction,
} from "@/server/actions/subscription-plan"
import { PlanType } from "@/lib/db/enums"
import type { SubscriptionPlan } from "@/lib/db/types"
import { cn } from "@/lib/utils"

const DURATION_PRESETS = [7, 15, 30]

interface SubscriptionPlanFormProps {
  plan?: SubscriptionPlan
}

export function SubscriptionPlanForm({ plan }: SubscriptionPlanFormProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const isEdit = Boolean(plan)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SubscriptionPlanInput>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: {
      name: plan?.name ?? "",
      planType: plan?.planType ?? PlanType.PERIOD,
      sessionsCount: plan?.sessionsCount ?? "",
      durationDays: plan?.durationDays ?? "",
      notes: plan?.notes ?? "",
    },
  })

  const watchedPlanType = form.watch("planType")
  const watchedDurationDays = form.watch("durationDays")
  const watchedSessionsCount = form.watch("sessionsCount")

  function handlePlanTypeChange(type: PlanType) {
    form.setValue("planType", type, { shouldValidate: false })
    form.clearErrors("sessionsCount")
    form.clearErrors("durationDays")
  }

  function handleNumberChange(
    field: "sessionsCount" | "durationDays",
    value: string
  ) {
    form.setValue(field, value === "" ? "" : Number(value), {
      shouldValidate: true,
    })
  }

  async function onSubmit(values: SubscriptionPlanInput) {
    setIsSubmitting(true)
    setServerError(null)

    const payload = {
      name: values.name ?? "",
      planType: values.planType,
      sessionsCount:
        values.planType === PlanType.SESSIONS &&
        values.sessionsCount !== "" &&
        values.sessionsCount !== undefined
          ? Number(values.sessionsCount)
          : undefined,
      durationDays:
        values.planType === PlanType.PERIOD &&
        values.durationDays !== "" &&
        values.durationDays !== undefined
          ? Number(values.durationDays)
          : undefined,
      notes: values.notes || undefined,
    }

    try {
      const result =
        isEdit && plan
          ? await updateSubscriptionPlanAction(plan.id, payload)
          : await createSubscriptionPlanAction(payload)

      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof SubscriptionPlanInput, {
                type: "server",
                message: translateSubscriptionPlanFieldError(errors[0], {
                  planNameMin: t.subscriptionPlans.errors.planNameMin,
                  planNameMax: t.subscriptionPlans.errors.planNameMax,
                  sessionsRequired: t.subscriptionPlans.errors.sessionsRequired,
                  durationRequired: t.subscriptionPlans.errors.durationRequired,
                  invalidValue: t.validation.invalidValue,
                }),
              })
            }
          })
        }
        if ("error" in result && result.error) {
          setServerError(result.error)
        }
        return
      }

      toast.success(
        isEdit ? t.toasts.subscriptionUpdated : t.toasts.subscriptionCreated
      )
      router.push("/subscription-plans")
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.subscriptionPlans.detailsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name">{t.subscriptionPlans.planName}</Label>
            <Input
              id="name"
              placeholder={t.subscription.planNamePlaceholder}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>{t.subscription.planType}</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handlePlanTypeChange(PlanType.PERIOD)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-start transition-colors",
                  watchedPlanType === PlanType.PERIOD
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <CalendarRange className="mt-0.5 size-5 text-primary" />
                <span className="space-y-1">
                  <span className="block font-medium">
                    {getPlanTypeLabel(PlanType.PERIOD, locale)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t.subscription.planTypeHintPeriod}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => handlePlanTypeChange(PlanType.SESSIONS)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-start transition-colors",
                  watchedPlanType === PlanType.SESSIONS
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <Ticket className="mt-0.5 size-5 text-primary" />
                <span className="space-y-1">
                  <span className="block font-medium">
                    {getPlanTypeLabel(PlanType.SESSIONS, locale)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t.subscription.planTypeHintSessions}
                  </span>
                </span>
              </button>
            </div>
          </div>

          {watchedPlanType === PlanType.PERIOD ? (
            <div className="space-y-2">
              <Label htmlFor="durationDays">{t.subscription.durationDays}</Label>
              <Input
                id="durationDays"
                type="number"
                min={1}
                placeholder={t.subscription.durationDaysPlaceholder}
                value={
                  watchedDurationDays === "" || watchedDurationDays === undefined
                    ? ""
                    : String(watchedDurationDays)
                }
                onChange={(e) =>
                  handleNumberChange("durationDays", e.target.value)
                }
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {DURATION_PRESETS.map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant={
                      watchedDurationDays === days ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleNumberChange("durationDays", String(days))}
                  >
                    {days === 30 ? t.subscription.presetMonth : `${days}`}
                  </Button>
                ))}
              </div>
              {form.formState.errors.durationDays && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.durationDays.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="sessionsCount">{t.subscription.sessionsCount}</Label>
              <Input
                id="sessionsCount"
                type="number"
                min={1}
                placeholder={t.subscription.sessionsCountPlaceholder}
                value={
                  watchedSessionsCount === "" || watchedSessionsCount === undefined
                    ? ""
                    : String(watchedSessionsCount)
                }
                onChange={(e) =>
                  handleNumberChange("sessionsCount", e.target.value)
                }
              />
              {form.formState.errors.sessionsCount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.sessionsCount.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t.subscription.notes}</Label>
            <Textarea
              id="notes"
              placeholder={t.subscription.notesPlaceholder}
              rows={3}
              {...form.register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t.subscription.saving}
            </>
          ) : isEdit ? (
            t.subscription.saveChanges
          ) : (
            t.subscription.createButton
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/subscription-plans")}
          disabled={isSubmitting}
          className="min-w-[160px]"
        >
          {t.common.cancel}
        </Button>
      </div>
    </form>
  )
}
