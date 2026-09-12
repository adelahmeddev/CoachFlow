"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  FlipHorizontal2,
  FlipVertical2,
  ImagePlus,
  Loader2,
  Maximize,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n/client"
import { notifyBrandingUpdated, type Branding } from "@/components/branding/branding-provider"
import { coachUploadCroppedLogoAction } from "@/server/actions/branding"

const MAX_ZOOM = 4
const OUTPUT_SIZE = 512
const NUDGE = 6
const NUDGE_BIG = 24

const normDeg = (d: number) => ((d + 540) % 360) - 180
const toRad = (d: number) => (d * Math.PI) / 180

interface LogoEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Object URL / data URL of the freshly picked image */
  src: string | null
  /** Existing logo URL to edit directly without re-uploading (used when src is null) */
  initialImageUrl?: string | null
  /** Open the file picker to replace the image entirely */
  onReplaceImage: () => void
  /** Override the cropped-upload target (default: coach logo). Must resolve
   *  with the fresh branding payload so the platform syncs instantly. */
  uploadAction?: (dataUrl: string) => Promise<{ ok: boolean; error?: string; branding?: Branding }>
  /** Override dialog title / success toast (default: logo strings) */
  editorTitle?: string
  savedToast?: string
  onSaved: () => void
}

/**
 * Facebook-profile-picture-style logo editor with full control:
 * drag-to-reposition, precise zoom (slider/buttons/wheel/double-click),
 * rotation (90° steps + fine slider), flip, reset, and keyboard nudging.
 *
 * The image always covers the square crop area (never stretched, never
 * empty space). Save crops via canvas with the exact visible transform, so
 * the stored bytes match the preview pixel-for-pixel.
 */
