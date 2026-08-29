"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Pause, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n/client"
import { updateSubscriptionStatusAction } from "@/server/actions/subscription"
import { SubscriptionStatus } from "@/lib/db/enums"

interface StatusActionButtonsProps {
  clientId: string
  subscriptionId: string
  status: SubscriptionStatus
  className?: string
}

interface PendingAction {
  status: SubscriptionStatus
  icon: "pause" | "activate" | "expire"
}

function canExpire(status: SubscriptionStatus): boolean {
  return (
    status === SubscriptionStatus.ACTIVE ||
    status === SubscriptionStatus.TRIAL ||
    status === SubscriptionStatus.PAUSED
  )
}

export function StatusActionButtons({
  clientId,
  subscriptionId,
  status,
  className,
}: StatusActionButtonsProps) {
  const { t } = useI18n()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleConfirm() {
    if (!pendingAction) return
    setIsSubmitting(true)
    try {
      const result = await updateSubscriptionStatusAction(
        clientId,
        subscriptionId,
        pendingAction.status
      )
      if (!result.ok) {
        toast.error(result.error ?? t.subscription.errors.statusUpdateFailed)
        return
      }
      toast.success(statusToastKey(pendingAction.status, t))
      setPendingAction(null)
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

  const actions: PendingAction[] = []

  if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL) {
    actions.push({
      status: SubscriptionStatus.PAUSED,
      icon: "pause",
    })
  }
  if (status === SubscriptionStatus.PAUSED) {
    actions.push({
      status: SubscriptionStatus.ACTIVE,
      icon: "activate",
    })
  }
  if (canExpire(status)) {
    actions.push({
      status: SubscriptionStatus.EXPIRED,
      icon: "expire",
    })
  }

  if (actions.length === 0) return null

  const iconFor = (icon: PendingAction["icon"]) =>
    icon === "pause" ? (
      <Pause className="size-3.5" />
    ) : icon === "activate" ? (
      <Play className="size-3.5" />
    ) : (
      <X className="size-3.5" />
    )

  const labelFor = (action: PendingAction) =>
    action.icon === "pause"
      ? t.subscription.actions.pause
      : action.icon === "activate"
        ? t.subscription.actions.activate
        : t.subscription.actions.markExpired

  return (
    <>
      <div className={className}>
        {actions.map((action) => (
          <Button
            key={action.status}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPendingAction(action)}
          >
            {iconFor(action.icon)}
            {labelFor(action)}
          </Button>
        ))}
      </div>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.subscription.actions.confirmTitle}</DialogTitle>
            <DialogDescription>
              {pendingAction
                ? t.subscription.actions.confirmDescription.replace(
                    "{value}",
                    labelFor(pendingAction)
                  )
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant={
                pendingAction?.status === SubscriptionStatus.EXPIRED
                  ? "destructive"
                  : "default"
              }
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t.common.saving}
                </>
              ) : (
                t.common.confirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function statusToastKey(
  status: SubscriptionStatus,
  t: ReturnType<typeof useI18n>["t"]
) {
  switch (status) {
    case SubscriptionStatus.PAUSED:
      return t.subscription.statusToasts.paused
    case SubscriptionStatus.ACTIVE:
      return t.subscription.statusToasts.activated
    case SubscriptionStatus.EXPIRED:
      return t.subscription.statusToasts.expired
    default:
      return t.subscription.statusToasts.updated
  }
}
