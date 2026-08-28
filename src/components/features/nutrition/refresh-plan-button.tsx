"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n/client"
import { refreshPlanFromTemplateAction } from "@/server/actions/nutrition"

export function RefreshFromTemplateButton({
  planId,
  clientId,
}: {
  planId: string
  clientId: string
}) {
  const router = useRouter()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      const result = await refreshPlanFromTemplateAction(planId, clientId)
      if (!result.ok) {
        toast.error(t.toasts.genericError)
        return
      }
      toast.success(t.nutrition.updatedToast)
      setOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={busy}>
        <RefreshCw className="size-4" />
        {t.nutrition.updateFromTemplate}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.nutrition.updateFromTemplate}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t.nutrition.updateFromTemplateConfirm}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={confirm} disabled={busy}>
              {t.nutrition.updateFromTemplate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
