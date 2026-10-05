"use client"

import { useState, useTransition } from "react"
import { Trash2, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  removeExerciseAction,
  resetExerciseAction,
} from "@/server/actions/exercise-library"
import { useI18n } from "@/lib/i18n/client"

interface RemoveExerciseButtonProps {
  exerciseId: string
  mode?: "remove" | "reset"
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function RemoveExerciseButton({
  exerciseId,
  mode = "remove",
  trigger,
  onSuccess,
}: RemoveExerciseButtonProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        if (mode === "reset") {
          const res = await resetExerciseAction(exerciseId)
          if (!res.ok) {
            toast.error(res.error)
            return
          }
          toast.success(t.exerciseLibrary.toasts.reset)
        } else {
          const res = await removeExerciseAction(exerciseId)
          if (!res.ok) {
            toast.error(res.error)
            return
          }
          toast.success(t.exerciseLibrary.toasts.removed)
        }
        setOpen(false)
        onSuccess?.()
      } catch {
        toast.error("Action failed")
      }
    })
  }

  const isReset = mode === "reset"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : isReset ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
            title={t.exerciseLibrary.resetExercise}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 text-muted-foreground hover:text-destructive"
            title={t.exerciseLibrary.removeExercise}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isReset
              ? t.exerciseLibrary.confirmResetTitle
              : t.exerciseLibrary.confirmRemoveTitle}
          </DialogTitle>
          <DialogDescription>
            {isReset
              ? t.exerciseLibrary.confirmResetDescription
              : t.exerciseLibrary.confirmRemoveDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              {t.exerciseLibrary.form.cancel}
            </Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className={
              isReset
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }
          >
            {isPending && <Loader2 className="size-4 animate-spin me-1.5" />}
            {isReset
              ? t.exerciseLibrary.resetExercise
              : t.exerciseLibrary.removeExercise}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
