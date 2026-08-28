"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useI18n } from "@/lib/i18n/client"
import {
  buildSecuritySchema,
  translateSettingsFieldError,
  type SecurityInput,
} from "@/lib/validations/settings"
import { updateSecurityAction } from "@/server/actions/settings"

export function SecurityForm() {
  const { t } = useI18n()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SecurityInput>({
    resolver: zodResolver(buildSecuritySchema(t)),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: SecurityInput) {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const result = await updateSecurityAction(values)
      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof SecurityInput, {
                type: "server",
                message: translateSettingsFieldError(t, errors[0]),
              })
            }
          })
        }
        if ("error" in result && result.error) {
          setServerError(
            result.error === "WRONG_CURRENT_PASSWORD"
              ? t.settings.security.errors.wrongCurrentPassword
              : t.settings.errors.unauthorized
          )
        }
        return
      }
      toast.success(t.settings.security.changedToast)
      form.reset()
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">
            {t.settings.security.currentPassword}
          </Label>
          <Input
            id="currentPassword"
            type="password"
            placeholder={t.settings.security.currentPlaceholder}
            autoComplete="current-password"
            dir="ltr"
            {...form.register("currentPassword")}
          />
          {form.formState.errors.currentPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.currentPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t.settings.security.newPassword}</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder={t.settings.security.newPlaceholder}
            autoComplete="new-password"
            dir="ltr"
            {...form.register("newPassword")}
          />
          {form.formState.errors.newPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            {t.settings.security.confirmPassword}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t.settings.security.confirmPlaceholder}
            autoComplete="new-password"
            dir="ltr"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t.settings.security.changing}
            </>
          ) : (
            t.settings.security.change
          )}
        </Button>
      </div>
    </form>
  )
}
