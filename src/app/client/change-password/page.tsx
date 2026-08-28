"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { z } from "zod"
import { useI18n } from "@/lib/i18n/client"
import { interpolate } from "@/lib/i18n/format"
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

function buildChangePasswordSchema(t: ReturnType<typeof useI18n>["t"]) {
  return z
    .object({
      newPassword: z
        .string()
        .min(6, interpolate(t.validation.minLength, { min: 6 })),
      confirmPassword: z.string().min(1, t.validation.required),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t.validation.passwordMismatch,
      path: ["confirmPassword"],
    })
}

export default function ChangePasswordPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const schema = buildChangePasswordSchema(t)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  async function onSubmit(values: {
    newPassword: string
    confirmPassword: string
  }) {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/client/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: values.newPassword }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(t.client.profile.profileUpdated)
        router.push("/client/home")
      } else {
        toast.error(data.error ?? t.toasts.error)
      }
    } catch {
      toast.error(t.toasts.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t.clients.changeYourPassword}</CardTitle>
          <CardDescription>{t.clients.yourTrainerResetPassword}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t.auth.password}</Label>
              <Input
                type="password"
                placeholder="••••••"
                {...form.register("newPassword")}
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t.auth.confirmPassword}</Label>
              <Input
                type="password"
                placeholder="••••••"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin me-2" />}
              {t.common.confirm}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
