"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateWhatsAppTemplatesAction } from "@/server/actions/admin"
import type { WhatsAppTemplatesInput } from "@/lib/validations/admin"
import { toast } from "sonner"
import { Settings2, Sparkles } from "lucide-react"

interface WhatsAppTemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTemplates: WhatsAppTemplatesInput
  onSaved: (templates: WhatsAppTemplatesInput) => void
}

const TOKENS = ["{coach_name}", "{days_left}", "{end_date}"] as const

export function WhatsAppTemplatesDialog({
  open,
  onOpenChange,
  initialTemplates,
  onSaved,
}: WhatsAppTemplatesDialogProps) {
  const [reminder, setReminder] = useState(initialTemplates.reminderTemplate)
  const [followup, setFollowup] = useState(initialTemplates.followupTemplate)
  const [activeField, setActiveField] = useState<"reminder" | "followup">("reminder")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const insertVariable = (token: string) => {
    if (activeField === "reminder") {
      setReminder((prev) => `${prev}${token}`)
    } else {
      setFollowup((prev) => `${prev}${token}`)
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const res = await updateWhatsAppTemplatesAction({
        reminderTemplate: reminder,
        followupTemplate: followup,
      })

      if (!res.ok) {
        toast.error("error" in res && res.error ? res.error : "تعذر حفظ القوالب")
        return
      }

      toast.success("تم تحديث قوالب رسائل الواتساب بنجاح")
      onSaved({ reminderTemplate: reminder, followupTemplate: followup })
      onOpenChange(false)
    } catch {
      toast.error("حدث خطأ غير متوقع")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Settings2 className="size-5 text-primary" aria-hidden="true" />
            إعداد قوالب رسائل الواتساب
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5 rounded-lg border border-border/40 bg-muted/40 p-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 font-medium text-foreground">
              <Sparkles className="size-3.5 text-amber-500" aria-hidden="true" />
              المتغيرات المتاحة للإدراج التلقائي:
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TOKENS.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => insertVariable(token)}
                  className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[11px] transition-colors hover:border-primary/50"
                >
                  + {token}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">قالب رسالة التذكير (انتهاء الاشتراك)</Label>
            <Textarea
              value={reminder}
              onFocus={() => setActiveField("reminder")}
              onChange={(e) => setReminder(e.target.value)}
              rows={3}
              className="resize-none text-xs leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">قالب رسالة المتابعة والاطمئنان</Label>
            <Textarea
              value={followup}
              onFocus={() => setActiveField("followup")}
              onChange={(e) => setFollowup(e.target.value)}
              rows={3}
              className="resize-none text-xs leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button size="sm" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? "جاري الحفظ..." : "حفظ القوالب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
