"use client"

import React, { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassSheen } from "./liquid-glass/glass-sheen"
import { YouTubePlayer } from "@/components/ui/youtube-player"
import { useI18n } from "@/lib/i18n/client"
import { getExerciseName, getMuscleGroupLabel, getSubMuscleGroupLabel } from "@/lib/i18n/labels"
import { SUB_MUSCLE_GROUPS } from "@/lib/constants"
import { ExerciseFormDialog } from "@/components/features/exercise-library/exercise-form-dialog"
import type { LibraryExercise } from "@/server/services/exercise.service"
import type { ExerciseOption } from "@/lib/exercise-safety"
import { cn } from "@/lib/utils"
import {
  Search,
  Dumbbell,
  Play,
  Check,
  Plus,
  X,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCheck,
} from "lucide-react"

interface BatchExercisePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: ExerciseOption[]
  onSelectBatch?: (selected: ExerciseOption[]) => void
  onSelectSingle?: (selected: ExerciseOption) => void
  mode?: "batch" | "single"
  initialSelectedIds?: string[]
  dayNumber?: number
  onExerciseCreated?: (created: ExerciseOption) => void
}

const MUSCLE_ACCENTS: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  CHEST: {
    border: "border-amber-400/30",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    glow: "group-hover:border-amber-400/50 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  BACK: {
    border: "border-sky-400/30",
    bg: "bg-sky-500/10",
    text: "text-sky-300",
    glow: "group-hover:border-sky-400/50 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]",
  },
  LEGS: {
    border: "border-purple-400/30",
    bg: "bg-purple-500/10",
    text: "text-purple-300",
    glow: "group-hover:border-purple-400/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
  },
  QUADRICEPS: {
    border: "border-purple-400/30",
    bg: "bg-purple-500/10",
    text: "text-purple-300",
    glow: "group-hover:border-purple-400/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
  },
  HAMSTRINGS: {
    border: "border-pink-400/30",
    bg: "bg-pink-500/10",
    text: "text-pink-300",
    glow: "group-hover:border-pink-400/50 group-hover:shadow-[0_0_20px_rgba(244,114,182,0.15)]",
  },
  GLUTES: {
    border: "border-rose-400/30",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    glow: "group-hover:border-rose-400/50 group-hover:shadow-[0_0_20px_rgba(251,113,133,0.15)]",
  },
  SHOULDERS: {
    border: "border-fuchsia-400/30",
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-300",
    glow: "group-hover:border-fuchsia-400/50 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]",
  },
  BICEPS: {
    border: "border-blue-400/30",
    bg: "bg-blue-500/10",
    text: "text-blue-300",
    glow: "group-hover:border-blue-400/50 group-hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]",
  },
  TRICEPS: {
    border: "border-cyan-400/30",
    bg: "bg-cyan-500/10",
    text: "text-cyan-300",
    glow: "group-hover:border-cyan-400/50 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]",
  },
  CORE: {
    border: "border-emerald-400/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    glow: "group-hover:border-emerald-400/50 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]",
  },
  CARDIO: {
    border: "border-red-400/30",
    bg: "bg-red-500/10",
    text: "text-red-300",
    glow: "group-hover:border-red-400/50 group-hover:shadow-[0_0_20px_rgba(248,113,113,0.15)]",
  },
}

