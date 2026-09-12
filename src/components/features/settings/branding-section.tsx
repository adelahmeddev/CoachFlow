"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n/client"
import { useBranding, notifyBrandingUpdated, type Branding } from "@/components/branding/branding-provider"
import { LogoEditorDialog } from "@/components/features/settings/logo-editor"
import { coachRemoveLogoAction, coachUpdateBrandingAction, coachUploadLogoAction } from "@/server/actions/branding"
import { normalizeFacebookUrl, normalizeInstagramUrl, normalizeWhatsappUrl } from "@/lib/validations/branding"
import { normalizePickedImage } from "@/components/features/settings/normalize-picked-image"

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml"
const MAX_BYTES = 2 * 1024 * 1024

/**
 * Coach self-service branding (Settings → Branding). The logo shown here
 * comes from the same live BrandingProvider as the sidebar/topnav, so a
 * save updates the whole platform instantly via the branding:updated event
 * (plus router.refresh + layout revalidation for reload/login persistence).
 */
export function BrandingSection() {
  const { t } = useI18n()
  const router = useRouter()
  const branding = useBranding()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [pickedSrc, setPickedSrc] = useState<string | null>(null)
  const [existingSrc, setExistingSrc] = useState<string | null>(null)
  const [brandName, setBrandName] = useState(branding.brandName === "Coach Flow" ? "" : branding.brandName)
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor)
  const [whatsapp, setWhatsapp] = useState(branding.whatsappUrl ?? "")
  const [instagram, setInstagram] = useState(branding.instagramUrl ?? "")
  const [facebook, setFacebook] = useState(branding.facebookUrl ?? "")
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const s = t.settings.branding

  function pickFile() {
    fileRef.current?.click()
  }

  /** Pencil edit: re-edit the current logo in place (no re-upload).
   *  Without a logo, fall back to the file picker. */
  function editExisting() {
    if (branding.logoUrl) {
      setExistingSrc(branding.logoUrl)
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
    // SVG has no pixels to crop — upload directly instead of the editor.
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
    const res = await coachUploadLogoAction(fd)
    if (!res.ok) {
      toast.error(s.errors[res.error as keyof typeof s.errors] ?? t.toasts.genericError)
      return
    }
    notifyBrandingUpdated(res.branding as Branding)
    router.refresh()
    toast.success(s.logoSavedToast)
  }

  async function onSaveDetails() {
    setSaving(true)
    try {
      // Instant client-side check (server re-validates authoritatively).
      let socials: { whatsappUrl: string | null; facebookUrl: string | null; instagramUrl: string | null }
      try {
        socials = {
          whatsappUrl: normalizeWhatsappUrl(whatsapp),
          facebookUrl: normalizeFacebookUrl(facebook),
          instagramUrl: normalizeInstagramUrl(instagram),
        }
      } catch {
        toast.error(s.errors.INVALID_SOCIAL ?? t.toasts.genericError)
        return
      }
      const res = await coachUpdateBrandingAction({
        brandName: brandName.trim() || null,
        primaryColor,
        ...socials,
      })
      if (!res.ok) {
        toast.error(s.errors[res.error as keyof typeof s.errors] ?? t.toasts.genericError)
        return
      }
      notifyBrandingUpdated(res.branding as Branding)
      router.refresh()
      toast.success(s.savedToast)
    } finally {
      setSaving(false)
    }
  }

  async function onRemoveLogo() {
    if (!branding.logoUrl) return
    setRemoving(true)
    try {
      const res = await coachRemoveLogoAction()
      if (!res.ok) {
        toast.error(t.toasts.genericError)
        return
      }
      notifyBrandingUpdated(res.branding as Branding)
      router.refresh()
      toast.success(s.removedToast)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo row — Facebook-profile-picture style: current logo + Change */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-soft ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
            {branding.logoUrl ? (
              <img
                key={branding.logoUrl}
                src={branding.logoUrl}
                alt={branding.brandName}
                className="h-full w-full object-contain p-1.5"
              />
            ) : (
              <img src="/brand/logo.png" alt="Coach Flow" className="h-full w-full object-contain" />
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={editExisting}
            className="absolute -bottom-1 -end-1 size-8 rounded-full shadow-medium"
            aria-label={s.changeLogo}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{branding.brandName}</p>
          <p className="max-w-[260px] text-xs text-muted-foreground">{s.logoHint}</p>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={pickFile}>
              {s.changeLogo}
            </Button>
            {branding.logoUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={onRemoveLogo} disabled={removing}>
                {removing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {s.removeLogo}
              </Button>
            )}
          </div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept={ACCEPT} onChange={onFile} className="hidden" aria-hidden="true" tabIndex={-1} />

      {/* Brand name + color */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="branding-name">{s.brandName}</Label>
          <Input
            id="branding-name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder={s.brandNamePlaceholder}
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="branding-color">{s.primaryColor}</Label>
          <div className="flex items-center gap-2">
            <input
              id="branding-color"
              type="color"
              value={/^#([0-9A-Fa-f]{6})$/.test(primaryColor) ? primaryColor : "#961112"}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="size-10 cursor-pointer rounded border p-1"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#961112"
              className="font-mono"
              maxLength={7}
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Social links */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="branding-whatsapp">{s.whatsapp}</Label>
          <Input
            id="branding-whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder={s.whatsappPlaceholder}
            dir="ltr"
            inputMode="tel"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="branding-instagram">{s.instagram}</Label>
          <Input
            id="branding-instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder={s.instagramPlaceholder}
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="branding-facebook">{s.facebook}</Label>
          <Input
            id="branding-facebook"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder={s.facebookPlaceholder}
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <Button type="button" onClick={onSaveDetails} disabled={saving} className="min-w-[160px]">
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {s.saving}
            </>
          ) : (
            s.save
          )}
        </Button>
      </div>

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
        onSaved={clearEditorSrcs}
      />
    </div>
  )
}
