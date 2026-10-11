"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Video,
  Play,
  AlertCircle,
  ExternalLink,
  Plus,
  Dumbbell,
  ArrowRightLeft,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { YouTubePlayer } from "@/components/ui/youtube-player"
import { useI18n } from "@/lib/i18n/client"
import { extractYoutubeId, getThumbnailUrl } from "@/lib/utils/video"
import { getMuscleGroupLabel, getSubMuscleGroupLabel } from "@/lib/i18n/labels"
import { SUB_MUSCLE_GROUPS } from "@/lib/constants"
import { ExerciseFormDialog } from "@/components/features/exercise-library/exercise-form-dialog"
import { RemoveExerciseButton } from "@/components/features/exercise-library/remove-exercise-button"
import { AddSubMuscleDialog } from "@/components/features/exercise-library/add-sub-muscle-dialog"
import { MUSCLE_ACCENTS, DEFAULT_ACCENT } from "@/components/features/exercise-library/muscle-sidebar"
import { cn } from "@/lib/utils"
import type { LibraryExercise } from "@/server/services/exercise.service"

interface ExercisePanelProps {
  exercises: LibraryExercise[]
  selectedMuscle: string
  selectedSubMuscle: string
  onSelectSubMuscle: (subMuscle: string) => void
  availableGroups: string[]
  customSubMuscles?: Record<string, string[]>
  onAddSubMuscle?: (muscleGroup: string, newSubMuscle: string) => void
  onOpenAddSubMuscle?: (initialSubName?: string) => void
  onAddMuscleGroupPrompt?: () => void
  className?: string
}

