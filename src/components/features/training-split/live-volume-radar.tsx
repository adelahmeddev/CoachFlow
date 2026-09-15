"use client"

import React, { useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n/client"
import { getMuscleGroupLabel } from "@/lib/i18n/labels"
import { GlassCard } from "./liquid-glass/glass-card"
import type { TrainingSplitDayInput } from "@/lib/validations/training-split"
import type { ExerciseOption } from "@/lib/exercise-safety"
import { Activity, ChevronDown, ChevronUp } from "lucide-react"

interface LiveVolumeRadarProps {
  days: TrainingSplitDayInput[]
  exerciseLibrary?: ExerciseOption[]
}

export function LiveVolumeRadar({ days, exerciseLibrary = [] }: LiveVolumeRadarProps) {
  const { locale } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)

  const libraryMap = useMemo(() => {
    return new Map(exerciseLibrary.map((e) => [e.id, e]))
  }, [exerciseLibrary])

  // Aggregate sets per muscle group
  const volumeByMuscle = useMemo(() => {
    const map = new Map<string, number>()

    for (const day of days) {
      for (const ex of day.exercises ?? []) {
        const option = ex.exerciseId ? libraryMap.get(ex.exerciseId) : null
        const muscle = option?.muscleGroup || "Other"
        const sets = Number(ex.targetSets) || 3
        map.set(muscle, (map.get(muscle) ?? 0) + sets)
      }
    }

    return Array.from(map.entries())
      .filter(([, sets]) => sets > 0)
      .sort((a, b) => b[1] - a[1])
  }, [days, libraryMap])

  const totalExercises = useMemo(() => {
    return days.reduce((acc, d) => acc + (d.exercises?.length ?? 0), 0)
  }, [days])

  const totalSets = useMemo(() => {
    return volumeByMuscle.reduce((acc, [, sets]) => acc + sets, 0)
  }, [volumeByMuscle])

  if (totalExercises === 0) return null

  return (
    <GlassCard variant="neutral" className="p-3 sm:p-4" showSheen={true}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/25">
            <Activity className="size-3.5" />
          </div>
          <span className="text-xs font-bold tracking-wide">
            Live Weekly Volume Radar
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            ({totalSets} total sets · {totalExercises} exercises)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{isExpanded ? "Less" : "Details"}</span>
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {/* Top 4 prominent muscle pills */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {(isExpanded ? volumeByMuscle : volumeByMuscle.slice(0, 5)).map(([muscle, sets]) => {
          const label = getMuscleGroupLabel(muscle, locale)
          return (
            <div
              key={muscle}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs backdrop-blur-md"
            >
              <span className="font-medium text-foreground/80">{label}</span>
              <span className="font-mono text-[10px] font-bold text-brand-300 bg-brand-500/20 px-1.5 py-0.2 rounded-full">
                {sets}s
              </span>
            </div>
          )
        })}
        {!isExpanded && volumeByMuscle.length > 5 && (
          <span className="text-[11px] text-muted-foreground self-center ps-1">
            +{volumeByMuscle.length - 5} more
          </span>
        )}
      </div>
    </GlassCard>
  )
}
