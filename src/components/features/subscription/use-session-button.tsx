"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"
import { consumeSessionAction } from "@/server/actions/subscription"

interface UseSessionButtonProps {
  clientId: string
  subscriptionId: string
}

export function UseSessionButton({
  clientId,
  subscriptionId,
}: UseSessionButtonProps) {
  const { t } = useI18n()
  const [isPending, setIsPending] = useState(false)

  async function handleUse() {
    setIsPending(true)
    try {
      const result = await consumeSessionAction(clientId, subscriptionId)
      if (!result.ok) {
        toast.error(result.error ?? t.subscription.errors.sessionUseFailed)
        return
      }
      toast.success(t.toasts.sessionUsed)
    } catch (e) {
      const err = e as { digest?: string }
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw e
      }
      toast.error(t.toasts.genericError)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleUse}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="me-1.5 size-3.5 animate-spin" />
      ) : (
        <Ticket className="me-1.5 size-3.5" />
      )}
      {t.subscription.useSession}
    </Button>
  )
}
