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
import { getMuscleGroupLabel } from "@/lib/i18n/labels"
import { ExerciseFormDialog } from "@/components/features/exercise-library/exercise-form-dialog"
import { RemoveExerciseButton } from "@/components/features/exercise-library/remove-exercise-button"
import { MUSCLE_ACCENTS, DEFAULT_ACCENT } from "@/components/features/exercise-library/muscle-sidebar"
import { cn } from "@/lib/utils"
import type { LibraryExercise } from "@/server/services/exercise.service"

interface ExercisePanelProps {
  exercises: LibraryExercise[]
  selectedMuscle: string
  availableGroups: string[]
  onAddMuscleGroupPrompt?: () => void
  className?: string
}

export function ExercisePanel({
  exercises,
  selectedMuscle,
  availableGroups,
  className,
}: ExercisePanelProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  const [query, setQuery] = useState("")
  const [videoFilter, setVideoFilter] = useState<"ALL" | "HAS_VIDEO" | "NO_VIDEO">("ALL")
  const [originFilter, setOriginFilter] = useState<"ALL" | "GLOBAL" | "CUSTOM" | "EDITED">("ALL")
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      // 1. Muscle filter
      if (selectedMuscle !== "ALL") {
        if ((ex.muscleGroup || "").toLowerCase() !== selectedMuscle.toLowerCase()) {
          return false
        }
      }

      // 2. Query search
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const matchName = ex.name ? ex.name.toLowerCase().includes(q) : false
        const matchNameAr = ex.nameAr ? ex.nameAr.toLowerCase().includes(q) : false
        if (!matchName && !matchNameAr) return false
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
  }, [exercises, selectedMuscle, query, videoFilter, originFilter])

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

  const defaultMuscleForForm = isAll ? "chest" : selectedMuscle

  return (
    <div
      className={cn(
        "flex flex-col flex-1 h-full min-h-0 bg-background overflow-hidden",
        className
      )}
    >
      {/* Top Header — Fixed Top */}
      <div className="shrink-0 p-4 sm:p-5 border-b border-border/80 bg-card/70 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              <Badge
                variant="secondary"
                className="text-xs font-bold tabular-nums shrink-0"
              >
                {filteredExercises.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {isAll
                ? (isAr
                    ? "إدارة وتصفح كافة التمارين المسجلة بالمكتبة"
                    : "Browsing all exercises in the library")
                : (isAr
                    ? `تمارين خاصة بمجموعة ${selectedMuscleTitle}`
                    : `Exercises for ${selectedMuscleTitle}`)}
            </p>
          </div>
        </div>

        {/* Add Exercise Button Pre-seeded with Current Muscle Group */}
        <div className="shrink-0">
          <ExerciseFormDialog
            defaultMuscleGroup={defaultMuscleForForm}
            availableMuscleGroups={availableGroups}
            trigger={
              <Button className="w-full sm:w-auto gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-soft font-semibold text-xs h-9.5">
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
      <div className="shrink-0 p-3 sm:px-4 border-b border-border/60 bg-card/40 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.exerciseLibrary.searchPlaceholder}
            className="h-9 ps-9 rounded-xl bg-card border-border/70 text-xs shadow-none"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {/* Video Status Pills */}
          <div className="inline-flex rounded-xl bg-muted/50 p-0.5 border border-border/50 text-xs font-medium">
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

          {/* Origin Pills */}
          <div className="inline-flex rounded-xl bg-muted/50 p-0.5 border border-border/50 text-xs font-medium">
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

      {/* Exercises Table Area — Independent Scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-contain focus:outline-none">
        {filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <AlertCircle className="size-6" />
            </div>
            <p className="text-base font-bold text-foreground">
              {isAr ? "لا توجد تمارين مطابقة" : "No exercises match your search"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? "جرب تعديل كلمات البحث أو الفلاتر المحددة، أو قم بإضافة تمرين جديد."
                : "Try adjusting your search terms or filters, or add a new exercise."}
            </p>
            {(query || videoFilter !== "ALL" || originFilter !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("")
                  setVideoFilter("ALL")
                  setOriginFilter("ALL")
                }}
                className="mt-4 rounded-xl text-xs"
              >
                {isAr ? "إعادة ضبط الفلاتر" : "Reset Filters"}
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-start text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
              <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4 text-start border-b border-border/80">
                  {t.exerciseLibrary.exerciseCol || (isAr ? "التمرين" : "Exercise")}
                </th>
                <th className="py-3 px-4 text-start border-b border-border/80">
                  {t.exerciseLibrary.form.muscleGroup}
                </th>
                <th className="py-3 px-4 text-start border-b border-border/80">
                  {t.exerciseLibrary.typeCol || (isAr ? "النوع" : "Type")}
                </th>
                <th className="py-3 px-4 text-start border-b border-border/80">
                  {t.exerciseLibrary.videoCol || (isAr ? "الفيديو" : "Video")}
                </th>
                <th className="py-3 px-4 text-end border-b border-border/80">
                  {t.exerciseLibrary.actionsCol || (isAr ? "الإجراءات" : "Actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
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
                    className="group transition-colors hover:bg-muted/40"
                  >
                    {/* 1. التمرين */}
                    <td className="py-3 px-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {exercise.name}
                        </p>
                        {exercise.nameAr && (
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                            {exercise.nameAr}
                          </p>
                        )}
                        {exercise.equipment && (
                          <span className="inline-block mt-1 text-[11px] text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                            {exercise.equipment}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. المجموعة العضلية */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium border",
                          exAccent.border,
                          exAccent.bg,
                          exAccent.text
                        )}
                      >
                        {getMuscleGroupLabel(exercise.muscleGroup, locale) ||
                          exercise.muscleGroup}
                      </Badge>
                    </td>

                    {/* 3. النوع */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {exercise.isCustomized ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold"
                        >
                          {t.exerciseLibrary.editedBadge}
                        </Badge>
                      ) : exercise.isGlobal ? (
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {t.exerciseLibrary.globalBadge}
                        </Badge>
                      ) : (
                        <Badge className="bg-brand-500 text-white text-xs font-semibold">
                          {t.exerciseLibrary.customBadge}
                        </Badge>
                      )}
                    </td>

                    {/* 4. الفيديو */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {hasVideo && youtubeId ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewVideoUrl(exercise.youtubeUrl)}
                            className="group/thumb relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/80 bg-black/5 hover:ring-2 hover:ring-brand-500 transition-all shadow-xs"
                            title={isAr ? "معاينة الفيديو" : "Preview video"}
                          >
                            <img
                              src={getThumbnailUrl(youtubeId)}
                              alt=""
                              className="size-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/thumb:bg-black/10 transition-colors">
                              <Play className="size-3.5 fill-white text-white" />
                            </div>
                          </button>
                          <a
                            href={exercise.youtubeUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                            title={isAr ? "فتح في نافذة جديدة" : "Open externally"}
                          >
                            <Video className="size-3.5 text-rose-500" />
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span className="text-[11px]">
                            {t.exerciseLibrary.noVideoWarning}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 5. الإجراءات */}
                    <td className="py-3 px-4 text-end whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* Edit Drawer */}
                        <ExerciseFormDialog
                          exercise={exercise}
                          availableMuscleGroups={availableGroups}
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
              <Video className="size-5 text-rose-500" />
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
    </div>
  )
}