export function LogoEditorDialog({ open, onOpenChange, src, initialImageUrl, onReplaceImage, uploadAction, editorTitle, savedToast, onSaved }: LogoEditorDialogProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [boxW, setBoxW] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [saving, setSaving] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const s = t.settings.branding

  // NB: the parent remounts this dialog per image (key={src}), so useState
  // initial values are the per-image reset — no reset effect needed.
  const ready = natural.w > 0 && boxW > 0

  // Edit-in-place: when no new file was picked, resolve the existing logo URL
  // to a blob so canvas transforms can never taint. Falls back to the remote
  // URL directly (same-origin + crossOrigin stays untainted).
  const [resolvedExisting, setResolvedExisting] = useState<string | null>(null)
  useEffect(() => {
    if (src || !initialImageUrl || !open) return
    let cancelled = false
    fetch(initialImageUrl)
      .then((r) => {
        if (!r.ok) throw new Error("FETCH_FAILED")
        return r.blob()
      })
      .then((b) => {
        if (!cancelled) setResolvedExisting(URL.createObjectURL(b))
      })
      .catch(() => {
        if (!cancelled) setResolvedExisting(null)
      })
    return () => {
      cancelled = true
    }
  }, [src, initialImageUrl, open])
  useEffect(() => {
    return () => {
      if (resolvedExisting) URL.revokeObjectURL(resolvedExisting)
    }
  }, [resolvedExisting])

  const activeSrc = src ?? resolvedExisting ?? initialImageUrl ?? null

  // Cover scale for a rotation: the smallest bbox side of the rotated image
  // must fill the square at zoom=1.
  const scaleFor = (deg: number) => {
    const c = Math.abs(Math.cos(toRad(deg)))
    const sn = Math.abs(Math.sin(toRad(deg)))
    return boxW / Math.min(natural.w * c + natural.h * sn, natural.w * sn + natural.h * c)
  }
  // Minimum zoom so the rotated image's corners can never leave the square
  // empty: the square must fit inside the rotated rect.
  const minZoomFor = (deg: number) => {
    const c = Math.abs(Math.cos(toRad(deg)))
    const sn = Math.abs(Math.sin(toRad(deg)))
    const m = Math.min(natural.w * c + natural.h * sn, natural.w * sn + natural.h * c)
    return ((c + sn) * m) / Math.min(natural.w, natural.h)
  }

  const bs = ready ? scaleFor(rotation) : 1
  const minZoom = ready ? minZoomFor(rotation) : 1
  const dw = natural.w * bs * zoom
  const dh = natural.h * bs * zoom
  const transform = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

  /**
   * Exact placement: the wrapper center is clamped so all four square
   * corners stay inside the rotated image rect. Solved in the rotated frame
   * (u,w orthonormal basis) where the feasible set is just two intervals.
   */
  const place = useCallback((ccx: number, ccy: number, z: number, deg: number) => {
    const S = boxW
    const nw = natural.w
    const nh = natural.h
    if (S <= 0 || nw <= 0) return { x: ccx, y: ccy }
    const r = toRad(deg)
    const co = Math.cos(r)
    const si = Math.sin(r)
    const ac = Math.abs(co)
    const as = Math.abs(si)
    const m = Math.min(nw * ac + nh * as, nw * as + nh * ac)
    const b = S / m
    const w = nw * b * z
    const h = nh * b * z
    const ux = co
    const uy = si
    const wx = -si
    const wy = co
    let umin = Infinity
    let umax = -Infinity
    let wmin = Infinity
    let wmax = -Infinity
    const corners = [[0, 0], [S, 0], [0, S], [S, S]]
    for (const [qx, qy] of corners) {
      const a = ux * qx + uy * qy
      const bb = wx * qx + wy * qy
      if (a < umin) umin = a
      if (a > umax) umax = a
      if (bb < wmin) wmin = bb
      if (bb > wmax) wmax = bb
    }
    const lo1 = umax - w / 2
    const hi1 = umin + w / 2
    const lo2 = wmax - h / 2
    const hi2 = wmin + h / 2
    const pa = ux * ccx + uy * ccy
    const pb = wx * ccx + wy * ccy
    const fa = lo1 > hi1 ? (lo1 + hi1) / 2 : Math.min(hi1, Math.max(lo1, pa))
    const fb = lo2 > hi2 ? (lo2 + hi2) / 2 : Math.min(hi2, Math.max(lo2, pb))
    return { x: fa * ux + fb * wx - w / 2, y: fa * uy + fb * wy - h / 2 }
  }, [boxW, natural])

  /** Zoom about a box point, clamped to [minZoom(θ), MAX_ZOOM]. */
  const zoomAt = useCallback((px: number, py: number, nz: number, deg: number = rotation) => {
    if (!ready) return
    const z = Math.min(MAX_ZOOM, Math.max(minZoomFor(deg), nz))
    const ccx = offset.x + dw / 2
    const ccy = offset.y + dh / 2
    const ratio = z / zoom
    // place() takes wrapper-center coords and clamps them exactly.
    setZoom(z)
    setOffset(place(px + (ccx - px) * ratio, py + (ccy - py) * ratio, z, deg))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, zoom, offset, dw, dh, rotation, place, natural, boxW])

  // Keep the viewport measurement fresh while editing.
  useEffect(() => {
    const onResize = () => setBoxW(boxRef.current?.clientWidth ?? 0)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Mouse-wheel zoom about the cursor (non-passive so the page doesn't scroll).
  useEffect(() => {
    const el = boxRef.current
    if (!el || !open) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [open, zoomAt, zoom])

  const centerOfBox = () => boxW / 2

  function rotateTo(deg: number) {
    if (!ready) return
    const nd = normDeg(deg)
    const nz = Math.max(zoom, minZoomFor(nd))
    const ccx = offset.x + dw / 2
    const ccy = offset.y + dh / 2
    setRotation(nd)
    setZoom(nz)
    setOffset(place(ccx, ccy, nz, nd))
  }

  function resetAll() {
    if (!ready) return
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setZoom(1)
    setOffset(place(centerOfBox(), centerOfBox(), 1, 0))
  }

  function fitView() {
    if (!ready) return
    const mz = minZoomFor(rotation)
    const ccx = offset.x + dw / 2
    const ccy = offset.y + dh / 2
    setZoom(mz)
    setOffset(place(ccx, ccy, mz, rotation))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || !ready) return
    const ccx = d.ox + dw / 2 + (e.clientX - d.startX)
    const ccy = d.oy + dh / 2 + (e.clientY - d.startY)
    setOffset(place(ccx, ccy, zoom, rotation))
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const target = zoom > minZoom + 0.05 ? minZoom : Math.min(MAX_ZOOM, minZoom * 2)
    zoomAt(px, py, target)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!ready) return
    const big = e.shiftKey ? NUDGE_BIG : NUDGE
    const ccx = offset.x + dw / 2
    const ccy = offset.y + dh / 2
    const c = centerOfBox()
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault()
        setOffset(place(ccx - big, ccy, zoom, rotation))
        break
      case "ArrowRight":
        e.preventDefault()
        setOffset(place(ccx + big, ccy, zoom, rotation))
        break
      case "ArrowUp":
        e.preventDefault()
        setOffset(place(ccx, ccy - big, zoom, rotation))
        break
      case "ArrowDown":
        e.preventDefault()
        setOffset(place(ccx, ccy + big, zoom, rotation))
        break
      case "+":
      case "=":
        e.preventDefault()
        zoomAt(c, c, zoom * 1.2)
        break
      case "-":
      case "_":
        e.preventDefault()
        zoomAt(c, c, zoom / 1.2)
        break
      case "0":
        e.preventDefault()
        resetAll()
        break
    }
  }

  async function onSave() {
    if (!activeSrc || !imgRef.current || !ready) return
    setSaving(true)
    try {
      const img = imgRef.current
      await img.decode().catch(() => {})
      const canvas = document.createElement("canvas")
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("NO_CANVAS")
      // Reproduce the exact visible transform: wrapper rect rotated about
      // its own center (matches the CSS transform-origin: center).
      const k = OUTPUT_SIZE / boxW
      const ccx = offset.x + dw / 2
      const ccy = offset.y + dh / 2
      ctx.translate(ccx * k, ccy * k)
      ctx.rotate(toRad(rotation))
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
      ctx.drawImage(img, (-dw * k) / 2, (-dh * k) / 2, dw * k, dh * k)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.85)
      )
      if (!blob) throw new Error("ENCODE_FAILED")
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = () => reject(new Error("READ_FAILED"))
        r.readAsDataURL(blob)
      })
      const upload = uploadAction ?? coachUploadCroppedLogoAction
      const res = await upload(dataUrl)
      if (!res.ok || !res.branding) {
        toast.error((res.error ? t.settings.branding.errors[res.error as keyof typeof t.settings.branding.errors] : undefined) ?? t.toasts.genericError)
        return
      }
      // Immediate global update (same tab) + server revalidation (reload/login)
      notifyBrandingUpdated(res.branding)
      router.refresh()
      toast.success(savedToast ?? t.settings.branding.logoSavedToast)
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error(t.toasts.genericError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{editorTitle ?? s.editorTitle}</DialogTitle>
        </DialogHeader>
        {activeSrc && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-center gap-4">
              <div
                ref={boxRef}
                className="relative w-full max-w-[280px] aspect-square touch-none select-none overflow-hidden rounded-xl border bg-muted cursor-move focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDoubleClick={onDoubleClick}
                onKeyDown={onKeyDown}
                tabIndex={0}
                role="application"
                aria-label={s.editorDragHint}
              >
                {ready && (
                  <div
                    className="absolute"
                    style={{
                      left: offset.x,
                      top: offset.y,
                      width: dw,
                      height: dh,
                      transform,
                      transformOrigin: "center",
                    }}
                  >
                    <img
                      ref={imgRef}
                      crossOrigin="anonymous"
                      src={activeSrc}
                      alt=""
                      draggable={false}
                      className="h-full w-full max-none"
                    />
                  </div>
                )}
                {/* Hidden measurer: learns natural size, then centers the image
                    (cover math — the square is always fully covered). */}
                <img
                  crossOrigin="anonymous"
                  src={activeSrc}
                  alt=""
                  aria-hidden="true"
                  className="invisible absolute"
                  onLoad={(e) => {
                    const im = e.currentTarget
                    const size = boxRef.current?.clientWidth ?? 0
                    if (size === 0 || im.naturalWidth === 0) return
                    const nw = im.naturalWidth
                    const nh = im.naturalHeight
                    const bs0 = size / Math.min(nw, nh)
                    setBoxW(size)
                    setNatural({ w: nw, h: nh })
                    setOffset({
                      x: (size - nw * bs0) / 2,
                      y: (size - nh * bs0) / 2,
                    })
                  }}
                />
              </div>
              {/* Circular preview — matches rounded-full logo display */}
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-white shadow-soft ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
                  {ready && (
                    <div
                      className="absolute"
                      style={{
                        left: (offset.x * 80) / boxW,
                        top: (offset.y * 80) / boxW,
                        width: (dw * 80) / boxW,
                        height: (dh * 80) / boxW,
                        transform,
                        transformOrigin: "center",
                      }}
                    >
                    <img
                      crossOrigin="anonymous"
                      src={activeSrc}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      className="h-full w-full max-none"
                      />
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">{s.preview}</span>
                <span className="text-[11px] font-semibold tabular-nums" dir="ltr">
                  {Math.round((zoom / minZoom) * 100)}%
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{s.editorDragHint}</p>

            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => zoomAt(centerOfBox(), centerOfBox(), zoom - 0.25)} disabled={!ready || zoom <= minZoom + 1e-6} aria-label={s.zoomOut} title={s.zoomOut}>
                <ZoomOut className="size-4" />
              </Button>
              <input
                type="range"
                min={minZoom}
                max={MAX_ZOOM}
                step={0.05}
                value={zoom}
                onChange={(e) => zoomAt(centerOfBox(), centerOfBox(), Number(e.target.value))}
                className="w-full accent-brand-600"
                aria-label={s.zoom}
                disabled={!ready}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => zoomAt(centerOfBox(), centerOfBox(), zoom + 0.25)} disabled={!ready || zoom >= MAX_ZOOM - 1e-6} aria-label={s.zoomIn} title={s.zoomIn}>
                <ZoomIn className="size-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={fitView} disabled={!ready} aria-label={s.fitView} title={s.fitView}>
                <Maximize className="size-4" />
              </Button>
            </div>

            {/* Rotation controls */}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => rotateTo(rotation - 90)} disabled={!ready} aria-label={s.rotateLeft} title={s.rotateLeft}>
                <RotateCcw className="size-4" />
              </Button>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={Math.round(rotation)}
                onChange={(e) => rotateTo(Number(e.target.value))}
                className="w-full accent-brand-600"
                aria-label={s.rotate}
                disabled={!ready}
                dir="ltr"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => rotateTo(rotation + 90)} disabled={!ready} aria-label={s.rotateRight} title={s.rotateRight}>
                <RotateCw className="size-4" />
              </Button>
              <span className="w-12 shrink-0 text-center text-xs font-semibold tabular-nums" dir="ltr">
                {Math.round(rotation)}°
              </span>
            </div>

            {/* Flip + reset */}
            <div className="flex items-center gap-2">
              <Button type="button" variant={flipH ? "secondary" : "outline"} size="sm" onClick={() => setFlipH((v) => !v)} disabled={!ready} aria-pressed={flipH} title={s.flipH}>
                <FlipHorizontal2 className="size-4" />
                <span className="hidden sm:inline">{s.flipH}</span>
              </Button>
              <Button type="button" variant={flipV ? "secondary" : "outline"} size="sm" onClick={() => setFlipV((v) => !v)} disabled={!ready} aria-pressed={flipV} title={s.flipV}>
                <FlipVertical2 className="size-4" />
                <span className="hidden sm:inline">{s.flipV}</span>
              </Button>
              <span className="flex-1" />
              <Button type="button" variant="ghost" size="sm" onClick={resetAll} disabled={!ready} title={s.resetView}>
                <RefreshCcw className="size-4" />
                {s.resetView}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">{s.keyboardHint}</p>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onReplaceImage} disabled={saving} className="me-auto" title={s.changeImage}>
            <ImagePlus className="size-4" />
            {s.changeImage}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {s.cancel}
          </Button>
          <Button type="button" onClick={onSave} disabled={saving || !activeSrc || !ready} className="min-w-[140px]">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {s.saving}
              </>
            ) : (
              s.saveLogo
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
