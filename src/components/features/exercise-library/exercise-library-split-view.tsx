"use client"

import { useState, useMemo } from "react"
import { MUSCLE_GROUPS, SUB_MUSCLE_GROUPS } from "@/lib/constants"
import { MuscleSidebar } from "@/components/features/exercise-library/muscle-sidebar"
import { ExercisePanel } from "@/components/features/exercise-library/exercise-panel"
import { AddSubMuscleDialog } from "@/components/features/exercise-library/add-sub-muscle-dialog"
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
  const [selectedSubMuscle, setSelectedSubMuscle] = useState<string>("ALL")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const [customGroups, setCustomGroups] = useState<string[]>([])
  const [customSubMuscles, setCustomSubMuscles] = useState<Record<string, string[]>>({})

  // Modal state for Add/Move Sub-Muscle
  const [addSubDialogOpen, setAddSubDialogOpen] = useState(false)
  const [subMuscleToMoveInto, setSubMuscleToMoveInto] = useState<string | undefined>(undefined)

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

  // Sub-muscles for the currently selected muscle group
  const availableSubMusclesForCurrent = useMemo(() => {
    if (selectedMuscle === "ALL") return []
    const mKey = selectedMuscle.toLowerCase()
    const base = SUB_MUSCLE_GROUPS[mKey] || []
    const fromExercises = (initialExercises || [])
      .filter((ex) => (ex.muscleGroup || "").toLowerCase() === mKey)
      .map((ex) => (ex.subMuscleGroup || "").trim())
      .filter(Boolean)
    const fromCustom = customSubMuscles[mKey] || []

    const seen = new Set<string>()
    const list: string[] = []
    for (const s of [...base, ...fromExercises, ...fromCustom]) {
      const lower = s.toLowerCase()
      if (!seen.has(lower)) {
        seen.add(lower)
        list.push(s)
      }
    }
    return list
  }, [selectedMuscle, initialExercises, customSubMuscles])

  const handleSelectMuscle = (group: string) => {
    setSelectedMuscle(group)
    setSelectedSubMuscle("ALL")
  }

  const handleAddGroup = (newGroup: string) => {
    const key = newGroup.trim().toLowerCase()
    if (!key) return
    if (!allGroups.includes(key)) {
      setCustomGroups((prev) => [...prev, key])
    }
    setSelectedMuscle(key)
    setSelectedSubMuscle("ALL")
  }

  const handleOpenAddSubMuscle = (initialSubName?: string) => {
    setSubMuscleToMoveInto(initialSubName)
    setAddSubDialogOpen(true)
  }

  const handleAddSubMuscle = (muscleGroup: string, newSubMuscle: string) => {
    const mKey = muscleGroup.toLowerCase()
    setCustomSubMuscles((prev) => {
      const existing = prev[mKey] || []
      if (existing.includes(newSubMuscle)) return prev
      return { ...prev, [mKey]: [...existing, newSubMuscle] }
    })
    setSelectedSubMuscle(newSubMuscle)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden bg-background">
      {/* Mobile Horizontal Muscle Chip Bar (visible on screens < lg) */}
      <div className="lg:hidden shrink-0 flex items-center gap-1.5 overflow-x-auto p-2 border-b border-border/70 bg-card/60 backdrop-blur-xs no-scrollbar">
        {/* All Exercises chip */}
        <button
          type="button"
          onClick={() => handleSelectMuscle("ALL")}
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
              onClick={() => handleSelectMuscle(group)}
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

      {/* Main Split Container: Edge-to-Edge Desktop Layout filling 100% of screen */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 h-full overflow-hidden bg-background">
        {/* Desktop Collapsible Tree Sidebar (hidden on mobile, visible on lg+) */}
        <MuscleSidebar
          groups={allGroups}
          exercises={initialExercises}
          selectedMuscle={selectedMuscle}
          selectedSubMuscle={selectedSubMuscle}
          customSubMuscles={customSubMuscles}
          onSelect={handleSelectMuscle}
          onSelectSubMuscle={setSelectedSubMuscle}
          onAddSubMuscleClick={(group) => {
            setSelectedMuscle(group)
            handleOpenAddSubMuscle(undefined)
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onAddGroup={handleAddGroup}
          className="hidden lg:flex shrink-0 h-full min-h-0"
        />

        {/* Exercise Detail Panel with Spacious Modern Rows */}
        <ExercisePanel
          exercises={initialExercises}
          selectedMuscle={selectedMuscle}
          selectedSubMuscle={selectedSubMuscle}
          onSelectSubMuscle={setSelectedSubMuscle}
          availableGroups={allGroups}
          customSubMuscles={customSubMuscles}
          onAddSubMuscle={handleAddSubMuscle}
          onOpenAddSubMuscle={handleOpenAddSubMuscle}
          className="flex-1 min-w-0 h-full min-h-0"
        />
      </div>

      {/* Global Add / Move Sub-Muscle Dialog */}
      <AddSubMuscleDialog
        open={addSubDialogOpen}
        onOpenChange={setAddSubDialogOpen}
        muscleGroup={selectedMuscle === "ALL" ? "chest" : selectedMuscle}
        exercises={initialExercises}
        existingSubMuscles={availableSubMusclesForCurrent}
        initialSubMuscleName={subMuscleToMoveInto}
        onSuccess={(newSubName) => {
          const targetMuscle = selectedMuscle === "ALL" ? "chest" : selectedMuscle
          handleAddSubMuscle(targetMuscle, newSubName)
        }}
      />
    </div>
  )
}
