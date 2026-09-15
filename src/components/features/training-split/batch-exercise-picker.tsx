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
import { getExerciseName, getMuscleGroupLabel, getEquipmentLabel } from "@/lib/i18n/labels"
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
}: BatchExercisePickerProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [query, setQuery] = useState("")
  const [activeMuscleGroup, setActiveMuscleGroup] = useState<string>("ALL")
  const [selectedMap, setSelectedMap] = useState<Map<string, ExerciseOption>>(() => {
    const map = new Map<string, ExerciseOption>()
    for (const id of initialSelectedIds) {
      const found = exercises.find((ex) => ex.id === id)
      if (found) map.set(id, found)
    }
    return map
  })
  const [previewExercise, setPreviewExercise] = useState<ExerciseOption | null>(null)

  // Extract distinct muscle groups
  const muscleGroups = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exercises) {
      if (ex.muscleGroup) set.add(ex.muscleGroup)
    }
    return Array.from(set).sort()
  }, [exercises])

  // Filter exercises by query and muscle group
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter((ex) => {
      if (activeMuscleGroup !== "ALL" && ex.muscleGroup !== activeMuscleGroup) {
        return false
      }
      if (!q) return true
      return (
        ex.name.toLowerCase().includes(q) ||
        (ex.nameAr ?? "").toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        (ex.equipment ?? "").toLowerCase().includes(q)
      )
    })
  }, [exercises, query, activeMuscleGroup])

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
        <DialogHeader className="p-6 pb-4 border-b border-white/10 text-start space-y-4 shrink-0 bg-white/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-glow">
                <Layers className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {t.trainingSplit.exerciseLibrary}
                  </DialogTitle>
                  {dayNumber !== undefined && (
                    <Badge variant="outline" className="border-brand-500/40 bg-brand-500/10 text-brand-300 text-xs px-2.5 py-0.5">
                      {t.trainingSplit.dayPrefix} {dayNumber}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select and batch-insert exercises with customized sets, reps, and video guides
                </p>
              </div>
            </div>

            {/* Selection Telemetry Badge */}
            {mode === "batch" && (
              <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>

          {/* Search bar & quick filter actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={`${t.trainingSplit.searchExercise} (by name, muscle, or equipment)...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 ps-10 pe-9 rounded-2xl border-white/15 bg-white/[0.04] backdrop-blur-md text-sm transition-all focus:border-brand-400 focus:ring-1 focus:ring-brand-400/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {mode === "batch" && filtered.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllFiltered}
                className="h-10 rounded-2xl border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold gap-1.5 shrink-0 px-3.5"
              >
                <CheckCheck className="size-4 text-brand-400" />
                <span>Select All ({filtered.length})</span>
              </Button>
            )}
          </div>

          {/* Muscle Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveMuscleGroup("ALL")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border",
                activeMuscleGroup === "ALL"
                  ? "border-brand-400/80 bg-brand-500 text-white shadow-glow"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
              )}
            >
              All Muscles ({exercises.length})
            </button>
            {muscleGroups.map((group) => {
              const label = getMuscleGroupLabel(group, locale)
              const count = exercises.filter((e) => e.muscleGroup === group).length
              const isCurrent = activeMuscleGroup === group
              const accent = MUSCLE_ACCENTS[group.toUpperCase()]

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setActiveMuscleGroup(group)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5",
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
        </DialogHeader>

        {/* 2. Main Content: Responsive Card Grid + Side Inspector */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          {/* Exercises Grid Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {filtered.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Dumbbell className="size-10 mx-auto text-muted-foreground/40" />
                <p className="text-base font-semibold text-foreground/80">
                  {t.trainingSplit.noExercisesFound}
                </p>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your search keywords or switching the muscle category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filtered.map((exercise) => {
                  const isSelected = selectedMap.has(exercise.id)
                  const primaryName = getExerciseName(exercise, locale)
                  const secondaryName = isAr ? exercise.name : exercise.nameAr
                  const muscleLabel = getMuscleGroupLabel(exercise.muscleGroup, locale)
                  const equipmentLabel = getEquipmentLabel(exercise.equipment, locale)
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

                        {/* Title & Secondary Title */}
                        <h4 className="font-bold text-sm text-foreground group-hover:text-brand-300 transition-colors line-clamp-1">
                          {primaryName}
                        </h4>
                        {secondaryName && secondaryName !== primaryName && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" dir="auto">
                            {secondaryName}
                          </p>
                        )}
                      </div>

                      {/* Card Footer: Target sets/reps, equipment, and video preview button */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          {equipmentLabel && (
                            <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 border border-white/5 truncate max-w-[90px]">
                              {equipmentLabel}
                            </span>
                          )}
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
                  <h4 className="font-bold text-base text-foreground">
                    {getExerciseName(previewExercise, locale)}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {getMuscleGroupLabel(previewExercise.muscleGroup, locale)}
                    </Badge>
                    {previewExercise.equipment && (
                      <span className="text-xs text-muted-foreground">
                        {previewExercise.equipment}
                      </span>
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
                            <span className="font-semibold truncate">
                              {getExerciseName(ex, locale)}
                            </span>
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
