"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/client"
import { type Locale } from "@/lib/i18n/config"
import {
  buildPreferencesSchema,
  timezoneValues,
  type PreferencesInput,
} from "@/lib/validations/settings"
import { updatePreferencesAction } from "@/server/actions/settings"
import { Units, WeekStartDay } from "@/lib/db/enums"

const UNIT_VALUES = Object.values(Units)
const WEEK_START_VALUES = Object.values(WeekStartDay)
const LOCALE_VALUES: Locale[] = ["en", "ar"]

export interface PreferencesFormDefaults {
  language: Locale
  units: Units
  weekStartDay: WeekStartDay
  timezone: string | null
}

interface PreferencesFormProps {
  defaults: PreferencesFormDefaults
}

export function PreferencesForm({ defaults }: PreferencesFormProps) {
  const { t, locale } = useI18n()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PreferencesInput>({
    resolver: zodResolver(buildPreferencesSchema(t)),
    defaultValues: {
      language: defaults.language,
      units: defaults.units,
      weekStartDay: defaults.weekStartDay,
      timezone: defaults.timezone ?? "",
    },
  })

  const watchedLanguage = form.watch("language")

  async function onSubmit(values: PreferencesInput) {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const result = await updatePreferencesAction(values)
      if (!result.ok) {
        if ("error" in result && result.error) {
          setServerError(t.settings.errors.unauthorized)
        }
        return
      }
      toast.success(t.settings.preferences.updatedToast)
      if (result.language && result.language !== locale) {
        window.location.reload()
      }
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t.settings.preferences.language}</Label>
          <Select
            value={watchedLanguage}
            onValueChange={(value) =>
              form.setValue("language", value as Locale)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t.settings.preferences.selectLanguage}
              />
            </SelectTrigger>
            <SelectContent>
              {LOCALE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === "en"
                    ? t.common.english
                    : t.common.arabic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t.settings.preferences.units}</Label>
          <Select
            value={form.watch("units")}
            onValueChange={(value) =>
              form.setValue("units", value as Units)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.settings.preferences.units} />
            </SelectTrigger>
            <SelectContent>
              {UNIT_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === Units.METRIC
                    ? t.settings.preferences.unitsOptions.metric
                    : t.settings.preferences.unitsOptions.imperial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t.settings.preferences.weekStartDay}</Label>
          <Select
            value={form.watch("weekStartDay")}
            onValueChange={(value) =>
              form.setValue("weekStartDay", value as WeekStartDay)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.settings.preferences.weekStartDay} />
            </SelectTrigger>
            <SelectContent>
              {WEEK_START_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === WeekStartDay.SAT
                    ? t.settings.preferences.weekStartOptions.sat
                    : value === WeekStartDay.SUN
                      ? t.settings.preferences.weekStartOptions.sun
                      : t.settings.preferences.weekStartOptions.mon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t.settings.preferences.timezone}</Label>
          <Select
            value={form.watch("timezone") ?? ""}
            onValueChange={(value) => form.setValue("timezone", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t.settings.preferences.selectTimezone}
              />
            </SelectTrigger>
            <SelectContent>
              {timezoneValues.map((value) => (
                <SelectItem key={value} value={value} dir="ltr">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t.settings.preferences.saving}
            </>
          ) : (
            t.settings.preferences.save
          )}
        </Button>
      </div>
    </form>
  )
}
