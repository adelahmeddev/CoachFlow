"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { buildResetTrainerPasswordSchema, type ResetTrainerPasswordInput } from "@/lib/validations/admin"
import { adminResetTrainerPasswordAction } from "@/server/actions/admin"
import { useRouter } from "next/navigation"
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
} from "@/components/ui/dialog"

interface ResetTrainerPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coachId: string
  coachName: string
}

export function ResetTrainerPasswordDialog({
  open,
  onOpenChange,
  coachId,
  coachName,
}: ResetTrainerPasswordDialogProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const schema = buildResetTrainerPasswordSchema(t)

  const form = useForm<ResetTrainerPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: ResetTrainerPasswordInput) {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const result = await adminResetTrainerPasswordAction(coachId, values.newPassword)
      if (!result.ok) {
        setServerError(result.error ?? t.toasts.genericError)
        setIsSubmitting(false)
        return
      }

      toast.success(t.admin.trainers.resetPassword.success)
      form.reset()
      onOpenChange(false)
      router.refresh()
    } catch {
      setServerError(t.toasts.genericError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isSubmitting) {
          if (!v) {
            form.reset()
            setServerError(null)
          }
          onOpenChange(v)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            {t.admin.trainers.resetPassword.title}
          </DialogTitle>
          <DialogDescription>
            {t.admin.trainers.resetPassword.description} ({coachName})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-reset-newPassword">
              {t.admin.trainers.resetPassword.newPassword}
            </Label>
            <div className="relative">
              <Input
                id="admin-reset-newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pe-10"
                {...form.register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? t.admin.trainers.resetPassword.hidePassword : t.admin.trainers.resetPassword.showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.formState.errors.newPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-reset-confirmPassword">
              {t.admin.trainers.resetPassword.confirmPassword}
            </Label>
            <div className="relative">
              <Input
                id="admin-reset-confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                className="pe-10"
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? t.admin.trainers.resetPassword.hidePassword : t.admin.trainers.resetPassword.showPassword}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t.admin.trainers.resetPassword.saving}
                </>
              ) : (
                t.admin.trainers.resetPassword.submit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
