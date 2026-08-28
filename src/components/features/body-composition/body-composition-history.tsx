"use client"

import { useState } from "react"
import { Trash2, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BodyCompositionForm } from "./body-composition-form"
import { deleteBodyCompositionAction } from "@/server/actions/body-composition"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

type Entry = {
  id: string
  date: string | Date
  source: string
  weightKg: number | null
  muscleMassKg: number | null
  bodyFatKg: number | null
  bodyWaterPct: number | null
  fatControlKg: number | null
  bmrKcal: number | null
  fitnessScore: number | null
  waistHipRatio: number | null
  visceralFatLevel: number | null
  notes: string | null
}

export function BodyCompositionHistory({
  clientId,
  entries,
  canEdit,
  canDelete,
}: {
  clientId: string
  entries: Entry[]
  canEdit: boolean
  canDelete: boolean
}) {
  const { t, locale } = useI18n()
  const [editing, setEditing] = useState<Entry | null>(null)
  const [deleting, setDeleting] = useState<Entry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!deleting) return
    setIsDeleting(true)
    const res = await deleteBodyCompositionAction(clientId, deleting.id)
    if (!res.ok) toast.error(t.toasts.genericError)
    else {
      toast.success(t.toasts.deleted)
      window.location.reload()
    }
    setIsDeleting(false)
    setDeleting(null)
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">No InBody records yet.</CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {entries.map((bc) => (
          <Card key={bc.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{formatDate(bc.date as never, locale)}</Badge>
                <Badge variant={bc.source === "CLIENT" ? "secondary" : "default"}>{bc.source}</Badge>
              </div>
              {(canEdit || canDelete) && (
                <div className="flex gap-1">
                  {canEdit && (
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(bc)} aria-label={t.common.edit}>
                      <Pencil className="size-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(bc)} aria-label={t.common.delete}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-muted-foreground">الوزن | WEIGHT</dt><dd className="font-medium">{bc.weightKg ?? "—"} {bc.weightKg != null ? "kg" : ""}</dd></div>
                <div><dt className="text-xs text-muted-foreground">العضلات | MUSCLE</dt><dd className="font-medium">{bc.muscleMassKg ?? "—"} {bc.muscleMassKg != null ? "kg" : ""}</dd></div>
                <div><dt className="text-xs text-muted-foreground">الدهون | FAT</dt><dd className="font-medium">{bc.bodyFatKg ?? "—"} {bc.bodyFatKg != null ? "kg" : ""}</dd></div>
                <div><dt className="text-xs text-muted-foreground">المياه % | WATER %</dt><dd className="font-medium">{bc.bodyWaterPct ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">التحكم دهون | FAT CTRL</dt><dd className="font-medium">{bc.fatControlKg ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">BMR</dt><dd className="font-medium">{bc.bmrKcal ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Fitness Score</dt><dd className="font-medium">{bc.fitnessScore ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">WHR</dt><dd className="font-medium">{bc.waistHipRatio ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Visceral Fat</dt><dd className="font-medium">{bc.visceralFatLevel ?? "—"}</dd></div>
              </dl>
              {bc.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{bc.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.common.edit}</DialogTitle>
            </DialogHeader>
            <BodyCompositionForm
              clientId={clientId}
              entry={{
                id: editing.id,
                date: String(editing.date).slice(0, 10),
                weightKg: editing.weightKg as never,
                muscleMassKg: editing.muscleMassKg as never,
                bodyFatKg: editing.bodyFatKg as never,
                bodyWaterPct: editing.bodyWaterPct as never,
                fatControlKg: editing.fatControlKg as never,
                bmrKcal: editing.bmrKcal as never,
                fitnessScore: editing.fitnessScore as never,
                waistHipRatio: editing.waistHipRatio as never,
                visceralFatLevel: editing.visceralFatLevel as never,
                notes: editing.notes as never,
              }}
              onSuccess={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.common.delete}</DialogTitle>
            <DialogDescription>{t.common.deletedConfirmation}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? t.common.saving : t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
