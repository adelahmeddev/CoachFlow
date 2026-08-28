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
  buildProfileSchema,
  translateSettingsFieldError,
  type ProfileInput,
} from "@/lib/validations/settings"
import { updateProfileAction } from "@/server/actions/settings"

interface ProfileFormProps {
  fullName: string
  phone: string
}

export function ProfileForm({ fullName, phone }: ProfileFormProps) {
  const { t } = useI18n()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileInput>({
    resolver: zodResolver(buildProfileSchema(t)),
    defaultValues: { fullName, phone },
  })

  async function onSubmit(values: ProfileInput) {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const result = await updateProfileAction(values)
      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof ProfileInput, {
                type: "server",
                message: translateSettingsFieldError(t, errors[0]),
              })
            }
          })
        }
        if ("error" in result && result.error) {
          setServerError(
            result.error === "PHONE_EXISTS"
              ? t.settings.profile.errors.phoneExists
              : t.settings.errors.unauthorized
          )
        }
        return
      }
      toast.success(t.settings.profile.updatedToast)
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
          <Label htmlFor="fullName">{t.settings.profile.fullName}</Label>
          <Input
            id="fullName"
            placeholder={t.settings.profile.fullNamePlaceholder}
            {...form.register("fullName")}
          />
          {form.formState.errors.fullName && (
            <p className="text-sm text-destructive">
              {form.formState.errors.fullName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t.settings.profile.phone}</Label>
          <Input
            id="phone"
            placeholder={t.settings.profile.phonePlaceholder}
            dir="ltr"
            {...form.register("phone")}
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-destructive">
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t.settings.profile.saving}
            </>
          ) : (
            t.settings.profile.save
          )}
        </Button>
      </div>
    </form>
  )
}
