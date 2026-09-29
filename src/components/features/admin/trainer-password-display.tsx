"use client"

import { useState } from "react"
import { Eye, EyeOff, Copy, Check, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"
import { ResetTrainerPasswordDialog } from "@/components/features/admin/reset-trainer-password-dialog"

interface TrainerPasswordDisplayProps {
  coachId: string
  coachName: string
  password: string | null
  compact?: boolean
}

export function TrainerPasswordDisplay({
  coachId,
  coachName,
  password,
  compact = false,
}: TrainerPasswordDisplayProps) {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCopy = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      toast.success(t.admin.trainers.resetPassword.copied)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  if (!password) {
    return (
      <>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground italic">
            {t.admin.trainers.resetPassword.notSet}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary hover:text-primary"
            onClick={() => setDialogOpen(true)}
          >
            <KeyRound className="size-3.5 me-1" />
            {t.admin.trainers.resetPassword.setPassword}
          </Button>
        </div>
        <ResetTrainerPasswordDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          coachId={coachId}
          coachName={coachName}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <span
          className={`font-mono text-xs select-all rounded bg-muted/60 px-1.5 py-0.5 ${
            show ? "text-foreground font-semibold" : "text-muted-foreground tracking-widest"
          }`}
          dir="ltr"
        >
          {show ? password : "••••••••"}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={() => setShow(!show)}
          title={show ? t.admin.trainers.resetPassword.hidePassword : t.admin.trainers.resetPassword.showPassword}
          aria-label={show ? t.admin.trainers.resetPassword.hidePassword : t.admin.trainers.resetPassword.showPassword}
        >
          {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          title={t.admin.trainers.resetPassword.copyPassword}
          aria-label={t.admin.trainers.resetPassword.copyPassword}
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </Button>

        {!compact && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => setDialogOpen(true)}
            title={t.admin.trainers.resetPassword.title}
            aria-label={t.admin.trainers.resetPassword.title}
          >
            <KeyRound className="size-3.5" />
          </Button>
        )}
      </div>

      <ResetTrainerPasswordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coachId={coachId}
        coachName={coachName}
      />
    </>
  )
}
