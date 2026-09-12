"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { uploadMediaAction } from "@/server/actions/media"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export function MediaUploadForm() {
  const { t } = useI18n()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<"photo" | "video">("photo")
  const [fileName, setFileName] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const types = lookup(t, "media.types") as unknown as Record<string, string>

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadMediaAction(formData)
      if (result.ok) {
        toast.success(t.media.sent)
        if (fileRef.current) fileRef.current.value = ""
        setFileName(null)
        router.refresh()
      } else if (result.error === "TOO_LARGE" || result.error === "INVALID_TYPE" || result.error === "NO_FILE") {
        toast.error(kind === "photo" ? t.media.fileHintPhoto : t.media.fileHintVideo)
      } else if (result.error === "TYPE_MISMATCH") {
        toast.error(t.toasts.error)
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-base">{t.media.uploadTitle}</CardTitle>
        <p className="text-xs text-muted-foreground">{t.media.uploadSubtitle}</p>
      </CardHeader>
      <CardContent>
        <form
          action={onSubmit}
          className="space-y-4"
          onSubmit={(e) => {
            if (!fileRef.current?.files?.[0]) {
              e.preventDefault()
              toast.error(t.media.fileHintPhoto)
            }
          }}
        >
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t.media.mediaType}>
            {(
              [
                { value: "photo", label: types.progress_photo, type: "PROGRESS_PHOTO" },
                { value: "video", label: types.form_video, type: "FORM_VIDEO" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={kind === opt.value}
                onClick={() => {
                  setKind(opt.value)
                  setFileName(null)
                  if (fileRef.current) fileRef.current.value = ""
                }}
                className={
                  kind === opt.value
                    ? "rounded-xl border border-brand-500 bg-brand-500/10 px-3 py-2.5 text-sm font-semibold"
                    : "rounded-xl border px-3 py-2.5 text-sm text-muted-foreground"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={kind === "photo" ? "PROGRESS_PHOTO" : "FORM_VIDEO"} />

          <div className="space-y-1.5">
            <label htmlFor="media-file" className="text-xs font-semibold">
              {t.media.file}
            </label>
            <label
              htmlFor="media-file"
              className="flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-4 text-center transition-colors hover:border-brand-400 hover:bg-muted/40"
            >
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">{fileName ?? t.media.file}</span>
              <span className="text-[11px] text-muted-foreground">
                {kind === "photo" ? t.media.fileHintPhoto : t.media.fileHintVideo}
              </span>
            </label>
            <input
              id="media-file"
              ref={fileRef}
              name="file"
              type="file"
              accept={kind === "photo" ? "image/png,image/jpeg,image/webp" : "video/mp4,video/webm,video/quicktime"}
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="media-title" className="text-xs font-semibold">
              {t.goals.goalTitle} ({t.common.optional})
            </label>
            <input
              id="media-title"
              name="title"
              type="text"
              maxLength={100}
              placeholder={t.media.titlePlaceholder}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="media-note" className="text-xs font-semibold">
              {t.common.notes} ({t.common.optional})
            </label>
            <Textarea
              id="media-note"
              name="note"
              placeholder={t.media.notePlaceholder}
              rows={2}
              maxLength={500}
            />
          </div>

          <Button type="submit" disabled={pending} className="w-full rounded-xl">
            {pending ? <Loader2 className="size-4 animate-spin me-2" /> : null}
            {t.media.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
