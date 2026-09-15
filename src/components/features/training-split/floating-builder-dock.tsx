"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassSheen } from "./liquid-glass/glass-sheen"
import { useI18n } from "@/lib/i18n/client"
import { Loader2, Plus, Check, AlertTriangle } from "lucide-react"
import { MAX_TRAINING_DAYS } from "@/lib/constants"

interface FloatingBuilderDockProps {
  daysCount: number
  exercisesCount: number
  conflictCount: number
  isSubmitting: boolean
  isEdit: boolean
  onAddDay: () => void
  onSave: () => void
  onCancel: () => void
}

export function FloatingBuilderDock({
  daysCount,
  exercisesCount,
  conflictCount,
  isSubmitting,
  isEdit,
  onAddDay,
  onSave,
  onCancel,
}: FloatingBuilderDockProps) {
  const { t } = useI18n()

  return (
    <div className="sticky bottom-4 z-40 w-full flex justify-center px-2 pointer-events-none mt-8">
      <div className="pointer-events-auto relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-neutral-950/85 px-4 py-2.5 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.50)] max-w-2xl w-full">
        <GlassSheen opacity={0.7} />

        {/* Telemetry stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-muted-foreground">{t.trainingSplit.days}:</span>
            <span className="font-bold text-foreground">
              {daysCount} / {MAX_TRAINING_DAYS}
            </span>
          </div>

          <span className="text-white/20">•</span>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-muted-foreground">{t.trainingSplit.exercises}:</span>
            <span className="font-bold text-foreground">{exercisesCount}</span>
          </div>

          {conflictCount > 0 && (
            <>
              <span className="text-white/20">•</span>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-[10px] gap-1 px-2 py-0.5 animate-pulse">
                <AlertTriangle className="size-3" />
                {conflictCount} Warning{conflictCount > 1 ? "s" : ""}
              </Badge>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ms-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSubmitting || daysCount >= MAX_TRAINING_DAYS}
            onClick={onAddDay}
            className="h-8 rounded-xl text-xs gap-1 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">{t.trainingSplit.addDay}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            onClick={onCancel}
            className="h-8 rounded-xl text-xs text-muted-foreground hover:text-foreground"
          >
            {t.common.cancel}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isSubmitting}
            onClick={onSave}
            className="h-8 rounded-xl text-xs font-semibold shadow-glow gap-1.5 px-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t.common.saving}
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                {isEdit ? t.common.save : t.trainingSplit.createSplit}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
