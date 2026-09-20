"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Check, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import { submitJoinClientAction } from "@/server/actions/invite"
import { joinClientSchema } from "@/lib/validations/invite"
import type { Goal } from "@/lib/db/enums"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"
import { MultiGoalPicker } from "@/components/features/goals/multi-goal-picker"
import { cn } from "@/lib/utils"


type FormValues = { fullName: string; phone: string; password: string; confirmPassword: string; goals: Goal[] }

export function JoinForm({ slug, trainerName }: { slug: string; trainerName: string }) {
  const { t, locale } = useI18n()
  const [isPending, setIsPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, setError, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(joinClientSchema),
    defaultValues: { fullName: "", phone: "", password: "", confirmPassword: "", goals: [] },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    setServerError(null)
    const result = await submitJoinClientAction(slug, values)
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) setError(field as keyof FormValues, { type: "server", message: messages[0] })
        }
      }
      setServerError(result.error)
      setIsPending(false)
      return
    }
    // Auto-login after sign-up
    await signIn("credentials", {
      identifier: values.phone,
      password: values.password,
      redirect: true,
      callbackUrl: "/client/home",
    })
    setIsPending(false)
  }

  if (success) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6 text-center space-y-3">
          <CheckCircle2 className="mx-auto size-12 text-green-500" />
          <h3 className="font-semibold">{t.invite.success.title}</h3>
          <p className="text-sm text-muted-foreground">{t.invite.success.description}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t.invite.form.title}</CardTitle>
        <CardDescription>{t.invite.invitedBy.replace("{trainerName}", trainerName)}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}
          <div className="grid gap-2">
            <Label htmlFor="fullName">{t.invite.form.fullName} *</Label>
            <Input id="fullName" placeholder={t.invite.form.fullNamePlaceholder} autoComplete="name" disabled={isPending} {...register("fullName")} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">{t.invite.form.phone} *</Label>
            <Input id="phone" placeholder={t.invite.form.phonePlaceholder} autoComplete="tel" disabled={isPending} {...register("phone")} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t.invite.form.password} *</Label>
            <Input id="password" type="password" placeholder={t.invite.form.passwordPlaceholder} autoComplete="new-password" disabled={isPending} {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">{t.invite.form.confirmPassword} *</Label>
            <Input id="confirmPassword" type="password" placeholder={t.invite.form.confirmPasswordPlaceholder} autoComplete="new-password" disabled={isPending} {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{t.invite.form.goal} *</Label>
              <Controller
                control={control}
                name="goals"
                render={({ field }) => (
                  (field.value?.length ?? 0) > 0 ? (
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {locale === "ar" ? `(تم اختيار ${field.value.length})` : `(${field.value.length} selected)`}
                    </span>
                  ) : <span />
                )}
              />
            </div>
            <Controller
              control={control}
              name="goals"
              render={({ field }) => (
                <MultiGoalPicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  error={errors.goals?.message}
                />
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t.invite.form.assessmentLater ?? "Assessment will be completed later by your coach."}</p>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t.invite.form.submitButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
