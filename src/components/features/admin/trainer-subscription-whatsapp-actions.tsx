"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  PhoneForwarded,
  Settings2,
} from "lucide-react"
import { WhatsAppSendDialog } from "./whatsapp-send-dialog"
import { WhatsAppTemplatesDialog } from "./whatsapp-templates-dialog"
import { interpolateTemplate } from "@/lib/whatsapp"
import type { WhatsAppTemplatesInput } from "@/lib/validations/admin"

interface TrainerSubscriptionWhatsAppActionsProps {
  coachName: string
  phone: string
  subscription: {
    status: string
    endDate: Date | string | null
  } | null
  initialTemplates: WhatsAppTemplatesInput
}

export function TrainerSubscriptionWhatsAppActions({
  coachName,
  phone,
  subscription,
  initialTemplates,
}: TrainerSubscriptionWhatsAppActionsProps) {
  const [templates, setTemplates] =
    useState<WhatsAppTemplatesInput>(initialTemplates)
  const [activeModal, setActiveModal] = useState<
    "reminder" | "followup" | "settings" | null
  >(null)

  if (!subscription || !subscription.endDate) return null

  const now = new Date()
  const end = new Date(subscription.endDate)
  const diffDays = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  const isExpired = subscription.status === "EXPIRED" || diffDays <= 0
  const isExpiringSoon =
    subscription.status === "ACTIVE" && diffDays <= 7 && diffDays > 0

  if (!isExpired && !isExpiringSoon) {
    return null
  }

  const formattedEndDate = end.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const vars = {
    coach_name: coachName,
    end_date: formattedEndDate,
    days_left: isExpired ? 0 : diffDays,
  }

  const reminderText = interpolateTemplate(templates.reminderTemplate, vars)
  const followupText = interpolateTemplate(templates.followupTemplate, vars)

  return (
    <>
      <div className="relative mb-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-md sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-500">
            {isExpired ? (
              <AlertTriangle className="size-5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>حالة اشتراك المدرب:</span>
              <span
                className={isExpired ? "font-bold text-red-500" : "font-bold text-amber-500"}
              >
                {isExpired ? "منتهي الصلاحية" : `ينتهي خلال ${diffDays} يوم`}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              تاريخ الانتهاء: {formattedEndDate} • تواصل مع الكوتش لتفادي توقف الخدمة.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            size="sm"
            onClick={() => setActiveModal("reminder")}
            className="flex-1 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700 sm:flex-none"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            تذكير واتساب
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal("followup")}
            className="flex-1 gap-1.5 border-border/60 text-xs hover:bg-muted/50 sm:flex-none"
          >
            <PhoneForwarded className="size-4 text-emerald-600" aria-hidden="true" />
            متابعة
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setActiveModal("settings")}
            title="تعديل قوالب الرسائل"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {activeModal === "reminder" && (
        <WhatsAppSendDialog
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          title="إرسال تذكير انتهاء الاشتراك"
          coachName={coachName}
          phone={phone}
          initialMessage={reminderText}
        />
      )}

      {activeModal === "followup" && (
        <WhatsAppSendDialog
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          title="إرسال رسالة متابعة"
          coachName={coachName}
          phone={phone}
          initialMessage={followupText}
        />
      )}

      {activeModal === "settings" && (
        <WhatsAppTemplatesDialog
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          initialTemplates={templates}
          onSaved={(newTemplates) => setTemplates(newTemplates)}
        />
      )}
    </>
  )
}
