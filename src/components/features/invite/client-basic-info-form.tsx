"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Check } from "lucide-react"
import { submitClientBasicInfoAction } from "@/server/actions/invite"
import { inviteBasicInfoSchema } from "@/lib/validations/invite"
import type { Goal } from "@/lib/db/enums"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"
import { MultiGoalPicker } from "@/components/features/goals/multi-goal-picker"
import { cn } from "@/lib/utils"


type FormValues = {
  fullName: string
  birthDate: string
  phone: string
  goals: Goal[]
}

export function ClientBasicInfoForm({ token }: { token: string }) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [isPending, setIsPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(inviteBasicInfoSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      phone: "",
      goals: [],
    },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    setServerError(null)
    try {
      const result = await submitClientBasicInfoAction(token, values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.length) {
              setError(field as keyof FormValues, {
                type: "server",
                message: messages[0],
              })
            }
          }
        }
        setServerError(result.error)
        return
      }
      // Reload the invite page so the account (password) step is shown
      router.replace(`/invite/${token}`)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t.invite.form.title}</CardTitle>
        <CardDescription>
          {t.invite.form.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive animate-shake">
              {serverError}
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="fullName">{t.invite.form.fullName}</Label>
            <Input
              id="fullName"
              placeholder={t.invite.form.fullNamePlaceholder}
              autoComplete="name"
              disabled={isPending}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive animate-shake">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="birthDate">{t.invite.form.birthDate}</Label>
            <Input
              id="birthDate"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              disabled={isPending}
              {...register("birthDate")}
            />
            {errors.birthDate && (
              <p className="text-sm text-destructive animate-shake">
                {errors.birthDate.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">{t.invite.form.phone}</Label>
            <Input
              id="phone"
              placeholder={t.invite.form.phonePlaceholder}
              autoComplete="tel"
              disabled={isPending}
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-sm text-destructive animate-shake">{errors.phone.message}</p>
            )}
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

          <Button type="submit" className="w-full btn-pop" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t.invite.form.submitButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
