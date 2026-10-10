"use client"

import { useState, useMemo } from "react"
import { MUSCLE_GROUPS } from "@/lib/constants"
import { MuscleSidebar } from "@/components/features/exercise-library/muscle-sidebar"
import { ExercisePanel } from "@/components/features/exercise-library/exercise-panel"
import { useI18n } from "@/lib/i18n/client"
import { getMuscleGroupLabel } from "@/lib/i18n/labels"
import { cn } from "@/lib/utils"
import type { LibraryExercise } from "@/server/services/exercise.service"

interface ExerciseLibrarySplitViewProps {
  initialExercises: LibraryExercise[]
}

export function ExerciseLibrarySplitView({
  initialExercises,
}: ExerciseLibrarySplitViewProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  const [selectedMuscle, setSelectedMuscle] = useState<string>("ALL")
  const [customGroups, setCustomGroups] = useState<string[]>([])

  // Collect all unique muscle groups from exercises + constants + custom groups
  const allGroups = useMemo(() => {
    const fromExercises = (initialExercises || [])
      .map((e) => (e.muscleGroup || "").trim().toLowerCase())
      .filter(Boolean)

    const base = MUSCLE_GROUPS.map((g) => g.toLowerCase())
    const custom = customGroups.map((g) => g.toLowerCase())

    const set = new Set<string>([...base, ...fromExercises, ...custom])
    return Array.from(set)
  }, [initialExercises, customGroups])

  // Count exercises per group for mobile chip bar
  const countsByGroup = useMemo(() => {
    return (initialExercises || []).reduce<Record<string, number>>((acc, ex) => {
      const key = (ex.muscleGroup || "").toLowerCase()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }, [initialExercises])

  const handleAddGroup = (newGroup: string) => {
    const key = newGroup.trim().toLowerCase()
    if (!key) return
    if (!allGroups.includes(key)) {
      setCustomGroups((prev) => [...prev, key])
    }
    setSelectedMuscle(key)
  }

  return (
    <div className="flex flex-col gap-2.5 flex-1 min-h-0 h-full overflow-hidden">
      {/* Mobile Horizontal Muscle Chip Bar (visible on screens < lg) */}
      <div className="lg:hidden shrink-0 flex items-center gap-1.5 overflow-x-auto pb-1.5 px-0.5 no-scrollbar">
        {/* All Exercises chip */}
        <button
          type="button"
          onClick={() => setSelectedMuscle("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border shrink-0 transition-all flex items-center gap-1.5",
            selectedMuscle === "ALL"
              ? "bg-brand-500 text-white border-brand-500 shadow-soft"
              : "bg-card text-foreground border-border/80 hover:bg-muted/60"
          )}
        >
          <span>{t.exerciseLibrary.allExercises || (isAr ? "جميع التمارين" : "All")}</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums",
              selectedMuscle === "ALL" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            )}
          >
            {initialExercises.length}
          </span>
        </button>

        {/* Individual muscle chips */}
        {allGroups.map((group) => {
          const key = group.toLowerCase()
          const isSelected = selectedMuscle.toLowerCase() === key
          const count = countsByGroup[key] || 0
          const label = getMuscleGroupLabel(group, locale) || group

          return (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedMuscle(group)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border shrink-0 transition-all flex items-center gap-1.5",
                isSelected
                  ? "bg-brand-500 text-white border-brand-500 shadow-soft"
                  : "bg-card text-foreground border-border/80 hover:bg-muted/60"
              )}
            >
              <span>{label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums",
                  isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Split Container: Fixed-Height Workspace with Independent Scroll */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 h-full rounded-2xl border border-border/80 bg-card shadow-soft overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile, visible on lg+) */}
        <MuscleSidebar
          groups={allGroups}
          exercises={initialExercises}
          selectedMuscle={selectedMuscle}
          onSelect={setSelectedMuscle}
          onAddGroup={handleAddGroup}
          className="hidden lg:flex w-72 xl:w-80 shrink-0 h-full min-h-0"
        />

        {/* Exercise Detail Panel with its own independent scroll */}
        <ExercisePanel
          exercises={initialExercises}
          selectedMuscle={selectedMuscle}
          availableGroups={allGroups}
          className="flex-1 min-w-0 h-full min-h-0"
        />
      </div>
    </div>
  )
}
