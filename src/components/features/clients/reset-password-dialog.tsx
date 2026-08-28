"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { KeyRound, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { buildResetClientPasswordSchema } from "@/lib/validations/admin"
import { resetClientPasswordAction } from "@/server/actions/client-management"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ResetPasswordDialogProps {
  clientId: string
  clientName: string
  trigger?: React.ReactNode
}

export function ResetPasswordDialog({
  clientId,
  clientName,
  trigger,
}: ResetPasswordDialogProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const schema = buildResetClientPasswordSchema(t)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId,
      newPassword: "",
      forceChange: true,
    },
  })

  async function onSubmit(values: {
    clientId: string
    newPassword: string
    forceChange: boolean
  }) {
    setIsSubmitting(true)
    const result = await resetClientPasswordAction(
      values.clientId,
      values.newPassword,
      values.forceChange
    )
    setIsSubmitting(false)

    if (result.ok) {
      toast.success(t.clients.resetPasswordSuccess)
      setOpen(false)
      form.reset()
      router.refresh()
    } else {
      if (result.error === "CLIENT_NO_ACCOUNT") {
        toast.error(t.clients.resetPasswordNoAccount)
      } else {
        toast.error(t.toasts.error)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <KeyRound className="size-4" />
            {t.clients.resetPassword}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.clients.resetPassword}</DialogTitle>
          <DialogDescription>
            {t.clients.resetPasswordConfirm.replace("{name}", clientName)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("clientId")} />
          <div className="space-y-2">
            <Label>{t.clients.newTemporaryPassword}</Label>
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
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                {t.clients.forceChangeOnNextLogin}
              </Label>
            </div>
            <Switch
              checked={form.watch("forceChange")}
              onCheckedChange={(checked) =>
                form.setValue("forceChange", checked)
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin me-2" />
              ) : null}
              {t.common.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
