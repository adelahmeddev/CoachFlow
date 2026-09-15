"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassSheen } from "./liquid-glass/glass-sheen"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Dumbbell, Calendar, Zap, Check } from "lucide-react"
import type { TrainingDayFocus, SplitType } from "@/lib/db/enums"

export interface TemplatePreviewData {
  id: string
  name: string
  splitType: SplitType
  daysPerWeek: number
  description?: string | null
  days: {
    focus: TrainingDayFocus
    customFocus?: string | null
    exercises: {
      exerciseId?: string | null
      exerciseName: string
      targetSets?: number | string | null
      targetReps?: number | string | null
      targetWeightKg?: number | string | null
      restSeconds?: number | string | null
    }[]
  }[]
}

interface TemplatePreviewDrawerProps {
  template: TemplatePreviewData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (template: TemplatePreviewData) => void
}

export function TemplatePreviewDrawer({
  template,
  open,
  onOpenChange,
  onApply,
}: TemplatePreviewDrawerProps) {
  const { t } = useI18n()

  if (!template) return null

  const totalExercises = template.days.reduce(
    (acc, day) => acc + (day.exercises?.length ?? 0),
    0
  )
  const totalSets = template.days.reduce(
    (acc, day) =>
      acc +
      (day.exercises?.reduce(
        (dayAcc, ex) => dayAcc + (Number(ex.targetSets) || 3),
        0
      ) ?? 0),
    0
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="end"
        className="w-full sm:max-w-lg border-s border-white/15 bg-neutral-950/90 p-0 backdrop-blur-2xl dark:border-white/10 flex flex-col"
      >
        <GlassSheen opacity={0.6} />

        <SheetHeader className="p-6 border-b border-white/10 text-start">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-brand-500/40 bg-brand-500/10 text-brand-300">
              {template.daysPerWeek} {t.trainingSplit.activeDays}
            </Badge>
            <Badge variant="secondary" className="bg-white/10 text-white">
              {lookup(t, `trainingSplit.splitTypes.${template.splitType.toLowerCase()}`) ?? template.splitType}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold pt-1">{template.name}</SheetTitle>
          {template.description && (
            <SheetDescription className="text-sm text-muted-foreground">
              {template.description}
            </SheetDescription>
          )}

          {/* Quick Metrics */}
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-4 text-brand-400" />
              <span>{template.days.length} {t.trainingSplit.days}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Dumbbell className="size-4 text-sky-400" />
              <span>{totalExercises} {t.trainingSplit.exercises}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="size-4 text-amber-400" />
              <span>~{totalSets} Sets</span>
            </div>
          </div>
        </SheetHeader>

        {/* Days List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {template.days.map((day, dIdx) => (
            <div
              key={dIdx}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2.5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-400">
                  {t.trainingSplit.dayPrefix} {dIdx + 1}
                </span>
                <span className="text-xs font-medium text-foreground/80">
                  {day.focus === "CUSTOM"
                    ? day.customFocus || "Custom"
                    : lookup(t, `trainingSplit.dayFocus.${day.focus.toLowerCase()}`) ?? day.focus}
                </span>
              </div>

              <div className="space-y-1.5">
                {(day.exercises ?? []).map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 text-xs"
                  >
                    <span className="truncate font-medium">{ex.exerciseName}</span>
                    <span className="text-muted-foreground shrink-0 ms-2 font-mono text-[11px]">
                      {ex.targetSets || 3} × {ex.targetReps || 10}
                      {ex.restSeconds ? ` · ${ex.restSeconds}s` : ""}
                    </span>
                  </div>
                ))}
                {(day.exercises ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-1">
                    {t.common.none}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <SheetFooter className="p-4 border-t border-white/10 bg-black/40">
          <Button
            type="button"
            className="w-full gap-2 rounded-xl shadow-glow"
            onClick={() => {
              onApply(template)
              onOpenChange(false)
            }}
          >
            <Check className="size-4" />
            {t.trainingSplit.startFromTemplate}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
