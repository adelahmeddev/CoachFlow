"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"
import type { z } from "zod"
import { useI18n } from "@/lib/i18n/client"
import { buildCreateTrainerSchema, translateTrainerFieldError } from "@/lib/validations/admin"
import { adminCreateTrainerAction } from "@/server/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type CreateTrainerFormValues = z.infer<ReturnType<typeof buildCreateTrainerSchema>>

export function CreateTrainerDialog() {
  const { t } = useI18n()
  const schema = buildCreateTrainerSchema(t)
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateTrainerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: CreateTrainerFormValues) {
    setIsSubmitting(true)
    setServerError(null)

    const result = await adminCreateTrainerAction({
      fullName: values.fullName,
      phone: values.phone,
      password: values.password,
      confirmPassword: values.confirmPassword,
    })

    if (!result.ok) {
      if ("fieldErrors" in result && result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages && messages.length > 0) {
            form.setError(field as keyof CreateTrainerFormValues, {
              type: "server",
              message: translateTrainerFieldError(t, messages[0]),
            })
          }
        }
      } else if ("code" in result && result.code === "PHONE_EXISTS") {
        setServerError(t.admin.createTrainer.errors.phoneExists)
      } else {
        setServerError(t.toasts.genericError)
      }
      setIsSubmitting(false)
      return
    }

    toast.success(t.toasts.trainerCreated)
    setIsSubmitting(false)
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          {t.admin.trainers.create}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.admin.createTrainer.title}</DialogTitle>
          <DialogDescription>{t.admin.createTrainer.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-trainer-fullName">
              {t.admin.createTrainer.fullName}
            </Label>
            <Input
              id="admin-trainer-fullName"
              autoComplete="off"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-trainer-phone">
              {t.admin.createTrainer.phone}
            </Label>
            <Input
              id="admin-trainer-phone"
              type="tel"
              dir="ltr"
              autoComplete="off"
              {...form.register("phone")}
            />
            <p className="text-xs text-muted-foreground">
              {t.admin.createTrainer.phone}
            </p>
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-trainer-password">
              {t.admin.createTrainer.password}
            </Label>
            <Input
              id="admin-trainer-password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-trainer-confirm">
              {t.admin.createTrainer.confirmPassword}
            </Label>
            <Input
              id="admin-trainer-confirm"
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {t.admin.createTrainer.creating}
                </>
              ) : (
                t.admin.createTrainer.submit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
