"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n/client"
import {
  renewSubscriptionSchema,
  type RenewSubscriptionInput,
} from "@/lib/validations/subscription"
import { getPaymentStatusLabel } from "@/lib/i18n/labels"
import { renewSubscriptionAction } from "@/server/actions/subscription"
import { PaymentStatus, PlanType } from "@/generated/prisma/enums"

interface RenewSubscriptionDialogProps {
  clientId: string
  subscriptionId: string
  planType?: PlanType
}

const PAYMENT_VALUES = Object.values(PaymentStatus)

export function RenewSubscriptionDialog({
  clientId,
  subscriptionId,
  planType,
}: RenewSubscriptionDialogProps) {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RenewSubscriptionInput>({
    resolver: zodResolver(renewSubscriptionSchema),
    defaultValues: {
      newEndDate: "",
      resetSessions: true,
      paymentStatus: PaymentStatus.PAID,
    },
  })

  async function onSubmit(values: RenewSubscriptionInput) {
    setIsSubmitting(true)
    try {
      const result = await renewSubscriptionAction(clientId, subscriptionId, {
        newEndDate: values.newEndDate || undefined,
        resetSessions: values.resetSessions,
        paymentStatus: values.paymentStatus,
      })

      if (!result.ok) {
        toast.error(result.error ?? t.subscription.errors.renewFailed)
        return
      }

      toast.success(t.toasts.subscriptionRenewed)
      setOpen(false)
    } catch (e) {
      const err = e as { digest?: string }
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw e
      }
      toast.error(t.toasts.genericError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="size-3.5" />
          {t.subscription.renew}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.subscription.renewTitle}</DialogTitle>
          <DialogDescription>
            {t.subscription.renewDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEndDate">{t.subscription.newEndDate}</Label>
            <Input id="newEndDate" type="date" {...form.register("newEndDate")} />
            {planType === PlanType.PERIOD ? (
              <p className="text-xs text-muted-foreground">
                {t.subscription.renewPeriodHint}
              </p>
            ) : null}
          </div>

          {planType === PlanType.PERIOD ? null : (
            <div className="flex items-center gap-2 space-y-0">
              <Checkbox
                id="resetSessions"
                checked={form.watch("resetSessions")}
                onCheckedChange={(checked) =>
                  form.setValue("resetSessions", Boolean(checked))
                }
              />
              <Label htmlFor="resetSessions" className="font-normal">
                {t.subscription.resetSessions}
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="paymentStatus">
              {t.subscription.paymentStatus}
            </Label>
            <Select
              value={form.watch("paymentStatus")}
              onValueChange={(value) =>
                form.setValue("paymentStatus", value as PaymentStatus)
              }
            >
              <SelectTrigger id="paymentStatus" className="w-full">
                <SelectValue placeholder={t.subscription.selectPayment} />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getPaymentStatusLabel(value, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t.common.saving}
                </>
              ) : (
                t.subscription.renewTitle
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
