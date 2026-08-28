"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { inviteAccountSchema } from "@/lib/validations/invite"
import { submitClientAccountInfoAction } from "@/server/actions/invite"
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

type FormValues = {
  password: string
  confirmPassword: string
}

export function InviteAccountForm({
  token,
  phone,
}: {
  token: string
  phone: string | null
}) {
  const { t } = useI18n()
  const [isPending, setIsPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(inviteAccountSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    setServerError(null)
    try {
      const result = await submitClientAccountInfoAction(token, {
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
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
      // Auto-login the client and redirect to home
      await signIn("credentials", {
        identifier: phone ?? "client",
        password: values.password,
        redirect: true,
        callbackUrl: "/client/home",
      })
    } catch {
      toast.error("Something went wrong. Please try again.")
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t.invite.form.createAccountTitle}</CardTitle>
        <CardDescription>
          {t.invite.form.createAccountDescription}
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
            <Label htmlFor="password">{t.invite.form.password}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t.invite.form.passwordPlaceholder}
              autoComplete="new-password"
              disabled={isPending}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">{t.invite.form.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t.invite.form.confirmPasswordPlaceholder}
              autoComplete="new-password"
              disabled={isPending}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
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
