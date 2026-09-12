"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, Check, Clapperboard, FileImage, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { formatDate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"
import type { ProgressMedia } from "@/lib/db/types"
import { getMediaItemAction, reviewMediaAction } from "@/server/actions/media"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function TypeIcon({ type }: { type: ProgressMedia["type"] }) {
  if (type === "FORM_VIDEO") return <Clapperboard className="size-5" />
  if (type === "PROGRESS_PHOTO") return <Camera className="size-5" />
  return <FileImage className="size-5" />
}

function ReviewForm({ mediaId, initialFeedback }: { mediaId: string; initialFeedback: string | null }) {
  const { t } = useI18n()
  const router = useRouter()
  const [feedback, setFeedback] = useState(initialFeedback ?? "")
  const [pending, startTransition] = useTransition()

  function onSave() {
    startTransition(async () => {
      const result = await reviewMediaAction({ mediaId, feedback })
      if (result.ok) {
        toast.success(t.media.saveFeedback)
        router.refresh()
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold">{t.media.feedback}</label>
      <Textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder={t.media.feedbackPlaceholder}
        rows={3}
        maxLength={1000}
      />
      <Button size="sm" onClick={onSave} disabled={pending} className="gap-1.5">
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        {t.media.saveFeedback}
      </Button>
    </div>
  )
}

export function MediaGallery({
  items,
  locale,
  canReview,
  emptyTitle,
  emptyDescription,
}: {
  items: ProgressMedia[]
  locale: Locale
  canReview: boolean
  emptyTitle: string
  emptyDescription: string
}) {
  const { t } = useI18n()
  const [openId, setOpenId] = useState<string | null>(null)
  const [full, setFull] = useState<ProgressMedia | null>(null)
  const [loading, setLoading] = useState(false)

  const types = lookup(t, "media.types") as unknown as Record<string, string>

  async function openItem(id: string) {
    setOpenId(id)
    setFull(null)
    setLoading(true)
    const result = await getMediaItemAction(id)
    setLoading(false)
    if (result.ok) {
      setFull(result.media)
    } else {
      toast.error(t.toasts.error)
      setOpenId(null)
    }
  }

  const active = items.find((i) => i.id === openId) ?? null

  return (
    <>
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Camera className="size-6" />
            </span>
            <p className="text-sm font-semibold">{emptyTitle}</p>
            <p className="max-w-[36ch] text-xs text-muted-foreground">{emptyDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openItem(item.id)}
              className="group overflow-hidden rounded-xl border bg-card text-start transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="flex aspect-square flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground transition-colors group-hover:bg-muted/70">
                <TypeIcon type={item.type} />
                <span className="px-2 text-center text-[11px] font-medium leading-tight">
                  {types[item.type.toLowerCase()] ?? item.type}
                </span>
              </div>
              <div className="space-y-1 p-2.5">
                <p className="truncate text-xs font-semibold">{item.title ?? types[item.type.toLowerCase()]}</p>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {formatDate(item.createdAt, locale)}
                  </span>
                  {item.status === "PENDING" ? (
                    <Badge className="bg-energy-500 text-white">{t.media.pending}</Badge>
                  ) : (
                    <Badge className="bg-performance-500 text-white">{t.media.reviewed}</Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={openId !== null} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              {active?.title ?? (active ? types[active.type.toLowerCase()] : "")}
            </DialogTitle>
          </DialogHeader>
          {loading || !full ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {full.type === "FORM_VIDEO" ? (
                <video
                  src={full.storageUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className={cn("max-h-[50dvh] w-full rounded-xl border bg-black")}
                />
              ) : (
                // Receipts/media are user-uploaded data URLs; next/image cannot optimize them.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={full.storageUrl}
                  alt={full.title ?? ""}
                  className="max-h-[50dvh] w-full rounded-xl border object-contain"
                  loading="lazy"
                />
              )}
              {full.note ? <p className="text-sm text-muted-foreground">{full.note}</p> : null}
              {full.feedback ? (
                <div className="rounded-xl border border-performance-500/30 bg-performance-500/5 p-3">
                  <p className="text-xs font-semibold">{t.media.feedback}</p>
                  <p className="mt-1 text-sm leading-relaxed">{full.feedback}</p>
                </div>
              ) : null}
              {canReview ? (
                <ReviewForm mediaId={full.id} initialFeedback={full.feedback} />
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
