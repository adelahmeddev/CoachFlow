"use client"

import { useState } from "react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { Activity, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

interface ClientInBodySectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: FieldErrors<any>
  disabled?: boolean
  defaultOpen?: boolean
}

export function ClientInBodySection({
  register,
  errors,
  disabled = false,
  defaultOpen = false,
}: ClientInBodySectionProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Extract nested inbody errors if any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inbodyErrors = (errors?.inbody as any) || {}

  const fields = [
    {
      key: "heightCm",
      label: t.invite.inbody.heightCm,
      subLabel: isAr ? "HEIGHT (CM)" : "الطول (سم)",
      placeholder: "175.0",
      step: "0.1",
      type: "number",
    },
    {
      key: "weightKg",
      label: t.invite.inbody.weightKg,
      subLabel: isAr ? "WEIGHT (KG)" : "الوزن (كجم)",
      placeholder: "75.0",
      step: "0.1",
      type: "number",
    },
    {
      key: "muscleMassKg",
      label: t.invite.inbody.muscleMassKg,
      subLabel: isAr ? "MUSCLE MASS (KG)" : "الكتلة العضلية (كجم)",
      placeholder: "32.5",
      step: "0.1",
      type: "number",
    },
    {
      key: "bodyFatKg",
      label: t.invite.inbody.bodyFatKg,
      subLabel: isAr ? "BODY FAT (KG)" : "كتلة الدهون (كجم)",
      placeholder: "16.0",
      step: "0.1",
      type: "number",
    },
    {
      key: "bodyWaterPct",
      label: t.invite.inbody.bodyWaterPct,
      subLabel: isAr ? "BODY WATER (%)" : "نسبة الماء (%)",
      placeholder: "55.0",
      step: "0.1",
      type: "number",
    },
    {
      key: "fatControlKg",
      label: t.invite.inbody.fatControlKg,
      subLabel: isAr ? "FAT CONTROL (KG)" : "التحكم في الدهون (كجم)",
      placeholder: "-5.0",
      step: "0.1",
      type: "number",
    },
    {
      key: "bmrKcal",
      label: t.invite.inbody.bmrKcal,
      subLabel: isAr ? "BMR (KCAL)" : "معدل الأيض (سعرة)",
      placeholder: "1650",
      step: "1",
      type: "number",
    },
    {
      key: "visceralFatLevel",
      label: t.invite.inbody.visceralFatLevel,
      subLabel: isAr ? "VISCERAL FAT LEVEL" : "الدهون الحشوية",
      placeholder: "8",
      step: "1",
      type: "number",
    },
    {
      key: "fitnessScore",
      label: t.invite.inbody.fitnessScore,
      subLabel: isAr ? "FITNESS SCORE" : "نقاط اللياقة",
      placeholder: "75",
      step: "1",
      type: "number",
    },
    {
      key: "waistHipRatio",
      label: t.invite.inbody.waistHipRatio,
      subLabel: isAr ? "WAIST-HIP RATIO" : "نسبة الخصر للأرداف",
      placeholder: "0.85",
      step: "0.01",
      type: "number",
    },
  ]

  return (
    <div className="rounded-xl border border-border/80 bg-muted/20 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-3.5 text-start transition-colors hover:bg-muted/40 rounded-xl"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Activity className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold leading-tight">
                {t.invite.inbody.sectionTitle}
              </span>
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                {isAr ? "اختياري" : "Optional"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {t.invite.inbody.sectionDescription}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/60 p-3.5 space-y-4 animate-in fade-in-50 duration-200">
          <p className="text-xs text-muted-foreground">
            {t.invite.inbody.sectionDescription}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => {
              const err = inbodyErrors[f.key]?.message
              return (
                <div key={f.key} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <Label htmlFor={`inbody.${f.key}`} className="text-xs font-medium">
                      {f.label}
                    </Label>
                    <span className="text-[10px] text-muted-foreground/70 tracking-tight font-mono">
                      {f.subLabel}
                    </span>
                  </div>
                  <Input
                    id={`inbody.${f.key}`}
                    type={f.type}
                    step={f.step}
                    placeholder={f.placeholder}
                    disabled={disabled}
                    className="h-9 text-sm"
                    {...register(`inbody.${f.key}`)}
                  />
                  {err && <p className="text-xs text-destructive">{String(err)}</p>}
                </div>
              )
            })}
          </div>

          <div className="space-y-1">
            <Label htmlFor="inbody.notes" className="text-xs font-medium">
              {t.invite.inbody.notes}
            </Label>
            <Textarea
              id="inbody.notes"
              rows={2}
              placeholder={t.invite.inbody.notesPlaceholder}
              disabled={disabled}
              className="resize-none text-sm"
              {...register("inbody.notes")}
            />
            {inbodyErrors.notes?.message && (
              <p className="text-xs text-destructive">
                {String(inbodyErrors.notes.message)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
