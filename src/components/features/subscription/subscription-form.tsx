"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
import { toast } from "sonner"
import { CalendarRange, Loader2, Ticket } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import {
  buildSubscriptionSchema,
  translateSubscriptionFieldError,
  type SubscriptionInput,
} from "@/lib/validations/subscription"
import {
  getPlanTypeLabel,
  getSubscriptionStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/i18n/labels"
import {
  createSubscriptionAction,
  updateSubscriptionAction,
} from "@/server/actions/subscription"
import {
  PaymentStatus,
  PlanType,
  SubscriptionStatus,
} from "@/lib/db/enums"
import type { Subscription } from "@/lib/db/types"
import { cn } from "@/lib/utils"

interface SubscriptionFormProps {
  clientId: string
  subscription?: Subscription
}

const DURATION_PRESETS = [7, 15, 30]

function toDateInput(value: Date | null | undefined): string {
  if (!value) return ""
  return new Date(value).toISOString().split("T")[0]
}

function todayInput(): string {
  return new Date().toISOString().split("T")[0]
}

function addDaysToInput(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

const STATUS_VALUES = Object.values(SubscriptionStatus)
const PAYMENT_VALUES = Object.values(PaymentStatus)

export function SubscriptionForm({
  clientId,
  subscription,
}: SubscriptionFormProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const isEdit = Boolean(subscription)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SubscriptionInput>({
    resolver: zodResolver(buildSubscriptionSchema(t)),
    defaultValues: {
      planType: subscription?.planType ?? PlanType.PERIOD,
      planName: subscription?.planName ?? "",
      status: subscription?.status ?? SubscriptionStatus.ACTIVE,
      paymentStatus:
        subscription?.paymentStatus ?? PaymentStatus.NOT_REQUIRED,
      startDate: subscription?.startDate
        ? toDateInput(subscription.startDate)
        : todayInput(),
      endDate: "",
      durationDays: subscription?.durationDays ?? "",
      sessionsCount: subscription?.sessionsCount ?? "",
      remainingSessions: subscription?.remainingSessions ?? "",
      autoRenew: subscription?.autoRenew ?? false,
      notes: subscription?.notes ?? "",
    },
  })

  const watchedPlanType = form.watch("planType")
  const watchedStatus = form.watch("status")
  const watchedSessionsCount = form.watch("sessionsCount")
  const watchedDurationDays = form.watch("durationDays")
  const watchedStartDate = form.watch("startDate")

  function handlePlanTypeChange(type: PlanType) {
    form.setValue("planType", type, { shouldValidate: false })
    form.clearErrors("sessionsCount")
    form.clearErrors("remainingSessions")
    form.clearErrors("durationDays")
    form.clearErrors("startDate")
    form.clearErrors("endDate")
  }

  function handleSessionsCountChange(value: string) {
    const currentRemaining = form.getValues("remainingSessions")
    form.setValue(
      "sessionsCount",
      value === "" ? "" : Number(value),
      { shouldValidate: false }
    )
    if ((currentRemaining === "" || currentRemaining === undefined) && value !== "") {
      form.setValue("remainingSessions", Number(value), {
        shouldValidate: true,
      })
    }
  }

  function handleDurationChange(value: string) {
    form.setValue(
      "durationDays",
      value === "" ? "" : Number(value),
      { shouldValidate: true }
    )
  }

  const computedEndDate =
    watchedPlanType === PlanType.PERIOD &&
    watchedStartDate &&
    watchedDurationDays !== "" &&
    watchedDurationDays !== undefined
      ? addDaysToInput(watchedStartDate, Number(watchedDurationDays))
      : null

  async function onSubmit(values: SubscriptionInput) {
    setIsSubmitting(true)
    setServerError(null)

    const payload = {
      planType: values.planType,
      planName: values.planName ?? "",
      status: values.status,
      paymentStatus: values.paymentStatus,
      startDate: values.startDate || undefined,
      endDate: undefined,
      durationDays:
        values.planType === PlanType.PERIOD &&
        values.durationDays !== "" &&
        values.durationDays !== undefined
          ? Number(values.durationDays)
          : undefined,
      sessionsCount:
        values.planType === PlanType.SESSIONS &&
        values.sessionsCount !== "" &&
        values.sessionsCount !== undefined
          ? Number(values.sessionsCount)
          : undefined,
      remainingSessions:
        values.planType === PlanType.SESSIONS &&
        values.remainingSessions !== "" &&
        values.remainingSessions !== undefined
          ? Number(values.remainingSessions)
          : undefined,
      autoRenew: values.autoRenew,
      notes: values.notes || undefined,
    }

    try {
      const result =
        isEdit && subscription
          ? await updateSubscriptionAction(clientId, subscription.id, payload)
          : await createSubscriptionAction(clientId, payload)

      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof SubscriptionInput, {
                type: "server",
                message: translateSubscriptionFieldError(t, errors[0]),
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
      router.push(`/clients/${clientId}?tab=subscription`)
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
          <CardTitle>{t.subscription.detailsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="space-y-2">
            <Label htmlFor="planName">{t.subscription.planName}</Label>
            <Input
              id="planName"
              placeholder={
                watchedPlanType === PlanType.PERIOD
                  ? t.subscription.planNamePeriodPlaceholder
                  : t.subscription.planNamePlaceholder
              }
              {...form.register("planName")}
            />
            {form.formState.errors.planName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.planName.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">{t.subscription.status}</Label>
              <Select
                value={watchedStatus}
                onValueChange={(value) =>
                  form.setValue("status", value as SubscriptionStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.subscription.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {getSubscriptionStatusLabel(value, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t.subscription.statusHint}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">{t.subscription.paymentStatus}</Label>
              <Select
                value={form.watch("paymentStatus")}
                onValueChange={(value) =>
                  form.setValue("paymentStatus", value as PaymentStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.subscription.selectPayment} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {getPaymentStatusLabel(value, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {watchedPlanType === PlanType.PERIOD ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t.subscription.startDate}</Label>
                  <Input id="startDate" type="date" {...form.register("startDate")} />
                  {form.formState.errors.startDate && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.startDate.message}
                    </p>
                  )}
                </div>
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
                    onChange={(e) => handleDurationChange(e.target.value)}
                  />
                  {form.formState.errors.durationDays && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.durationDays.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {DURATION_PRESETS.map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant={
                      watchedDurationDays === days ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleDurationChange(String(days))}
                  >
                    {interpolateDays(t, days)}
                  </Button>
                ))}
              </div>

              {computedEndDate ? (
                <p className="text-xs text-muted-foreground">
                  {t.subscription.endDateAutoNote}:{" "}
                  <span className="font-medium text-foreground">
                    {formatDateInput(computedEndDate, locale)}
                  </span>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate-sessions">
                    {t.subscription.startDate}
                  </Label>
                  <Input
                    id="startDate-sessions"
                    type="date"
                    {...form.register("startDate")}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                    onChange={(e) => handleSessionsCountChange(e.target.value)}
                  />
                  {form.formState.errors.sessionsCount && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.sessionsCount.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remainingSessions">
                    {t.subscription.remainingSessions}
                  </Label>
                  <Input
                    id="remainingSessions"
                    type="number"
                    min={0}
                    placeholder={t.subscription.sessionsCountPlaceholder}
                    {...form.register("remainingSessions", {
                      setValueAs: (v) =>
                        v === "" || v === undefined ? "" : Number(v),
                    })}
                  />
                  {form.formState.errors.remainingSessions && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.remainingSessions.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 space-y-0">
            <Checkbox
              id="autoRenew"
              checked={form.watch("autoRenew")}
              onCheckedChange={(checked) =>
                form.setValue("autoRenew", Boolean(checked))
              }
            />
            <Label htmlFor="autoRenew" className="font-normal">
              {t.subscription.autoRenew}
            </Label>
          </div>

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
          onClick={() => router.push(`/clients/${clientId}?tab=subscription`)}
          disabled={isSubmitting}
          className="min-w-[160px]"
        >
          {t.common.cancel}
        </Button>
      </div>
    </form>
  )
}

function interpolateDays(
  t: ReturnType<typeof useI18n>["t"],
  days: number
): string {
  if (days === 30) return t.subscription.presetMonth
  return `${days} ${t.profile.overview.days}`
}

function formatDateInput(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`))
}
