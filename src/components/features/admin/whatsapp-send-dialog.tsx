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
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import { ExternalLink, MessageCircle } from "lucide-react"

interface WhatsAppSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  phone: string
  coachName: string
  initialMessage: string
}

export function WhatsAppSendDialog({
  open,
  onOpenChange,
  title,
  phone,
  coachName,
  initialMessage,
}: WhatsAppSendDialogProps) {
  const [message, setMessage] = useState(initialMessage)

  const handleSend = () => {
    const url = buildWhatsAppUrl(phone, message)
    window.open(url, "_blank", "noopener,noreferrer")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageCircle className="size-5 text-emerald-500" aria-hidden="true" />
            {title} ({coachName})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              رقم الهاتف: <b dir="ltr">{phone}</b>
            </span>
            <span>عدد الأحرف: {message.length}</span>
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="resize-none text-sm leading-relaxed"
            placeholder="نص رسالة الواتساب..."
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={!message.trim() || !phone}
            onClick={handleSend}
          >
            <span>فتح في واتساب</span>
            <ExternalLink className="size-4" aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
