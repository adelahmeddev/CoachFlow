"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n/client"
import { deleteNutritionTemplateAction } from "@/server/actions/nutrition"

export function DeleteTemplateButton({
  templateId,
  templateName,
  variant = "destructive",
}: {
  templateId: string
  templateName: string
  variant?: "destructive" | "ghost" | "outline"
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function confirmDelete() {
    setBusy(true)
    try {
      const result = await deleteNutritionTemplateAction(templateId)
      if (!result.ok) {
        toast.error(t.nutrition.deleteFailed)
        return
      }
      toast.success(t.nutrition.templateDeletedToast)
      setOpen(false)
      router.push("/nutrition-templates")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash2 className="size-4" />
        {t.common.delete}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.nutrition.deleteConfirm}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {templateName}
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? t.common.loading : t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
