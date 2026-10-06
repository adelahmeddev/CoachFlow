"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Video,
  Play,
  AlertCircle,
  ExternalLink,
  Layers,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { YouTubePlayer } from "@/components/ui/youtube-player"
import { useI18n } from "@/lib/i18n/client"
import { extractYoutubeId, getThumbnailUrl } from "@/lib/utils/video"
import { ExerciseFormDialog } from "@/components/features/exercise-library/exercise-form-dialog"
import { RemoveExerciseButton } from "@/components/features/exercise-library/remove-exercise-button"
import { MUSCLE_GROUPS } from "@/lib/constants"
import { getMuscleGroupLabel } from "@/lib/i18n/labels"
import { cn } from "@/lib/utils"
import type { LibraryExercise } from "@/server/services/exercise.service"

const MUSCLE_ACCENTS: Record<string, { border: string; bg: string; text: string }> = {
  CHEST: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  BACK: {
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
  },
  SHOULDERS: {
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  ARMS: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  LEGS: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
  },
  GLUTES: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
  },
  CORE: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  CARDIO: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
}

interface ExerciseLibraryTableProps {
  initialExercises: LibraryExercise[]
}

export function ExerciseLibraryTable({ initialExercises }: ExerciseLibraryTableProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  const [query, setQuery] = useState("")
  const [videoFilter, setVideoFilter] = useState("ALL") // ALL | HAS_VIDEO | NO_VIDEO
  const [muscleFilter, setMuscleFilter] = useState("ALL") // ALL | chest | back ...
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return initialExercises.filter((ex) => {
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        if (!ex.name.toLowerCase().includes(q)) return false
      }

      // Muscle filter
      if (muscleFilter !== "ALL") {
        if ((ex.muscleGroup || "").toLowerCase() !== muscleFilter.toLowerCase()) {
          return false
        }
      }

      // Video filter
      if (videoFilter === "HAS_VIDEO") {
        if (!ex.youtubeUrl || ex.youtubeUrl.trim() === "") return false
      } else if (videoFilter === "NO_VIDEO") {
        if (ex.youtubeUrl && ex.youtubeUrl.trim() !== "") return false
      }

      return true
    })
  }, [initialExercises, query, muscleFilter, videoFilter])

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3.5 shadow-soft backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.exerciseLibrary.searchPlaceholder}
              className="h-9 ps-9 bg-card shadow-soft"
            />
          </div>

          {/* Muscle Category filter */}
          <Select value={muscleFilter} onValueChange={setMuscleFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[160px] bg-card shadow-soft">
              <SelectValue placeholder={t.exerciseLibrary.filterMuscleGroup} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {isAr ? "كل المجموعات العضلية" : "All Muscle Groups"}
              </SelectItem>
              {MUSCLE_GROUPS.map((group) => (
                <SelectItem key={group} value={group}>
                  {getMuscleGroupLabel(group, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Video filter */}
          <Select value={videoFilter} onValueChange={setVideoFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[140px] bg-card shadow-soft">
              <SelectValue placeholder={t.exerciseLibrary.filterVideo} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t.exerciseLibrary.allVideos}</SelectItem>
              <SelectItem value="HAS_VIDEO">{t.exerciseLibrary.hasVideo}</SelectItem>
              <SelectItem value="NO_VIDEO">{t.exerciseLibrary.noVideo}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Add Exercise Drawer */}
          <ExerciseFormDialog />
        </div>
      </div>

      {/* Exercises Table / Cards */}
      {filteredExercises.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-soft">
          <p className="text-base font-semibold">{isAr ? "لا توجد تمارين مطابقة" : "No exercises match your search"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "جرب تعديل كلمات البحث أو التصفيات" : "Try adjusting your search terms or filters"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4 text-start">{isAr ? "التمرين" : "Exercise"}</th>
                  <th className="py-3 px-4 text-start">{t.exerciseLibrary.form.muscleGroup}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "النوع" : "Origin"}</th>
                  <th className="py-3 px-4 text-start">{isAr ? "الفيديو" : "Video"}</th>
                  <th className="py-3 px-4 text-end">{isAr ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredExercises.map((exercise) => {
                  const youtubeId = exercise.youtubeUrl ? extractYoutubeId(exercise.youtubeUrl) : null
                  const hasVideo = Boolean(youtubeId)
                  const accent = MUSCLE_ACCENTS[exercise.muscleGroup.toUpperCase()]

                  return (
                    <tr
                      key={exercise.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground leading-tight">
                            {exercise.name}
                          </p>
                        </div>
                      </td>

                      {/* Muscle Group Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium border",
                            accent?.border || "border-border",
                            accent?.bg || "bg-muted/50",
                            accent?.text || "text-foreground"
                          )}
                        >
                          {getMuscleGroupLabel(exercise.muscleGroup, locale)}
                        </Badge>
                      </td>

                      {/* Origin Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {exercise.isCustomized ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs"
                          >
                            {t.exerciseLibrary.editedBadge}
                          </Badge>
                        ) : exercise.isGlobal ? (
                          <Badge variant="secondary" className="text-xs">
                            {t.exerciseLibrary.globalBadge}
                          </Badge>
                        ) : (
                          <Badge className="bg-brand-500 text-white text-xs">
                            {t.exerciseLibrary.customBadge}
                          </Badge>
                        )}
                      </td>

                      {/* Video column */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasVideo && youtubeId ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewVideoUrl(exercise.youtubeUrl)}
                              className="group/thumb relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-black/5 hover:ring-2 hover:ring-brand-500 transition-all"
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
                              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                            >
                              <Video className="size-3.5 text-rose-500" />
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertCircle className="size-3.5 shrink-0" />
                            <span className="text-[11px]">{t.exerciseLibrary.noVideoWarning}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-end whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit drawer */}
                          <ExerciseFormDialog exercise={exercise} />

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
          </div>
        </div>
      )}

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
