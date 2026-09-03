"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { adminUpsertBrandingAction, adminResetBrandingAction, adminUploadLogoAction } from "@/server/actions/branding"

function getContrastWarning(hex: string | null): string | null {
  if (!hex || !/^#([0-9A-Fa-f]{6})$/.test(hex)) return null
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum > 0.85) return "Very light primary color may have poor contrast on white buttons."
  if (lum < 0.08) return "Very dark primary color may have poor contrast."
  return null
}
function foregroundForPrimary(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum > 0.55 ? "#1C1917" : "#FFFFFF"
}

type BrandingRow = { brandName: string | null; logoUrl: string | null; primaryColor: string | null } | null

export function AdminBrandingForm({ coachId, initial }: { coachId: string; initial: BrandingRow }) {
  const [pending, startTransition] = useTransition()
  const [brandName, setBrandName] = useState(initial?.brandName ?? "")
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "")
  const [primaryColor, setPrimaryColor] = useState(initial?.primaryColor ?? "#E85D04")
  const [previewLogo, setPreviewLogo] = useState<string | null>(initial?.logoUrl ?? null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const effectiveName = brandName.trim() || "Coach Flow"
  const effectiveColor = /^#([0-9A-Fa-f]{6})$/.test(primaryColor) ? primaryColor : "#E85D04"
  const warning = getContrastWarning(effectiveColor)
  const fg = foregroundForPrimary(effectiveColor)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!["image/png","image/jpeg","image/webp","image/svg+xml"].includes(f.type)) { toast.error("Invalid type"); return }
    if (f.size > 2*1024*1024) { toast.error("Too large (max 2MB)"); return }
    setSelectedFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreviewLogo(reader.result as string)
    reader.readAsDataURL(f)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>Admin only — controls brand name, logo, primary color for this coach and their clients. Coach cannot edit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Brand Name</Label>
              <Input value={brandName} onChange={e=> setBrandName(e.target.value)} placeholder="Ahmed Fitness" maxLength={80} />
            </div>
            <div className="space-y-1">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                <div className="size-14 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                  {previewLogo ? <img src={previewLogo} alt="logo" className="size-full object-contain" /> : <span className="text-xs text-muted-foreground">No logo</span>}
                </div>
                <Input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onFile} className="max-w-[220px]" />
              </div>
              <Input value={logoUrl} onChange={e=> {setLogoUrl(e.target.value); setSelectedFile(null); setPreviewLogo(e.target.value || null)}} placeholder="https://... or leave empty for default" className="mt-2" />
              <p className="text-xs text-muted-foreground">If empty, default Coach Flow logo is shown. File upload takes precedence over URL.</p>
            </div>
            <div className="space-y-1">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={effectiveColor} onChange={e=> setPrimaryColor(e.target.value)} className="size-10 rounded border p-1" />
                <Input value={primaryColor} onChange={e=> setPrimaryColor(e.target.value)} placeholder="#2563EB" className="font-mono" maxLength={7} />
              </div>
              {warning && <Alert variant="default"><AlertDescription>{warning}</AlertDescription></Alert>}
            </div>
          </div>

          {/* Live Preview — does not persist until Save */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Preview</p>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg flex items-center justify-center overflow-hidden border" style={{ background: effectiveColor, color: fg }}>
                {previewLogo ? <img src={previewLogo} alt="preview" className="size-full object-contain bg-white" /> : <span className="text-sm font-bold">CF</span>}
              </div>
              <span className="font-semibold">{effectiveName}</span>
            </div>
            <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: effectiveColor }}>
              <p className="text-sm font-medium">Dashboard</p>
              <Button size="sm" style={{ background: effectiveColor, color: fg, borderColor: effectiveColor }}>Primary Button</Button>
              <div className="text-xs p-2 rounded" style={{ background: effectiveColor, color: fg }}>Active Navigation</div>
              <div className="h-2 rounded-full" style={{ background: effectiveColor, width: "60%" }} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button disabled={pending} onClick={()=> startTransition(async()=>{
            let finalLogo: string | null = logoUrl.trim() || null
            if (selectedFile) {
              const fd = new FormData()
              fd.set("file", selectedFile)
              const up = await adminUploadLogoAction(coachId, fd)
              if (!up.ok) { toast.error(up.error); return }
              finalLogo = up.logoUrl ?? finalLogo
            } else if (previewLogo && previewLogo.startsWith("data:") && !finalLogo) {
              finalLogo = previewLogo
            }
            const res = await adminUpsertBrandingAction(coachId, { brandName: brandName.trim() || null, logoUrl: finalLogo, primaryColor: effectiveColor })
            if (res.ok) { toast.success("Branding saved"); setSelectedFile(null) }
            else toast.error(res.error)
          })}>Save Branding</Button>

          <Button variant="outline" disabled={pending} onClick={()=> startTransition(async()=>{
            if (!confirm("Reset to Coach Flow defaults? This clears brand name, logo, color.")) return
            const res = await adminResetBrandingAction(coachId)
            if (res.ok) { toast.success("Reset to default"); setBrandName(""); setLogoUrl(""); setPreviewLogo(null); setSelectedFile(null); setPrimaryColor("#E85D04") }
            else toast.error(res.error)
          })}>Reset to Coach Flow Branding</Button>
        </div>
      </CardContent>
    </Card>
  )
}
