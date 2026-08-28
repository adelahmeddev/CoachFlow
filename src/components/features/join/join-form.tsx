"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import { submitJoinClientAction } from "@/server/actions/invite"
import { joinClientSchema } from "@/lib/validations/invite"
import type { Goal } from "@/generated/prisma/enums"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/client"
import { getGoalLabel } from "@/lib/i18n/labels"

type FormValues = { fullName: string; phone: string; password: string; confirmPassword: string; goal: Goal }

export function JoinForm({ slug, trainerName }: { slug: string; trainerName: string }) {
  const { t, locale } = useI18n()
  const [isPending, setIsPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const goalOptions = [
    { value: "WEIGHT_LOSS" as Goal, label: getGoalLabel("WEIGHT_LOSS", locale) },
    { value: "MUSCLE_BUILDING" as Goal, label: getGoalLabel("MUSCLE_BUILDING", locale) },
    { value: "STRENGTH" as Goal, label: getGoalLabel("STRENGTH", locale) },
    { value: "GENERAL_FITNESS" as Goal, label: getGoalLabel("GENERAL_FITNESS", locale) },
    { value: "WEIGHT_GAIN" as Goal, label: getGoalLabel("WEIGHT_GAIN", locale) },
    { value: "REHAB" as Goal, label: getGoalLabel("REHAB", locale) },
  ]

  const { register, handleSubmit, setError, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(joinClientSchema),
    defaultValues: { fullName: "", phone: "", password: "", confirmPassword: "", goal: undefined as unknown as Goal },
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
            <Label>{t.invite.form.goal} *</Label>
            <Controller
              control={control}
              name="goal"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={isPending}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t.invite.form.selectGoal} /></SelectTrigger>
                  <SelectContent>{goalOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label ?? o.value}</SelectItem>)}</SelectContent>
                </Select>
              )}
            />
            {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
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
