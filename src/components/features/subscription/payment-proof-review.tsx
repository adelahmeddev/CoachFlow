"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, ReceiptText, X } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"
import type { PaymentProof } from "@/lib/db/types"
import { reviewPaymentProofAction } from "@/server/actions/payment-proof"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

function StatusBadge({ status, t }: { status: PaymentProof["status"]; t: { pending: string; approved: string; rejected: string } }) {
  if (status === "APPROVED") return <Badge className="bg-performance-500 text-white">{t.approved}</Badge>
  if (status === "REJECTED") return <Badge variant="destructive">{t.rejected}</Badge>
  return <Badge className="bg-energy-500 text-white">{t.pending}</Badge>
}

function ReviewButtons({ proofId }: { proofId: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await reviewPaymentProofAction({ proofId, decision, note })
      if (result.ok) {
        toast.success(decision === "APPROVED" ? t.paymentProof.approvedToast : t.paymentProof.rejectedToast)
        router.refresh()
      } else if (result.error === "ALREADY_PROCESSED") {
        toast.error(t.paymentProof.alreadyProcessed)
        router.refresh()
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.paymentProof.reviewNotePlaceholder}
        rows={1}
        maxLength={500}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => decide("APPROVED")} disabled={pending} className="gap-1">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          {t.paymentProof.approve}
        </Button>
        <Button size="sm" variant="outline" onClick={() => decide("REJECTED")} disabled={pending} className="gap-1">
          <X className="size-3.5" />
          {t.paymentProof.reject}
        </Button>
      </div>
    </div>
  )
}

export function PaymentProofReview({
  proofs,
  locale,
}: {
  proofs: PaymentProof[]
  locale: Locale
}) {
  const { t } = useI18n()

  if (proofs.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 py-4">
        <ReceiptText className="size-5 text-brand-600" />
        <CardTitle className="text-base">{t.paymentProof.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {proofs.map((proof) => (
          <div key={proof.id} className="space-y-3 rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={proof.status} t={t.paymentProof} />
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDate(proof.createdAt, locale)}
                {proof.amount != null ? ` • ${proof.amount} EGP` : ""}
              </span>
            </div>
            <a href={proof.proofUrl} target="_blank" rel="noreferrer" title={t.paymentProof.viewReceipt}>
              {/* Receipts are user-uploaded data URLs; next/image cannot optimize them. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proof.proofUrl}
                alt={t.paymentProof.receipt}
                className="max-h-64 w-auto rounded-lg border object-contain"
                loading="lazy"
              />
            </a>
            {proof.note ? <p className="text-sm text-muted-foreground">{proof.note}</p> : null}
            {proof.status === "PENDING" ? <ReviewButtons proofId={proof.id} /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
