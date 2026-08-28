"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { submitClientBasicInfoAction } from "@/server/actions/invite"
import { inviteBasicInfoSchema } from "@/lib/validations/invite"
import type { Goal } from "@/generated/prisma/enums"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/client"
import { getGoalLabel } from "@/lib/i18n/labels"

type FormValues = {
  fullName: string
  birthDate: string
  phone: string
  goal: Goal
}

export function ClientBasicInfoForm({ token }: { token: string }) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [isPending, setIsPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const goalOptions = [
    { value: "WEIGHT_LOSS" as Goal, label: getGoalLabel("WEIGHT_LOSS", locale) },
    { value: "MUSCLE_BUILDING" as Goal, label: getGoalLabel("MUSCLE_BUILDING", locale) },
    { value: "STRENGTH" as Goal, label: getGoalLabel("STRENGTH", locale) },
    { value: "GENERAL_FITNESS" as Goal, label: getGoalLabel("GENERAL_FITNESS", locale) },
    { value: "WEIGHT_GAIN" as Goal, label: getGoalLabel("WEIGHT_GAIN", locale) },
    { value: "REHAB" as Goal, label: getGoalLabel("REHAB", locale) },
  ]

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
      goal: undefined as unknown as Goal,
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
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
              <p className="text-sm text-destructive">
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
              <p className="text-sm text-destructive">
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
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>{t.invite.form.goal}</Label>
            <Controller
              control={control}
              name="goal"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.invite.form.selectGoal} />
                  </SelectTrigger>
                  <SelectContent>
                    {goalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label ?? option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.goal && (
              <p className="text-sm text-destructive">{errors.goal.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t.invite.form.submitButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