export function ExercisePanel({
  exercises,
  selectedMuscle,
  selectedSubMuscle,
  onSelectSubMuscle,
  availableGroups,
  customSubMuscles,
  onAddSubMuscle,
  onOpenAddSubMuscle,
  className,
}: ExercisePanelProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  const [query, setQuery] = useState("")
  const [videoFilter, setVideoFilter] = useState<"ALL" | "HAS_VIDEO" | "NO_VIDEO">("ALL")
  const [originFilter, setOriginFilter] = useState<"ALL" | "GLOBAL" | "CUSTOM" | "EDITED">("ALL")
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)
  const [addSubDialogOpen, setAddSubDialogOpen] = useState(false)
  const [subMuscleToMoveInto, setSubMuscleToMoveInto] = useState<string | undefined>(undefined)

  // Sub-muscles for the selected group (Predefined + dynamic from exercises + custom)
  const availableSubMuscles = useMemo(() => {
    if (selectedMuscle === "ALL") return []
    const mKey = selectedMuscle.toLowerCase()
    const base = SUB_MUSCLE_GROUPS[mKey] || []
    const fromExercises = exercises
      .filter((ex) => (ex.muscleGroup || "").toLowerCase() === mKey)
      .map((ex) => (ex.subMuscleGroup || "").trim())
      .filter(Boolean)
    const fromCustom = customSubMuscles?.[mKey] || []

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
  }, [selectedMuscle, exercises, customSubMuscles])

  // Count exercises per sub-muscle tab
  const subMuscleCounts = useMemo(() => {
    if (selectedMuscle === "ALL") return {}
    const counts: Record<string, number> = {}
    const inCurrentMuscle = exercises.filter(
      (ex) => (ex.muscleGroup || "").toLowerCase() === selectedMuscle.toLowerCase()
    )
    for (const sub of availableSubMuscles) {
      counts[sub] = inCurrentMuscle.filter(
        (ex) => (ex.subMuscleGroup || "").toLowerCase() === sub.toLowerCase()
      ).length
    }
    return counts
  }, [exercises, selectedMuscle, availableSubMuscles])

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      // 1. Muscle filter
      if (selectedMuscle !== "ALL") {
        if ((ex.muscleGroup || "").toLowerCase() !== selectedMuscle.toLowerCase()) {
          return false
        }
      }

      // 1b. Sub-muscle filter (if active and not "ALL")
      if (selectedMuscle !== "ALL" && selectedSubMuscle !== "ALL") {
        if ((ex.subMuscleGroup || "").toLowerCase() !== selectedSubMuscle.toLowerCase()) {
          return false
        }
      }

      // 2. Query search
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const matchName = ex.name ? ex.name.toLowerCase().includes(q) : false
        const matchNameAr = ex.nameAr ? ex.nameAr.toLowerCase().includes(q) : false
        const matchEquipment = ex.equipment ? ex.equipment.toLowerCase().includes(q) : false
        if (!matchName && !matchNameAr && !matchEquipment) return false
      }

      // 3. Video filter
      if (videoFilter === "HAS_VIDEO") {
        if (!ex.youtubeUrl || ex.youtubeUrl.trim() === "") return false
      } else if (videoFilter === "NO_VIDEO") {
        if (ex.youtubeUrl && ex.youtubeUrl.trim() !== "") return false
      }

      // 4. Origin filter
      if (originFilter === "GLOBAL") {
        if (!ex.isGlobal || ex.isCustomized) return false
      } else if (originFilter === "CUSTOM") {
        if (ex.isGlobal) return false
      } else if (originFilter === "EDITED") {
        if (!ex.isCustomized) return false
      }

      return true
    })
  }, [exercises, selectedMuscle, selectedSubMuscle, query, videoFilter, originFilter])

  // Current title & accent
  const isAll = selectedMuscle === "ALL"
  const muscleKey = selectedMuscle.toLowerCase()
  const accent = MUSCLE_ACCENTS[muscleKey] || {
    border: "border-border",
    bg: "bg-muted/50",
    text: "text-foreground",
    dot: "bg-brand-500",
  }

  const selectedMuscleTitle = isAll
    ? (t.exerciseLibrary.allExercises || (isAr ? "جميع التمارين" : "All Exercises"))
    : (getMuscleGroupLabel(selectedMuscle, locale) || selectedMuscle)

  const activeSubTitle =
    selectedSubMuscle !== "ALL"
      ? (getSubMuscleGroupLabel(selectedSubMuscle, locale) || selectedSubMuscle)
      : null

  const defaultMuscleForForm = isAll ? "chest" : selectedMuscle
  const defaultSubMuscleForForm = selectedSubMuscle !== "ALL" ? selectedSubMuscle : undefined

  return (
    <div
      className={cn(
        "flex flex-col flex-1 h-full min-h-0 bg-background overflow-hidden",
        className
      )}
    >
      {/* Top Header — Fixed Top */}
      <div className="shrink-0 p-3.5 sm:px-6 sm:py-4 border-b border-border/80 bg-card/60 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "size-10 rounded-2xl flex items-center justify-center border shrink-0",
              isAll
                ? "bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400"
                : cn(accent.bg, accent.border, accent.text)
            )}
          >
            <Dumbbell className="size-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground truncate">
                {selectedMuscleTitle}
              </h2>
              {activeSubTitle && (
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-lg shrink-0">
                  {activeSubTitle}
                </span>
              )}
              <Badge
                variant="secondary"
                className="text-xs font-bold tabular-nums shrink-0"
              >
                {filteredExercises.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {isAll
                ? (isAr
                    ? "إدارة وتصفح كافة تمارين المكتبة"
                    : "Browsing all exercises in the library")
                : activeSubTitle
                ? (isAr
                    ? `تمارين قسم ${activeSubTitle} ضمن ${selectedMuscleTitle}`
                    : `Exercises in ${activeSubTitle} of ${selectedMuscleTitle}`)
                : (isAr
                    ? `تمارين خاصة بمجموعة ${selectedMuscleTitle}`
                    : `Exercises for ${selectedMuscleTitle}`)}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="shrink-0 flex items-center gap-2">
          {/* Move Exercises Button (Visible when inside a specific sub-muscle) */}
          {!isAll && selectedSubMuscle !== "ALL" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (onOpenAddSubMuscle) {
                  onOpenAddSubMuscle(selectedSubMuscle)
                } else {
                  setSubMuscleToMoveInto(selectedSubMuscle)
                  setAddSubDialogOpen(true)
                }
              }}
              className="gap-1.5 rounded-xl border-border/80 hover:border-brand-500/60 hover:bg-brand-500/5 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-bold h-9 sm:h-9.5 px-3 transition-colors"
              title={isAr ? `نقل تمارين إلى قسم ${activeSubTitle || selectedSubMuscle}` : "Move exercises into this division"}
            >
              <ArrowRightLeft className="size-3.5 text-brand-500" />
              <span>{isAr ? "نقل تمارين هنا" : "Move Exercises Here"}</span>
            </Button>
          )}

          {/* Add Exercise Button with Brand Gradient */}
          <ExerciseFormDialog
            defaultMuscleGroup={defaultMuscleForForm}
            defaultSubMuscleGroup={defaultSubMuscleForForm}
            availableMuscleGroups={availableGroups}
            availableSubMuscles={availableSubMuscles}
            trigger={
              <Button className="w-full sm:w-auto gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 text-white shadow-soft font-bold text-xs h-9 sm:h-9.5 px-4 transition-all">
                <Plus className="size-4" />
                <span>
                  {isAll
                    ? t.exerciseLibrary.addExercise
                    : (t.exerciseLibrary.addExerciseToGroup || (isAr ? "إضافة تمرين هنا" : "Add Exercise Here"))}
                </span>
              </Button>
            }
          />
        </div>
      </div>

      {/* Toolbar — Fixed Top */}
      <div className="shrink-0 p-3 sm:px-6 border-b border-border/70 bg-card/40 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.exerciseLibrary.searchPlaceholder}
            className="h-9 ps-9 rounded-xl bg-card border-border/80 text-xs shadow-none focus-visible:border-brand-500"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Video Filter */}
          <div className="inline-flex rounded-xl bg-muted/50 p-0.5 border border-border/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => setVideoFilter("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                videoFilter === "ALL"
                  ? "bg-card text-foreground shadow-soft font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.exerciseLibrary.allVideos}
            </button>
            <button
              type="button"
              onClick={() => setVideoFilter("HAS_VIDEO")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                videoFilter === "HAS_VIDEO"
                  ? "bg-card text-foreground shadow-soft font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.exerciseLibrary.hasVideo}
            </button>
            <button
              type="button"
              onClick={() => setVideoFilter("NO_VIDEO")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                videoFilter === "NO_VIDEO"
                  ? "bg-card text-foreground shadow-soft font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.exerciseLibrary.noVideo}
            </button>
          </div>

          {/* Origin Filter */}
          <div className="inline-flex rounded-xl bg-muted/50 p-0.5 border border-border/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => setOriginFilter("ALL")}
              className={cn(
                "px-2 py-1 rounded-lg transition-all",
                originFilter === "ALL"
                  ? "bg-card text-foreground shadow-soft font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAr ? "الكل" : "All"}
            </button>
            <button
              type="button"
              onClick={() => setOriginFilter("GLOBAL")}
              className={cn(
                "px-2 py-1 rounded-lg transition-all",
                originFilter === "GLOBAL"
                  ? "bg-card text-foreground shadow-soft font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.exerciseLibrary.globalBadge}
            </button>
            <button
              type="button"
              onClick={() => setOriginFilter("CUSTOM")}
              className={cn(
                "px-2 py-1 rounded-lg transition-all",
                originFilter === "CUSTOM"
                  ? "bg-card text-foreground shadow-soft font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.exerciseLibrary.customBadge}
            </button>
            <button
              type="button"
              onClick={() => setOriginFilter("EDITED")}
              className={cn(
                "px-2 py-1 rounded-lg transition-all",
                originFilter === "EDITED"
                  ? "bg-card text-foreground shadow-soft font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.exerciseLibrary.editedBadge}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Muscle Filter Tabs (When inside a specific muscle group) */}
      {!isAll && (
        <div className="shrink-0 px-3 sm:px-6 py-2.5 border-b border-border/70 bg-card/25 backdrop-blur-xs flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-muted-foreground me-1 shrink-0 uppercase tracking-wider">
            {t.exerciseLibrary.subMuscleGroup || (isAr ? "التقسيم الفرعي:" : "Sub-muscles:")}
          </span>

          {/* All Sub-muscles Tab */}
          <button
            type="button"
            onClick={() => onSelectSubMuscle("ALL")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer",
              selectedSubMuscle === "ALL"
                ? "bg-brand-500 text-white shadow-soft font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/60"
            )}
          >
            <span>{isAr ? "الكل" : "All"}</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono font-bold",
                selectedSubMuscle === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {
                exercises.filter(
                  (ex) => (ex.muscleGroup || "").toLowerCase() === selectedMuscle.toLowerCase()
                ).length
              }
            </span>
          </button>

          {/* Individual Sub-muscles Tabs */}
          {availableSubMuscles.map((sub) => {
            const count = subMuscleCounts[sub] || 0
            const isActive = selectedSubMuscle.toLowerCase() === sub.toLowerCase()
            const label = getSubMuscleGroupLabel(sub, locale) || sub

            return (
              <button
                key={sub}
                type="button"
                onClick={() => onSelectSubMuscle(sub)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer",
                  isActive
                    ? "bg-brand-500 text-white shadow-soft font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/60"
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono font-bold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}

          {/* Final Tab: Add Sub-Muscle Division Button (+) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenAddSubMuscle) {
                onOpenAddSubMuscle(undefined)
              } else {
                setSubMuscleToMoveInto(undefined)
                setAddSubDialogOpen(true)
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border border-dashed border-border/80 hover:border-brand-500/60 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/5 text-muted-foreground"
            title={isAr ? "إضافة قسم عضلي فرعي ونقل التمارين إليه" : "Add sub-muscle and move exercises"}
          >
            <Plus className="size-3.5" />
            <span>{isAr ? "قسم جديد" : "New Division"}</span>
          </button>
        </div>
      )}

      {/* Exercises Table Area — Modern, Spacious Rows & Independent Scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-contain focus:outline-none">
        {filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <AlertCircle className="size-7 text-brand-500" />
            </div>
            <p className="text-base font-bold text-foreground">
              {isAr ? "لا توجد تمارين مطابقة" : "No exercises match your search"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? "جرب تعديل كلمات البحث أو الفلاتر المحددة، أو قم بإضافة تمرين جديد."
                : "Try adjusting your search terms or filters, or add a new exercise."}
            </p>
            {(query || videoFilter !== "ALL" || originFilter !== "ALL" || selectedSubMuscle !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("")
                  setVideoFilter("ALL")
                  setOriginFilter("ALL")
                  onSelectSubMuscle("ALL")
                }}
                className="mt-4 rounded-xl text-xs font-bold"
              >
                {isAr ? "إعادة ضبط الفلاتر" : "Reset Filters"}
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-start border-separate border-spacing-0">
            {/* Sticky Modern Table Header */}
            <thead className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
              <tr className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 sm:px-6 text-start border-b border-border/80">
                  {t.exerciseLibrary.exerciseCol || (isAr ? "التمرين" : "Exercise")}
                </th>
                <th className="py-3.5 px-4 sm:px-6 text-start border-b border-border/80">
                  {t.exerciseLibrary.form.muscleGroup}
                </th>
                <th className="py-3.5 px-4 sm:px-6 text-start border-b border-border/80">
                  {t.exerciseLibrary.typeCol || (isAr ? "المصدر" : "Source")}
                </th>
                <th className="py-3.5 px-4 sm:px-6 text-start border-b border-border/80">
                  {t.exerciseLibrary.videoCol || (isAr ? "الفيديو" : "Video")}
                </th>
                <th className="py-3.5 px-4 sm:px-6 text-end border-b border-border/80">
                  {t.exerciseLibrary.actionsCol || (isAr ? "الإجراءات" : "Actions")}
                </th>
              </tr>
            </thead>

            {/* Table Rows — Spacious, Comfortable & Modern */}
            <tbody className="divide-y divide-border/60 bg-background">
              {filteredExercises.map((exercise) => {
                const youtubeId = exercise.youtubeUrl
                  ? extractYoutubeId(exercise.youtubeUrl)
                  : null
                const hasVideo = Boolean(youtubeId)
                const exMuscleKey = (exercise.muscleGroup || "chest").toLowerCase()
                const exAccent = MUSCLE_ACCENTS[exMuscleKey] || DEFAULT_ACCENT

                return (
                  <tr
                    key={exercise.id}
                    className="group transition-colors hover:bg-muted/30"
                  >
                    {/* 1. Exercise Column (Spacious & Modern Typography) */}
                    <td className="py-4 sm:py-4.5 px-4 sm:px-6">
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {exercise.name}
                        </p>
                        {exercise.nameAr && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                            {exercise.nameAr}
                          </p>
                        )}
                        {exercise.equipment && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50 font-mono">
                              {exercise.equipment}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. Muscle & Sub-Muscle Column */}
                    <td className="py-4 sm:py-4.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-lg border",
                            exAccent.border,
                            exAccent.bg,
                            exAccent.text
                          )}
                        >
                          {getMuscleGroupLabel(exercise.muscleGroup, locale) ||
                            exercise.muscleGroup}
                        </Badge>
                        {exercise.subMuscleGroup && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                            <span>•</span>
                            <span>
                              {getSubMuscleGroupLabel(exercise.subMuscleGroup, locale) ||
                                exercise.subMuscleGroup}
                            </span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Source / Type Column */}
                    <td className="py-4 sm:py-4.5 px-4 sm:px-6 whitespace-nowrap">
                      {exercise.isCustomized ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-lg"
                        >
                          {t.exerciseLibrary.editedBadge}
                        </Badge>
                      ) : exercise.isGlobal ? (
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border/50"
                        >
                          {t.exerciseLibrary.globalBadge}
                        </Badge>
                      ) : (
                        <Badge className="bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs">
                          {t.exerciseLibrary.customBadge}
                        </Badge>
                      )}
                    </td>

                    {/* 4. Video Column (Modern Thumbnail Preview & Link) */}
                    <td className="py-4 sm:py-4.5 px-4 sm:px-6 whitespace-nowrap">
                      {hasVideo && youtubeId ? (
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPreviewVideoUrl(exercise.youtubeUrl)}
                            className="group/thumb relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-black/5 hover:ring-2 hover:ring-brand-500 transition-all shadow-xs"
                            title={isAr ? "معاينة الفيديو" : "Preview video"}
                          >
                            <img
                              src={getThumbnailUrl(youtubeId)}
                              alt=""
                              className="size-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover/thumb:bg-black/15 transition-colors">
                              <div className="size-5 rounded-full bg-white/90 flex items-center justify-center shadow-xs">
                                <Play className="size-2.5 fill-brand-600 text-brand-600 ms-0.5" />
                              </div>
                            </div>
                          </button>
                          <a
                            href={exercise.youtubeUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            title={isAr ? "فتح في نافذة جديدة" : "Open externally"}
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>{t.exerciseLibrary.noVideoWarning || (isAr ? "بدون فيديو" : "No video")}</span>
                        </div>
                      )}
                    </td>

                    {/* 5. Actions Column (Spacious & Clean) */}
                    <td className="py-4 sm:py-4.5 px-4 sm:px-6 text-end whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Edit Drawer */}
                        <ExerciseFormDialog
                          exercise={exercise}
                          availableMuscleGroups={availableGroups}
                          availableSubMuscles={availableSubMuscles}
                        />

                        {/* Reset button (for customized globals) */}
                        {exercise.isCustomized && (
                          <RemoveExerciseButton
                            exerciseId={exercise.id}
                            mode="reset"
                          />
                        )}

                        {/* Remove button */}
                        <RemoveExerciseButton
                          exerciseId={exercise.id}
                          mode="remove"
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modern Status Footer Bar */}
      <div className="h-9 shrink-0 border-t border-border/70 bg-card/40 px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>{isAr ? "إجمالي التمارين المعروضة:" : "Displayed Exercises:"}</span>
          <strong className="text-foreground font-mono font-bold">
            {filteredExercises.length}
          </strong>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-medium hidden sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>{isAr ? "فيديو متوفر" : "Video Available"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-500" />
            <span>{isAr ? "تصميم عصري واسع" : "Modern Spacious Layout"}</span>
          </span>
        </div>
      </div>

      {/* Video Preview Modal */}
      <Dialog
        open={Boolean(previewVideoUrl)}
        onOpenChange={(open) => {
          if (!open) setPreviewVideoUrl(null)
        }}
      >
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="size-5 text-brand-500" />
              <span>{isAr ? "معاينة تمرين الفيديو" : "Exercise Video Preview"}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isAr ? "معاينة تمرين الفيديو" : "Exercise video preview player"}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl pt-2">
            {previewVideoUrl && (
              <YouTubePlayer url={previewVideoUrl} aspectRatio="16/9" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Move Sub-Muscle Dialog (when not handled by parent) */}
      {!onOpenAddSubMuscle && (
        <AddSubMuscleDialog
          open={addSubDialogOpen}
          onOpenChange={setAddSubDialogOpen}
          muscleGroup={selectedMuscle}
          exercises={exercises}
          existingSubMuscles={availableSubMuscles}
          initialSubMuscleName={subMuscleToMoveInto}
          onSuccess={(newSubName) => {
            onAddSubMuscle?.(selectedMuscle, newSubName)
            onSelectSubMuscle(newSubName)
          }}
        />
      )}
    </div>
  )
}
