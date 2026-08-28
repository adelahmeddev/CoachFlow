"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { bodyCompositionSchema, type BodyCompositionInput } from "@/lib/validations/body-composition"
import { createBodyCompositionAction, updateBodyCompositionAction } from "@/server/actions/body-composition"
import { useI18n } from "@/lib/i18n/client"

const FIELD_CONFIG: { key: keyof BodyCompositionInput; labelAr: string; labelEn: string; placeholder: string }[] = [
  { key: "weightKg", labelAr: "الوزن (كجم)", labelEn: "WEIGHT (KG)", placeholder: "86.8" },
  { key: "muscleMassKg", labelAr: "الكتلة العضلية (كجم)", labelEn: "MUSCLE MASS (KG)", placeholder: "32.5" },
  { key: "bodyFatKg", labelAr: "دهون الجسم (كجم)", labelEn: "BODY FAT (KG)", placeholder: "29.3" },
  { key: "bodyWaterPct", labelAr: "نسبة المياه بالجسم %", labelEn: "BODY WATER %", placeholder: "42.1" },
  { key: "fatControlKg", labelAr: "التحكم في الدهون (كجم)", labelEn: "FAT CONTROL (KG)", placeholder: "-19.1" },
  { key: "bmrKcal", labelAr: "معدل الأيض الأساسي", labelEn: "BMR", placeholder: "1612" },
  { key: "fitnessScore", labelAr: "مؤشر اللياقة", labelEn: "FITNESS SCORE", placeholder: "63" },
  { key: "waistHipRatio", labelAr: "نسبة الخصر للأرداف", labelEn: "WAIST-HIP RATIO", placeholder: "0.92" },
  { key: "visceralFatLevel", labelAr: "مستوى الدهون الحشوية", labelEn: "VISCERAL FAT LEVEL", placeholder: "12" },
]

type Props = {
  clientId: string
  entry?: Partial<BodyCompositionInput> & { id?: string; date?: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export function BodyCompositionForm({ clientId, entry, onSuccess, onCancel }: Props) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [isPending, setIsPending] = useState(false)
  const isEdit = !!entry?.id

  const form = useForm<BodyCompositionInput>({
    resolver: zodResolver(bodyCompositionSchema) as never,
    defaultValues: {
      date: entry?.date ? String(entry.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      weightKg: (entry?.weightKg as never) ?? "",
      muscleMassKg: (entry?.muscleMassKg as never) ?? "",
      bodyFatKg: (entry?.bodyFatKg as never) ?? "",
      bodyWaterPct: (entry?.bodyWaterPct as never) ?? "",
      fatControlKg: (entry?.fatControlKg as never) ?? "",
      bmrKcal: (entry?.bmrKcal as never) ?? "",
      fitnessScore: (entry?.fitnessScore as never) ?? "",
      waistHipRatio: (entry?.waistHipRatio as never) ?? "",
      visceralFatLevel: (entry?.visceralFatLevel as never) ?? "",
      notes: (entry?.notes as never) ?? "",
    } as never,
  })

  async function onSubmit(values: BodyCompositionInput) {
    setIsPending(true)
    try {
      const payload = {
        ...values,
        notes: values.notes || null,
      }
      const result = isEdit
        ? await updateBodyCompositionAction(clientId, entry!.id!, payload)
        : await createBodyCompositionAction(clientId, payload)
      if (!result.ok) {
        toast.error((result as { error?: string }).error || t.toasts.genericError)
        setIsPending(false)
        return
      }
      toast.success(isEdit ? t.toasts.updated : t.toasts.created)
      form.reset()
      onSuccess?.()
      // reload to reflect changes (revalidatePath already, but client needs refresh)
      if (typeof window !== "undefined") window.location.reload()
    } catch {
      toast.error(t.toasts.genericError)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isEdit ? t.common.edit : t.bodyComposition.addInBody}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4">
          <div>
            <Label htmlFor="date">{isAr ? "التاريخ | Date" : "Date"} *</Label>
            <Input id="date" type="date" {...form.register("date")} disabled={isPending} />
            {form.formState.errors.date && <p className="text-xs text-destructive mt-1">{String(form.formState.errors.date.message)}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {FIELD_CONFIG.map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key}>{isAr ? `${f.labelAr} | ${f.labelEn}` : `${f.labelEn} | ${f.labelAr}`}</Label>
                <Input
                  id={f.key}
                  type="number"
                  step="any"
                  placeholder={f.placeholder}
                  {...form.register(f.key as never)}
                  disabled={isPending}
                />
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="notes">{isAr ? "ملاحظات | Notes" : "Notes"}</Label>
            <Textarea id="notes" placeholder={isAr ? "ملاحظات اختيارية" : "Optional notes"} {...form.register("notes")} disabled={isPending} />
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                {t.common.cancel}
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? t.common.saving : isEdit ? t.common.save : t.common.create}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
