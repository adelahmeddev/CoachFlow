"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"
import { useBranding, notifyBrandingUpdated, type Branding } from "@/components/branding/branding-provider"
import { LogoEditorDialog } from "@/components/features/settings/logo-editor"
import { normalizePickedImage } from "@/components/features/settings/normalize-picked-image"
import { coachRemoveAvatarAction, coachUploadAvatarAction, coachUploadAvatarCroppedAction } from "@/server/actions/branding"

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml"
const MAX_BYTES = 2 * 1024 * 1024

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "C"
}

/**
 * Coach personal photo — independent from the brand logo. Same editor
 * mechanics, wired to the avatar actions; the photo feeds the client home
 * hero (never the brand mark slots).
 */
export function CoachPhotoSection() {
  const { t } = useI18n()
  const router = useRouter()
  const branding = useBranding()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [pickedSrc, setPickedSrc] = useState<string | null>(null)
  const [existingSrc, setExistingSrc] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const s = t.settings.branding

  function pickFile() {
    fileRef.current?.click()
  }

  function editExisting() {
    if (branding.avatarUrl) {
      setExistingSrc(branding.avatarUrl)
      setEditorOpen(true)
    } else {
      pickFile()
    }
  }

  function clearEditorSrcs() {
    if (pickedSrc?.startsWith("blob:")) URL.revokeObjectURL(pickedSrc)
    setPickedSrc(null)
    setExistingSrc(null)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    if (!ACCEPT.split(",").includes(f.type)) {
      toast.error(s.errors.INVALID_TYPE ?? s.invalidType)
      return
    }
    if (f.size > MAX_BYTES) {
      toast.error(s.errors.TOO_LARGE ?? s.tooLarge)
      return
    }
    if (f.type === "image/svg+xml") {
      void uploadSvgDirect(f)
      return
    }
    void openEditorWithImage(f)
  }

  async function openEditorWithImage(f: File) {
    const finalUrl = await normalizePickedImage(f)
    setExistingSrc(null)
    setPickedSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
      return finalUrl
    })
    setEditorOpen(true)
  }

  async function uploadSvgDirect(f: File) {
    const fd = new FormData()
    fd.set("file", f)
    const res = await coachUploadAvatarAction(fd)
    if (!res.ok) {
      toast.error(s.errors[res.error as keyof typeof s.errors] ?? t.toasts.genericError)
      return
    }
    notifyBrandingUpdated(res.branding as Branding)
    router.refresh()
    toast.success(s.photoSavedToast)
  }

  async function onRemove() {
    if (!branding.avatarUrl) return
    setRemoving(true)
    try {
      const res = await coachRemoveAvatarAction()
      if (!res.ok) {
        toast.error(t.toasts.genericError)
        return
      }
      notifyBrandingUpdated(res.branding as Branding)
      router.refresh()
      toast.success(s.photoRemovedToast)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-soft ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
            {branding.avatarUrl ? (
              <img
                key={branding.avatarUrl}
                src={branding.avatarUrl}
                alt={branding.brandName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center bg-brand-600 text-xl font-bold text-white dark:bg-brand-500">
                {initialsOf(branding.brandName)}
              </span>
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={editExisting}
            className="absolute -bottom-1 -end-1 size-8 rounded-full shadow-medium"
            aria-label={s.changePhoto}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{s.photoTitle}</p>
          <p className="max-w-[260px] text-xs text-muted-foreground">{s.photoHint}</p>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={editExisting}>
              {branding.avatarUrl ? s.editPhoto : s.changePhoto}
            </Button>
            {branding.avatarUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={removing}>
                {removing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {s.removePhoto}
              </Button>
            )}
          </div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept={ACCEPT} onChange={onFile} className="hidden" aria-hidden="true" tabIndex={-1} />

      <LogoEditorDialog
        key={pickedSrc ?? existingSrc ?? "none"}
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o)
          if (!o) clearEditorSrcs()
        }}
        src={pickedSrc}
        initialImageUrl={existingSrc}
        onReplaceImage={pickFile}
        uploadAction={coachUploadAvatarCroppedAction}
        editorTitle={s.photoEditorTitle}
        savedToast={s.photoSavedToast}
        onSaved={clearEditorSrcs}
      />
    </div>
  )
}
