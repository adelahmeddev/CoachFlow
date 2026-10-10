"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { deleteClientNutritionPlanAction } from "@/server/actions/nutrition"
import { cn } from "@/lib/utils"

interface DeleteNutritionPlanButtonProps {
  planId: string
  clientId: string
  planName?: string
  isHistoryRow?: boolean
  className?: string
  redirectTo?: string
  onSuccess?: () => void
}

export function DeleteNutritionPlanButton({
  planId,
  clientId,
  planName,
  isHistoryRow = false,
  className,
  redirectTo,
  onSuccess,
}: DeleteNutritionPlanButtonProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const res = await deleteClientNutritionPlanAction(planId)
        if (!res.ok) {
          toast.error(
            t.nutrition.deletePlanFailed ||
              (isAr ? "فشل حذف خطة التغذية" : "Failed to delete nutrition plan")
          )
          return
        }

        toast.success(
          t.nutrition.planDeletedToast ||
            (isAr ? "تم حذف خطة التغذية بنجاح" : "Nutrition plan deleted")
        )
        setOpen(false)

        if (redirectTo) {
          router.push(redirectTo)
        } else if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } catch {
        toast.error(
          t.nutrition.deletePlanFailed ||
            (isAr ? "فشل حذف خطة التغذية" : "Failed to delete nutrition plan")
        )
      }
    })
  }

  const deleteLabel =
    t.nutrition.deletePlan || (isAr ? "حذف الخطة" : "Delete Plan")

  return (
    <>
      {isHistoryRow ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          className={cn(
            "size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
            className
          )}
          title={deleteLabel}
          aria-label={deleteLabel}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className={cn(
            "rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60 font-semibold text-xs h-9 gap-1.5 transition-all shadow-none",
            className
          )}
        >
          <Trash2 className="size-3.5" />
          <span>{deleteLabel}</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="size-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold">
              {t.nutrition.deletePlanConfirmTitle ||
                (isAr ? "حذف خطة التغذية؟" : "Delete Nutrition Plan?")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
              {t.nutrition.deletePlanConfirmDescription ||
                (isAr
                  ? "هل أنت متأكد من حذف خطة التغذية هذه؟ سيتم حذف الخطة وجميع الوجبات والمكملات المرتبطة بها نهائياً."
                  : "Are you sure you want to delete this nutrition plan? This will permanently remove the plan and all its assigned meals.")}
            </DialogDescription>
          </DialogHeader>

          {planName && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">
                {isAr ? "الخطة المحددة:" : "Target Plan:"}
              </span>
              <Badge variant="outline" className="font-semibold text-foreground">
                {planName}
              </Badge>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="rounded-xl"
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl gap-2 font-semibold shadow-soft"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              <span>{t.common.delete}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
