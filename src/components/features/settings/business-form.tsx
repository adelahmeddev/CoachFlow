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
  buildBusinessSchema,
  translateSettingsFieldError,
  type BusinessInput,
} from "@/lib/validations/settings"
import { updateBusinessAction } from "@/server/actions/settings"

interface BusinessFormProps {
  businessName: string
}

export function BusinessForm({ businessName }: BusinessFormProps) {
  const { t } = useI18n()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BusinessInput>({
    resolver: zodResolver(buildBusinessSchema(t)),
    defaultValues: { businessName },
  })

  async function onSubmit(values: BusinessInput) {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const result = await updateBusinessAction(values)
      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof BusinessInput, {
                type: "server",
                message: translateSettingsFieldError(t, errors[0]),
              })
            }
          })
        }
        if ("error" in result && result.error) {
          setServerError(t.settings.errors.unauthorized)
        }
        return
      }
      toast.success(t.settings.business.updatedToast)
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
        <Label htmlFor="businessName">{t.settings.business.businessName}</Label>
        <Input
          id="businessName"
          placeholder={t.settings.business.businessNamePlaceholder}
          {...form.register("businessName")}
        />
        {form.formState.errors.businessName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.businessName.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t.settings.business.saving}
            </>
          ) : (
            t.settings.business.save
          )}
        </Button>
      </div>
    </form>
  )
}
