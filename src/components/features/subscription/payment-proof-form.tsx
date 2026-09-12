"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ReceiptText, Upload } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"
import type { PaymentProof } from "@/lib/db/types"
import { submitPaymentProofAction } from "@/server/actions/payment-proof"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

function StatusBadge({ status, t }: { status: PaymentProof["status"]; t: { pending: string; approved: string; rejected: string } }) {
  if (status === "APPROVED") return <Badge className="bg-performance-500 text-white">{t.approved}</Badge>
  if (status === "REJECTED") return <Badge variant="destructive">{t.rejected}</Badge>
  return <Badge className="bg-energy-500 text-white">{t.pending}</Badge>
}

export function PaymentProofForm({
  subscriptions,
  proofs,
  locale,
}: {
  subscriptions: Array<{ id: string; planName: string }>
  proofs: PaymentProof[]
  locale: Locale
}) {
  const { t } = useI18n()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitPaymentProofAction(formData)
      if (result.ok) {
        toast.success(t.paymentProof.sent)
        if (fileRef.current) fileRef.current.value = ""
        setFileName(null)
        router.refresh()
      } else if (result.error === "TOO_LARGE") {
        toast.error(t.paymentProof.receiptHint)
      } else if (result.error === "INVALID_TYPE" || result.error === "NO_FILE") {
        toast.error(t.paymentProof.receiptHint)
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 py-4">
          <ReceiptText className="size-5 text-brand-600" />
          <div>
            <CardTitle className="text-base">{t.paymentProof.submitTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">{t.paymentProof.submitSubtitle}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form
            action={onSubmit}
            className="space-y-4"
            onSubmit={(e) => {
              if (!fileRef.current?.files?.[0]) {
                e.preventDefault()
                toast.error(t.paymentProof.receiptHint)
              }
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="proof-file" className="text-xs font-semibold">
                {t.paymentProof.receipt}
              </label>
              <label
                htmlFor="proof-file"
                className="flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-4 text-center transition-colors hover:border-brand-400 hover:bg-muted/40"
              >
                <Upload className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {fileName ?? t.paymentProof.receipt}
                </span>
                <span className="text-[11px] text-muted-foreground">{t.paymentProof.receiptHint}</span>
              </label>
              <input
                id="proof-file"
                ref={fileRef}
                name="file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="proof-amount" className="text-xs font-semibold">
                  {t.paymentProof.amount}
                </label>
                <input
                  id="proof-amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step="any"
                  placeholder={t.paymentProof.amountPlaceholder}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-base tabular-nums shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="proof-sub" className="text-xs font-semibold">
                  {t.paymentProof.subscription}
                </label>
                <select
                  id="proof-sub"
                  name="subscriptionId"
                  defaultValue=""
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">{t.paymentProof.noSubscription}</option>
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.planName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="proof-note" className="text-xs font-semibold">
                {t.paymentProof.note}
              </label>
              <Textarea
                id="proof-note"
                name="note"
                placeholder={t.paymentProof.notePlaceholder}
                rows={2}
                maxLength={500}
              />
            </div>

            <Button type="submit" disabled={pending} className="w-full rounded-xl">
              {pending ? <Loader2 className="size-4 animate-spin me-2" /> : null}
              {t.paymentProof.submit}
            </Button>
          </form>
        </CardContent>
      </Card>

      {proofs.length > 0 ? (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">{t.paymentProof.historyTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proofs.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <StatusBadge status={p.status} t={t.paymentProof} />
                <span className="truncate text-xs text-muted-foreground tabular-nums">
                  {p.amount != null ? `${p.amount} EGP • ` : ""}
                  {formatDate(p.createdAt, locale)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
