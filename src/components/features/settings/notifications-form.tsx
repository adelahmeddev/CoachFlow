"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useI18n } from "@/lib/i18n/client"
import {
  buildNotificationsSchema,
  type NotificationsInput,
} from "@/lib/validations/settings"
import { updateNotificationsAction } from "@/server/actions/settings"

export interface NotificationsFormDefaults {
  notifyInactivity: boolean
  notifySubscription: boolean
  weeklySummary: boolean
  // deprecated: notifyReassessment kept optional for back-compat
  notifyReassessment?: boolean
}

interface NotificationsFormProps {
  defaults: NotificationsFormDefaults
}

const TOGGLE_ROWS = [
  {
    field: "notifyInactivity",
    titleKey: "inactivity",
    descKey: "inactivityDescription",
  },
  {
    field: "notifySubscription",
    titleKey: "subscription",
    descKey: "subscriptionDescription",
  },
  {
    field: "weeklySummary",
    titleKey: "weeklySummary",
    descKey: "weeklySummaryDescription",
  },
] as const

export function NotificationsForm({ defaults }: NotificationsFormProps) {
  const { t } = useI18n()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NotificationsInput>({
    resolver: zodResolver(buildNotificationsSchema()),
    defaultValues: {
      notifyInactivity: defaults.notifyInactivity,
      notifySubscription: defaults.notifySubscription,
      weeklySummary: defaults.weeklySummary,
    },
  })

  async function onSubmit(values: NotificationsInput) {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const result = await updateNotificationsAction(values)
      if (!result.ok) {
        if ("error" in result && result.error) {
          setServerError(t.settings.errors.unauthorized)
        }
        return
      }
      toast.success(t.settings.notifications.updatedToast)
    } catch {
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

      <div className="space-y-2">
        {TOGGLE_ROWS.map((row) => {
          const checked = form.watch(row.field)
          return (
            <div
              key={row.field}
              className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-soft dark:border-white/10 dark:bg-white/5"
            >
              <div className="space-y-0.5">
                <Label htmlFor={row.field} className="font-medium">
                  {t.settings.notifications[row.titleKey]}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t.settings.notifications[row.descKey]}
                </p>
              </div>
              <Switch
                id={row.field}
                checked={checked}
                onCheckedChange={(value) =>
                  form.setValue(row.field, Boolean(value))
                }
                aria-label={t.settings.notifications[row.titleKey]}
              />
            </div>
          )
        })}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t.settings.notifications.saving}
            </>
          ) : (
            t.settings.notifications.save
          )}
        </Button>
      </div>
    </form>
  )
}
