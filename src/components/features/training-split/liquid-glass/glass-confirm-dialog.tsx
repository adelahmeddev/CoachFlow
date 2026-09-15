"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GlassSheen } from "./glass-sheen"
import { AlertCircle } from "lucide-react"

interface GlassConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel?: () => void
}

export function GlassConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: GlassConfirmDialogProps) {
  function handleConfirm() {
    onConfirm()
    onOpenChange(false)
  }

  function handleCancel() {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-white/15 bg-card/85 p-6 backdrop-blur-2xl shadow-2xl dark:border-white/10 dark:bg-neutral-900/85">
        <GlassSheen opacity={0.7} />
        
        <DialogHeader className="gap-2 text-start">
          <div className="flex items-center gap-2.5">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${destructive ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-brand-500/30 bg-brand-500/10 text-brand-400"}`}>
              <AlertCircle className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex-row justify-end gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="rounded-xl border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            className="rounded-xl shadow-glow"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
