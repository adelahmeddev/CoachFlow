"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Pencil, Video, Layers } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { YouTubePlayer } from "@/components/ui/youtube-player"
import {
  libraryExerciseSchema,
  type LibraryExerciseInput,
} from "@/lib/validations/exercise"
import {
  createExerciseAction,
  updateExerciseAction,
} from "@/server/actions/exercise-library"
import { useI18n } from "@/lib/i18n/client"
import { MUSCLE_GROUPS, SUB_MUSCLE_GROUPS } from "@/lib/constants"
import { getMuscleGroupLabel, getSubMuscleGroupLabel } from "@/lib/i18n/labels"
import type { LibraryExercise } from "@/server/services/exercise.service"

interface ExerciseFormDialogProps {
  exercise?: LibraryExercise
  trigger?: React.ReactNode
  onSuccess?: (exercise?: LibraryExercise) => void
  defaultMuscleGroup?: string
  defaultSubMuscleGroup?: string
  availableMuscleGroups?: string[]
  availableSubMuscles?: string[]
  overlayClassName?: string
  contentClassName?: string
}

export function ExerciseFormDialog({
  exercise,
  trigger,
  onSuccess,
  defaultMuscleGroup,
  defaultSubMuscleGroup,
  availableMuscleGroups,
  availableSubMuscles,
  overlayClassName,
  contentClassName,
}: ExerciseFormDialogProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const isEditing = Boolean(exercise)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LibraryExerciseInput>({
    resolver: zodResolver(libraryExerciseSchema),
    defaultValues: {
      name: exercise?.name ?? "",
      nameAr: exercise?.nameAr ?? "",
      muscleGroup: exercise?.muscleGroup ?? defaultMuscleGroup ?? "chest",
      subMuscleGroup: exercise?.subMuscleGroup ?? defaultSubMuscleGroup ?? "",
      youtubeUrl: exercise?.youtubeUrl ?? "",
    },
  })

  const currentYoutubeUrl = watch("youtubeUrl")
  const currentMuscleGroup = watch("muscleGroup") || "chest"
  const currentSubMuscle = watch("subMuscleGroup") || ""

  useEffect(() => {
    if (open) {
      reset({
        name: exercise?.name ?? "",
        nameAr: exercise?.nameAr ?? "",
        muscleGroup: exercise?.muscleGroup ?? defaultMuscleGroup ?? "chest",
        subMuscleGroup: exercise?.subMuscleGroup ?? defaultSubMuscleGroup ?? "",
        youtubeUrl: exercise?.youtubeUrl ?? "",
      })
    }
  }, [open, exercise, defaultMuscleGroup, defaultSubMuscleGroup, reset])

  const onSubmit = (data: LibraryExerciseInput) => {
    startTransition(async () => {
      try {
        let createdExercise: LibraryExercise | undefined
        if (isEditing && exercise) {
          const res = await updateExerciseAction(exercise.id, data)
          if (!res.ok) {
            if (res.error === "NAME_TAKEN") {
              toast.error(t.exerciseLibrary.toasts.nameTaken)
            } else {
              toast.error(res.error)
            }
            return
          }
          toast.success(t.exerciseLibrary.toasts.updated)
        } else {
          const res = await createExerciseAction(data)
          if (!res.ok) {
            if (res.error === "NAME_TAKEN") {
              toast.error(t.exerciseLibrary.toasts.nameTaken)
            } else {
              toast.error(res.error)
            }
            return
          }
          createdExercise = res.exercise
          toast.success(t.exerciseLibrary.toasts.created)
        }

        setOpen(false)
        reset()
        onSuccess?.(createdExercise)
      } catch (err) {
        toast.error("Operation failed")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ? (
          trigger
        ) : isEditing ? (
          <Button variant="ghost" size="icon-sm" className="size-8">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button className="gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-soft">
            <Plus className="size-4" />
            <span>{t.exerciseLibrary.addExercise}</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side={isAr ? "left" : "right"}
        overlayClassName={overlayClassName}
        className={cn(
          "w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col h-full bg-card shadow-2xl border-border/80",
          contentClassName
        )}
      >
        <SheetHeader className="p-6 pb-4 border-b border-border/40">
          <SheetTitle className="text-xl sm:text-2xl font-bold tracking-tight">
            {isEditing
              ? t.exerciseLibrary.editExercise
              : t.exerciseLibrary.addExercise}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {isEditing
              ? t.exerciseLibrary.editExercise
              : t.exerciseLibrary.addExercise}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Exercise Name EN */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                {t.exerciseLibrary.form.name}
              </Label>
              <Input
                id="name"
                dir="ltr"
                placeholder={t.exerciseLibrary.form.namePlaceholder}
                className="h-11 rounded-xl text-sm sm:text-base px-4 bg-muted/20 focus:bg-background transition-colors text-start"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs font-medium text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Muscle Group (Category) */}
            <div className="space-y-2">
              <Label
                htmlFor="muscleGroup"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Layers className="size-4 text-brand-500" />
                <span>{t.exerciseLibrary.form.muscleGroup}</span>
              </Label>
              <Select
                value={currentMuscleGroup}
                onValueChange={(val) =>
                  setValue("muscleGroup", val, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  id="muscleGroup"
                  className="h-11 rounded-xl text-sm sm:text-base px-4 bg-muted/20 focus:bg-background transition-colors"
                >
                  <SelectValue placeholder={t.exerciseLibrary.form.selectMuscleGroup} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set([...MUSCLE_GROUPS, ...(availableMuscleGroups || []), ...(currentMuscleGroup ? [currentMuscleGroup] : [])])).map((group) => (
                    <SelectItem key={group} value={group}>
                      {getMuscleGroupLabel(group, locale) || group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.muscleGroup && (
                <p className="text-xs font-medium text-destructive">
                  {errors.muscleGroup.message}
                </p>
              )}
            </div>

            {/* Sub-Muscle Division (if available for current muscle group) */}
            {(() => {
              const base = SUB_MUSCLE_GROUPS[currentMuscleGroup.toLowerCase()] || []
              const custom = availableSubMuscles || []
              const current = currentSubMuscle ? [currentSubMuscle] : []
              const set = new Set<string>()
              const allSubOptions: string[] = []
              for (const s of [...base, ...custom, ...current]) {
                const trimmed = s.trim()
                if (!trimmed) continue
                const lower = trimmed.toLowerCase()
                if (!set.has(lower)) {
                  set.add(lower)
                  allSubOptions.push(trimmed)
                }
              }

              if (allSubOptions.length === 0) return null

              return (
                <div className="space-y-2">
                  <Label
                    htmlFor="subMuscleGroup"
                    className="flex items-center gap-2 text-sm font-semibold"
                  >
                    <Layers className="size-4 text-brand-500/80" />
                    <span>
                      {t.exerciseLibrary.form.subMuscleGroup ||
                        (isAr ? "التقسيم العضلي الفرعي" : "Sub-muscle Division")}
                    </span>
                  </Label>
                  <Select
                    value={currentSubMuscle || "none"}
                    onValueChange={(val) =>
                      setValue("subMuscleGroup", val === "none" ? null : val, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      id="subMuscleGroup"
                      className="h-11 rounded-xl text-sm sm:text-base px-4 bg-muted/20 focus:bg-background transition-colors"
                    >
                      <SelectValue
                        placeholder={
                          t.exerciseLibrary.form.selectSubMuscleGroup ||
                          (isAr
                            ? "اختر العضلة الفرعية (اختياري)"
                            : "Select sub-muscle (optional)")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t.exerciseLibrary.form.noneSubMuscle ||
                          (isAr ? "عام / غير محدد" : "None / General")}
                      </SelectItem>
                      {allSubOptions.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {getSubMuscleGroupLabel(sub, locale) || sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })()}

            {/* YouTube Video URL */}
            <div className="space-y-2">
              <Label
                htmlFor="youtubeUrl"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Video className="size-4 text-rose-500" />
                <span>{t.exerciseLibrary.form.youtubeUrl}</span>
              </Label>
              <Input
                id="youtubeUrl"
                placeholder={t.exerciseLibrary.form.youtubeUrlPlaceholder}
                dir="ltr"
                className="h-11 rounded-xl text-sm sm:text-base px-4 bg-muted/20 focus:bg-background transition-colors"
                {...register("youtubeUrl")}
              />
              {errors.youtubeUrl && (
                <p className="text-xs font-medium text-destructive">
                  {errors.youtubeUrl.message}
                </p>
              )}
            </div>

            {/* Live YouTube Preview */}
            {currentYoutubeUrl && currentYoutubeUrl.trim() !== "" && (
              <div className="space-y-2 rounded-2xl border bg-muted/30 p-3.5">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Video className="size-3.5 text-rose-500" />
                  <span>{t.exerciseLibrary.form.videoPreview}</span>
                </p>
                <div className="overflow-hidden rounded-xl">
                  <YouTubePlayer url={currentYoutubeUrl} aspectRatio="16/9" />
                </div>
              </div>
            )}
          </div>

          {/* Fixed Drawer Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-border/40 bg-muted/15 flex items-center justify-end gap-3 mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-11 px-5 rounded-xl font-medium"
            >
              {t.exerciseLibrary.form.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 px-6 rounded-xl font-semibold gap-2 bg-gradient-to-r from-brand-600 to-brand-500 shadow-md hover:shadow-lg transition-all"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              <span>
                {isEditing
                  ? t.exerciseLibrary.form.save
                  : t.exerciseLibrary.form.create}
              </span>
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
