"use client"

import { useMemo, useState } from "react"
import { Dumbbell, Search, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/client"
import {
  getExerciseName,
  getMuscleGroupLabel,
} from "@/lib/i18n/labels"
import type { ExerciseOption } from "@/lib/exercise-safety"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { YouTubePlayer } from "@/components/ui/youtube-player"

interface ExercisePickerProps {
  value: string | null
  exercises: ExerciseOption[]
  onSelect: (exercise: ExerciseOption | null) => void
  disabled?: boolean
}

export function ExercisePicker({
  value,
  exercises,
  onSelect,
  disabled,
}: ExercisePickerProps) {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = useMemo(
    () => exercises.find((exercise) => exercise.id === value) ?? null,
    [exercises, value]
  )

  const groups = useMemo(() => {
    const filtered = exercises.filter((exercise) => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return (
        exercise.name.toLowerCase().includes(q) ||
        (exercise.nameAr ?? "").toLowerCase().includes(q)
      )
    })
    const map = new Map<string, ExerciseOption[]>()
    for (const exercise of filtered) {
      const list = map.get(exercise.muscleGroup) ?? []
      list.push(exercise)
      map.set(exercise.muscleGroup, list)
    }
    return [...map.entries()]
  }, [exercises, query])

  const [previewExercise, setPreviewExercise] = useState<ExerciseOption | null>(null)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="justify-start gap-2 font-normal"
      >
        <Dumbbell className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">
          {selected
            ? getExerciseName(selected, locale)
            : t.trainingSplit.selectExercise}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.trainingSplit.exerciseLibrary}</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder={t.trainingSplit.searchExercise}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ps-9"
            />
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 max-h-80 overflow-y-auto pe-1">
              {groups.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t.trainingSplit.noExercisesFound}
                </p>
              ) : (
                groups.map(([muscleGroup, list]) => (
                  <div key={muscleGroup} className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {getMuscleGroupLabel(muscleGroup, locale)}
                    </p>
                    <div className="grid gap-1">
                      {list.map((exercise) => (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() => {
                            onSelect(exercise)
                            setOpen(false)
                            setQuery("")
                          }}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start text-sm transition-colors hover:bg-accent",
                            exercise.id === value
                              ? "border-primary bg-accent"
                              : "border-border"
                          )}
                        >
                          <span className="truncate">
                            {getExerciseName(exercise, locale)}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {getMuscleGroupLabel(exercise.muscleGroup, locale)}
                          </span>
                          {exercise.youtubeUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewExercise(exercise)
                              }}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Play className="size-4" />
                            </Button>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {previewExercise && (
              <div className="w-full shrink-0 border-t pt-4 md:w-80 md:border-s md:border-t-0 md:ps-4 md:pt-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">
                    {getExerciseName(previewExercise, locale)}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPreviewExercise(null)}
                    aria-label={t.common.close}
                  >
                    <span className="sr-only">{t.common.close}</span>
                    ×
                  </Button>
                </div>
                <YouTubePlayer url={previewExercise.youtubeUrl} aspectRatio="16/9" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