export function BatchExercisePicker({
  open,
  onOpenChange,
  exercises,
  onSelectBatch,
  onSelectSingle,
  mode = "batch",
  initialSelectedIds = [],
  dayNumber,
  onExerciseCreated,
}: BatchExercisePickerProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [localExercises, setLocalExercises] = useState<ExerciseOption[]>(exercises)

  React.useEffect(() => {
    setLocalExercises(exercises)
  }, [exercises])

  const [query, setQuery] = useState("")
  const [activeMuscleGroup, setActiveMuscleGroup] = useState<string>("ALL")
  const [activeSubMuscle, setActiveSubMuscle] = useState<string>("ALL")
  const [selectedMap, setSelectedMap] = useState<Map<string, ExerciseOption>>(() => {
    const map = new Map<string, ExerciseOption>()
    for (const id of initialSelectedIds) {
      const found = exercises.find((ex) => ex.id === id)
      if (found) map.set(id, found)
    }
    return map
  })
  const [previewExercise, setPreviewExercise] = useState<ExerciseOption | null>(null)

  function handleExerciseCreated(newEx?: LibraryExercise) {
    if (!newEx) return
    const converted: ExerciseOption = {
      id: newEx.id,
      name: newEx.name,
      nameAr: newEx.nameAr,
      muscleGroup: newEx.muscleGroup,
      subMuscleGroup: newEx.subMuscleGroup,
      equipment: newEx.equipment ?? null,
      tags: newEx.tags ?? [],
      defaultSets: newEx.defaultSets ?? 3,
      defaultReps: newEx.defaultReps ?? 10,
      defaultRestSeconds: newEx.defaultRestSeconds ?? 90,
      youtubeUrl: newEx.youtubeUrl,
      usageCount: 0,
    }

    setLocalExercises((prev) => [converted, ...prev])
    onExerciseCreated?.(converted)

    // Switch active muscle group so newly created exercise is immediately visible
    setActiveMuscleGroup(converted.muscleGroup)
    if (converted.subMuscleGroup) {
      setActiveSubMuscle(converted.subMuscleGroup)
    }

    if (mode === "single") {
      onSelectSingle?.(converted)
      onOpenChange(false)
    } else {
      setSelectedMap((prev) => {
        const next = new Map(prev)
        next.set(converted.id, converted)
        return next
      })
    }
  }

  // Extract distinct muscle groups
  const muscleGroups = useMemo(() => {
    const set = new Set<string>()
    for (const ex of localExercises) {
      if (ex.muscleGroup) set.add(ex.muscleGroup.toLowerCase())
    }
    return Array.from(set).sort()
  }, [localExercises])

  // Sub-muscles for the currently selected muscle group (Predefined + dynamic from exercises)
  const availableSubMuscles = useMemo(() => {
    if (activeMuscleGroup === "ALL") return []
    const mKey = activeMuscleGroup.toLowerCase()
    const base = SUB_MUSCLE_GROUPS[mKey] || []
    const fromExercises = localExercises
      .filter((ex) => (ex.muscleGroup || "").toLowerCase() === mKey)
      .map((ex) => (ex.subMuscleGroup || "").trim())
      .filter(Boolean)

    const seen = new Set<string>()
    const list: string[] = []
    for (const s of [...base, ...fromExercises]) {
      const lower = s.toLowerCase()
      if (!seen.has(lower)) {
        seen.add(lower)
        list.push(s)
      }
    }
    return list
  }, [activeMuscleGroup, localExercises])

  // Count exercises per sub-muscle
  const subMuscleCounts = useMemo(() => {
    if (activeMuscleGroup === "ALL") return {}
    const counts: Record<string, number> = {}
    const inCurrentMuscle = localExercises.filter(
      (ex) => (ex.muscleGroup || "").toLowerCase() === activeMuscleGroup.toLowerCase()
    )
    for (const sub of availableSubMuscles) {
      counts[sub] = inCurrentMuscle.filter(
        (ex) => (ex.subMuscleGroup || "").toLowerCase() === sub.toLowerCase()
      ).length
    }
    return counts
  }, [localExercises, activeMuscleGroup, availableSubMuscles])

  // Count exercises with usageCount > 0
  const mostUsedCount = useMemo(() => {
    return localExercises.filter((e) => (e.usageCount ?? 0) > 0).length
  }, [localExercises])

  function handleSelectMuscleGroup(group: string) {
    setActiveMuscleGroup(group)
    setActiveSubMuscle("ALL")
  }

  // Filter exercises by query, muscle group, and sub-muscle, sorted by usageCount DESC
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = localExercises.filter((ex) => {
      // 0. Quick filter for "MOST_USED" tab if selected
      if (activeMuscleGroup === "MOST_USED" && (!ex.usageCount || ex.usageCount <= 0)) {
        return false
      }

      const exMuscle = (ex.muscleGroup || "").toLowerCase()
      const exSubMuscle = (ex.subMuscleGroup || "").toLowerCase()

      // 1. Muscle group filter
      if (
        activeMuscleGroup !== "ALL" &&
        activeMuscleGroup !== "MOST_USED" &&
        exMuscle !== activeMuscleGroup.toLowerCase()
      ) {
        return false
      }

      // 2. Sub-muscle filter
      if (
        activeMuscleGroup !== "ALL" &&
        activeMuscleGroup !== "MOST_USED" &&
        activeSubMuscle !== "ALL" &&
        exSubMuscle !== activeSubMuscle.toLowerCase()
      ) {
        return false
      }

      // 3. Search query filter
      if (!q) return true

      const subMuscleLabel = (getSubMuscleGroupLabel(ex.subMuscleGroup, locale) || "").toLowerCase()
      const muscleLabel = (getMuscleGroupLabel(ex.muscleGroup, locale) || "").toLowerCase()

      return (
        ex.name.toLowerCase().includes(q) ||
        (Boolean(ex.nameAr) && ex.nameAr!.toLowerCase().includes(q)) ||
        exMuscle.includes(q) ||
        muscleLabel.includes(q) ||
        exSubMuscle.includes(q) ||
        subMuscleLabel.includes(q)
      )
    })

    // Sort by usageCount DESC, then alphabetically by name ASC
    return [...result].sort((a, b) => {
      const countA = a.usageCount ?? 0
      const countB = b.usageCount ?? 0
      if (countB !== countA) {
        return countB - countA
      }
      return a.name.localeCompare(b.name)
    })
  }, [localExercises, query, activeMuscleGroup, activeSubMuscle, locale])

  function toggleSelect(exercise: ExerciseOption) {
    if (mode === "single") {
      onSelectSingle?.(exercise)
      onOpenChange(false)
      return
    }

    setSelectedMap((prev) => {
      const next = new Map(prev)
      if (next.has(exercise.id)) {
        next.delete(exercise.id)
      } else {
        next.set(exercise.id, exercise)
      }
      return next
    })
  }

  function handleSelectAllFiltered() {
    setSelectedMap((prev) => {
      const next = new Map(prev)
      for (const ex of filtered) {
        next.set(ex.id, ex)
      }
      return next
    })
  }

  function handleClearSelection() {
    setSelectedMap(new Map())
  }

  function handleAddBatch() {
    if (onSelectBatch) {
      onSelectBatch(Array.from(selectedMap.values()))
    }
    setSelectedMap(new Map())
    onOpenChange(false)
  }

  // Calculate estimated total sets for selected
  const totalPlannedSets = useMemo(() => {
    let sets = 0
    selectedMap.forEach((ex) => {
      sets += ex.defaultSets ?? 3
    })
    return sets
  }, [selectedMap])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className={cn(
          /* Large spacious sizing */
          "sm:max-w-6xl lg:max-w-7xl w-[96vw] sm:w-[94vw] h-[92vh] max-h-[92vh] sm:h-[90vh] sm:max-h-[90vh]",
          "p-0 flex flex-col rounded-3xl overflow-hidden border border-white/20 dark:border-white/10",
          "bg-neutral-950/95 backdrop-blur-3xl shadow-[0_24px_60px_rgba(0,0,0,0.65)]",
          "text-foreground",
          "gap-0"
        )}
      >
        <GlassSheen opacity={0.7} />

        {/* 1. Header Area */}
        <DialogHeader className="p-4 sm:p-5 sm:pb-3 border-b border-white/10 text-start space-y-2.5 shrink-0 bg-white/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-glow shrink-0">
                <Layers className="size-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                    {t.trainingSplit.exerciseLibrary}
                  </DialogTitle>
                  {dayNumber !== undefined && (
                    <Badge variant="outline" className="border-brand-500/40 bg-brand-500/10 text-brand-300 text-xs px-2.5 py-0.5">
                      {t.trainingSplit.dayPrefix} {dayNumber}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  Select and batch-insert exercises with customized sets, reps, and video guides
                </p>
              </div>
            </div>

            {/* Action buttons & Selection Telemetry */}
            <div className="flex items-center gap-2">
              <ExerciseFormDialog
                defaultMuscleGroup={activeMuscleGroup !== "ALL" ? activeMuscleGroup : undefined}
                defaultSubMuscleGroup={activeSubMuscle !== "ALL" ? activeSubMuscle : undefined}
                onSuccess={handleExerciseCreated}
                overlayClassName="z-[70] bg-black/60 backdrop-blur-sm"
                contentClassName="z-[75] bg-neutral-950 border-white/20 text-foreground"
                trigger={
                  <Button
                    type="button"
                    size="sm"
                    className="h-8.5 rounded-xl text-xs font-semibold gap-1.5 bg-brand-500 hover:bg-brand-600 text-white shadow-glow px-3"
                  >
                    <Plus className="size-3.5" />
                    <span>{t.exerciseLibrary.addExercise}</span>
                  </Button>
                }
              />

              {mode === "batch" && (
                <>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-3.5 py-1.5 backdrop-blur-md">
                    <Sparkles className="size-3.5 text-brand-400" />
                    <span className="text-xs font-semibold">
                      {selectedMap.size} Selected
                    </span>
                    {selectedMap.size > 0 && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        (~{totalPlannedSets} sets)
                      </span>
                    )}
                  </div>

                  {selectedMap.size > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={handleClearSelection}
                      className="h-8 rounded-xl text-xs text-muted-foreground hover:text-destructive gap-1 px-2.5"
                    >
                      <RotateCcw className="size-3" />
                      <span>Clear</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Search bar & Muscle Category Filter Chips in the SAME line */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Search bar */}
            <div className="relative w-40 sm:w-56 md:w-64 shrink-0">
              <Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={`${t.trainingSplit.searchExercise}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8.5 ps-8 pe-7 rounded-xl border-white/15 bg-white/[0.04] backdrop-blur-md text-xs transition-all focus:border-brand-400 focus:ring-1 focus:ring-brand-400/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Subtle separator */}
            <div className="hidden sm:block h-5 w-px bg-white/15 shrink-0" aria-hidden="true" />

            {/* Muscle Category Filter Chips (scrollable horizontally right beside the search bar) */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => handleSelectMuscleGroup("ALL")}
                className={cn(
                  "rounded-xl px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                  activeMuscleGroup === "ALL"
                    ? "border-brand-400/80 bg-brand-500 text-white shadow-glow"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
              >
                {isAr ? "جميع العضلات" : "All Muscles"} ({localExercises.length})
              </button>
              {mostUsedCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectMuscleGroup("MOST_USED")}
                  className={cn(
                    "rounded-xl px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5",
                    activeMuscleGroup === "MOST_USED"
                      ? "border-amber-400/80 bg-amber-500 text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-300 hover:border-amber-400/50 hover:bg-amber-500/15"
                  )}
                >
                  <Sparkles className="size-3 text-amber-400 shrink-0" />
                  <span>{isAr ? "الأكثر استخداماً" : "Most Used"}</span>
                  <span className="text-[10px] opacity-80 font-mono">({mostUsedCount})</span>
                </button>
              )}
              {muscleGroups.map((group) => {
                const label = getMuscleGroupLabel(group, locale)
                const count = localExercises.filter(
                  (e) => (e.muscleGroup || "").toLowerCase() === group.toLowerCase()
                ).length
                const isCurrent = activeMuscleGroup.toLowerCase() === group.toLowerCase()
                const accent = MUSCLE_ACCENTS[group.toUpperCase()]

                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => handleSelectMuscleGroup(group)}
                    className={cn(
                      "rounded-xl px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0",
                      isCurrent
                        ? "border-brand-400/80 bg-brand-500 text-white shadow-glow"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                    )}
                  >
                    {accent && !isCurrent && (
                      <span className={cn("size-1.5 rounded-full", accent.text.replace("text-", "bg-"))} />
                    )}
                    <span>{label}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                )
              })}
            </div>

            {/* Quick action: Select All (Batch mode) */}
            {mode === "batch" && filtered.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllFiltered}
                className="h-8.5 rounded-xl border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold gap-1.5 shrink-0 px-2.5"
              >
                <CheckCheck className="size-3.5 text-brand-400" />
                <span className="hidden md:inline">Select All</span>
                <span>({filtered.length})</span>
              </Button>
            )}
          </div>

          {/* Sub-Muscle Filter Chips (shown when a specific muscle is selected) */}
          {activeMuscleGroup !== "ALL" && availableSubMuscles.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-white/5 animate-in fade-in duration-200">
              <span className="text-[11px] font-medium text-muted-foreground me-1 shrink-0">
                {locale === "ar" ? "العضلة الفرعية:" : "Sub-muscle:"}
              </span>
              <button
                type="button"
                onClick={() => setActiveSubMuscle("ALL")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-all border",
                  activeSubMuscle === "ALL"
                    ? "border-brand-400/80 bg-brand-500/25 text-brand-300 shadow-sm"
                    : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
              >
                {locale === "ar" ? "الكل" : "All"} (
                {
                  localExercises.filter(
                    (e) => (e.muscleGroup || "").toLowerCase() === activeMuscleGroup.toLowerCase()
                  ).length
                }
                )
              </button>
              {availableSubMuscles.map((sub) => {
                const subLabel = getSubMuscleGroupLabel(sub, locale)
                const count = subMuscleCounts[sub] || 0
                const isCurrent = activeSubMuscle.toLowerCase() === sub.toLowerCase()

                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setActiveSubMuscle(sub)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5",
                      isCurrent
                        ? "border-brand-400/80 bg-brand-500/25 text-brand-300 shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
                    )}
                  >
                    <span>{subLabel}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                )
              })}
            </div>
          )}
        </DialogHeader>

        {/* 2. Main Content: Responsive Card Grid + Side Inspector */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          {/* Exercises Grid Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {filtered.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Dumbbell className="size-10 mx-auto text-muted-foreground/40" />
                <p className="text-base font-semibold text-foreground/80">
                  {t.trainingSplit.noExercisesFound}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {isAr
                    ? "لم يتم العثور على أي تمارين مطابقة. يمكنك إضافة تمرين جديد مباشرة إلى مكتبتك."
                    : "No matching exercises found. You can add a new exercise directly to your library."}
                </p>
                <div className="pt-2">
                  <ExerciseFormDialog
                    defaultMuscleGroup={activeMuscleGroup !== "ALL" ? activeMuscleGroup : undefined}
                    defaultSubMuscleGroup={activeSubMuscle !== "ALL" ? activeSubMuscle : undefined}
                    onSuccess={handleExerciseCreated}
                    overlayClassName="z-[70] bg-black/60 backdrop-blur-sm"
                    contentClassName="z-[75] bg-neutral-950 border-white/20 text-foreground"
                    trigger={
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl text-xs font-semibold gap-1.5 shadow-glow"
                      >
                        <Plus className="size-3.5" />
                        <span>{t.exerciseLibrary.addExercise}</span>
                      </Button>
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filtered.map((exercise) => {
                  const isSelected = selectedMap.has(exercise.id)
                  const muscleLabel = getMuscleGroupLabel(exercise.muscleGroup, locale)
                  const accent = MUSCLE_ACCENTS[exercise.muscleGroup.toUpperCase()]

                  return (
                    <div
                      key={exercise.id}
                      onClick={() => toggleSelect(exercise)}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-2xl border p-4 text-start transition-all cursor-pointer",
                        "backdrop-blur-md transform-gpu hover:-translate-y-0.5",
                        isSelected
                          ? "border-brand-400/90 bg-brand-500/15 shadow-[0_0_24px_rgba(var(--brand-glow),0.25)] ring-1 ring-brand-400/60"
                          : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
                        accent?.glow
                      )}
                    >
                      <div>
                        {/* Top bar with selection checkbox & category badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-semibold px-2 py-0.5",
                                accent
                                  ? cn("border", accent.border, accent.bg, accent.text)
                                  : "border-white/15 bg-white/10 text-white/90"
                              )}
                            >
                              {muscleLabel}
                            </Badge>

                            {exercise.subMuscleGroup && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium px-2 py-0.5 border-white/15 bg-white/[0.05] text-white/80"
                              >
                                {getSubMuscleGroupLabel(exercise.subMuscleGroup, locale)}
                              </Badge>
                            )}

                            {exercise.usageCount && exercise.usageCount > 0 ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold px-1.5 py-0.5 border-amber-400/40 bg-amber-500/10 text-amber-300 gap-1 shrink-0"
                              >
                                <Sparkles className="size-2.5 text-amber-400" />
                                <span>{isAr ? `${exercise.usageCount} استخدام` : `${exercise.usageCount} uses`}</span>
                              </Badge>
                            ) : null}
                          </div>

                          {mode === "batch" && (
                            <div
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                                isSelected
                                  ? "border-brand-400 bg-brand-500 text-white shadow-glow scale-110"
                                  : "border-white/25 bg-white/[0.05] group-hover:border-white/40"
                              )}
                            >
                              {isSelected && <Check className="size-3.5 stroke-[3]" />}
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h4
                          dir="ltr"
                          className="font-bold text-sm text-foreground group-hover:text-brand-300 transition-colors line-clamp-1 text-start"
                        >
                          {exercise.name}
                        </h4>
                      </div>

                      {/* Card Footer: Target sets/reps and video preview button */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-mono font-medium text-foreground/80">
                            {exercise.defaultSets ?? 3}×{exercise.defaultReps ?? 10}
                            {exercise.defaultRestSeconds ? ` · ${exercise.defaultRestSeconds}s` : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {exercise.youtubeUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewExercise(exercise)
                              }}
                              className="size-7 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                              title="Preview video demo"
                            >
                              <Play className="size-3.5 fill-current" />
                            </Button>
                          )}
                          {mode === "single" && (
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              className="rounded-lg text-xs h-7 px-2.5"
                            >
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Inspector Panel: Video Demo or Selected Queue */}
          <div className="w-full md:w-84 lg:w-96 border-t md:border-t-0 md:border-s border-white/10 bg-neutral-950/70 p-5 flex flex-col justify-between shrink-0">
            {previewExercise ? (
              /* Active Video Preview Inspector */
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2 min-w-0">
                    <Play className="size-4 text-brand-400 shrink-0" />
                    <span className="text-xs font-bold truncate">Exercise Preview</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewExercise(null)}
                    className="text-muted-foreground hover:text-foreground p-1"
                    title="Close preview"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div>
                  <h4 dir="ltr" className="font-bold text-base text-foreground text-start">
                    {previewExercise.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {getMuscleGroupLabel(previewExercise.muscleGroup, locale)}
                    </Badge>
                    {previewExercise.subMuscleGroup && (
                      <Badge variant="outline" className="text-[10px] border-white/20 bg-white/[0.05]">
                        {getSubMuscleGroupLabel(previewExercise.subMuscleGroup, locale)}
                      </Badge>
                    )}
                  </div>
                </div>

                {previewExercise.youtubeUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-white/15 aspect-video shadow-2xl bg-black">
                    <YouTubePlayer url={previewExercise.youtubeUrl} />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-xs text-muted-foreground">
                    No video link attached
                  </div>
                )}

                <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Default Volume:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {previewExercise.defaultSets ?? 3} sets × {previewExercise.defaultReps ?? 10} reps
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rest Interval:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {previewExercise.defaultRestSeconds ?? 90} seconds
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full rounded-xl shadow-glow gap-1.5"
                  onClick={() => toggleSelect(previewExercise)}
                >
                  {selectedMap.has(previewExercise.id) ? (
                    <>
                      <X className="size-4" />
                      <span>Remove from Selection</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      <span>Add to Selection</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* Selected Queue Tray */
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold tracking-wide">
                      Selected Tray ({selectedMap.size})
                    </span>
                    {selectedMap.size > 0 && (
                      <span className="text-[11px] text-brand-400 font-mono">
                        ~{totalPlannedSets} Sets Total
                      </span>
                    )}
                  </div>

                  {selectedMap.size === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-white/[0.04] mx-auto text-muted-foreground">
                        <Check className="size-5" />
                      </div>
                      <p className="text-xs font-medium text-foreground/80">
                        No exercises chosen yet
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Click on any exercise card on the left to add it to this workout day.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[48vh] overflow-y-auto pe-1">
                      {Array.from(selectedMap.values()).map((ex, idx) => (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs transition-colors hover:border-white/20"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-mono text-[10px] text-brand-400/80">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p dir="ltr" className="font-semibold truncate text-start">
                                {ex.name}
                              </p>
                              {ex.subMuscleGroup && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {getSubMuscleGroupLabel(ex.subMuscleGroup, locale)}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSelect(ex)}
                            className="text-muted-foreground hover:text-destructive p-1"
                            title="Remove"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedMap.size > 0 && (
                  <div className="pt-3 border-t border-white/10 text-xs text-muted-foreground">
                    💡 All selected exercises will be imported into Day {dayNumber ?? 1} with their recommended sets and rest intervals.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. Bottom Action Dock / Footer */}
        {mode === "batch" && (
          <div className="p-5 border-t border-white/10 bg-neutral-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-foreground">
                {selectedMap.size} {selectedMap.size === 1 ? "Exercise" : "Exercises"} Selected
              </span>
              <span className="text-white/20">•</span>
              <span className="text-muted-foreground font-mono">
                ~{totalPlannedSets} Planned Sets
              </span>
            </div>

            <div className="flex items-center gap-2.5 ms-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-9 rounded-xl border-white/15 bg-white/[0.04] text-xs px-4"
              >
                {t.common.cancel}
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={selectedMap.size === 0}
                onClick={handleAddBatch}
                className="h-9 rounded-xl text-xs font-semibold shadow-glow gap-2 px-5"
              >
                <Plus className="size-4" />
                <span>
                  Add ({selectedMap.size}) to Day {dayNumber ?? ""}
                </span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
