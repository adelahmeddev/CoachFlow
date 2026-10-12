"use client"

import { useState, useMemo, useTransition } from "react"
import {
  Plus,
  Search,
  Check,
  FolderPlus,
  Sparkles,
  Loader2,
  Dumbbell,
  ArrowRightLeft,
  X,
  Filter,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { getMuscleGroupLabel, getSubMuscleGroupLabel } from "@/lib/i18n/labels"
import { assignExercisesToSubMuscleAction } from "@/server/actions/exercise-library"
import { cn } from "@/lib/utils"
import type { LibraryExercise } from "@/server/services/exercise.service"

interface AddSubMuscleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  muscleGroup: string
  exercises: LibraryExercise[]
  existingSubMuscles?: string[]
  initialSubMuscleName?: string
  onSuccess: (newSubMuscleName: string) => void
}

export function AddSubMuscleDialog({
  open,
  onOpenChange,
  muscleGroup,
  exercises,
  existingSubMuscles = [],
  initialSubMuscleName = "",
  onSuccess,
}: AddSubMuscleDialogProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  const isMoveOnly = Boolean(initialSubMuscleName)
  const [subName, setSubName] = useState(initialSubMuscleName)
  const [searchQuery, setSearchQuery] = useState("")
  const [subFilter, setSubFilter] = useState<string>("ALL")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Reset state when opening/closing
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSubName(initialSubMuscleName)
      setSearchQuery("")
      setSubFilter("ALL")
      setSelectedIds(new Set())
    }
    onOpenChange(nextOpen)
  }

  // Filter exercises belonging to the current parent muscle group
  const parentExercises = useMemo(() => {
    const mKey = muscleGroup.toLowerCase()
    return exercises.filter(
      (ex) => (ex.muscleGroup || "").toLowerCase() === mKey
    )
  }, [exercises, muscleGroup])

  const availableSubMuscles = useMemo(() => {
    const set = new Set<string>()
    for (const ex of parentExercises) {
      if (ex.subMuscleGroup) set.add(ex.subMuscleGroup)
    }
    return Array.from(set)
  }, [parentExercises])

  const generalCount = useMemo(() => {
    return parentExercises.filter((ex) => !ex.subMuscleGroup).length
  }, [parentExercises])

  // Filtered exercises by sub-muscle and search query
  const filteredList = useMemo(() => {
    let list = parentExercises
    if (subFilter === "GENERAL") {
      list = list.filter((ex) => !ex.subMuscleGroup)
    } else if (subFilter !== "ALL") {
      list = list.filter(
        (ex) => (ex.subMuscleGroup || "").toLowerCase() === subFilter.toLowerCase()
      )
    }

    if (!searchQuery.trim()) return list
    const q = searchQuery.trim().toLowerCase()
    return list.filter((ex) => {
      const matchName = ex.name ? ex.name.toLowerCase().includes(q) : false
      const matchNameAr = ex.nameAr ? ex.nameAr.toLowerCase().includes(q) : false
      const matchSub = ex.subMuscleGroup ? ex.subMuscleGroup.toLowerCase().includes(q) : false
      return matchName || matchNameAr || matchSub
    })
  }, [parentExercises, subFilter, searchQuery])

  const toggleExercise = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredList.map((e) => e.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const muscleLabel = getMuscleGroupLabel(muscleGroup, locale) || muscleGroup

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = subName.trim()
    if (!trimmedName) {
      toast.error(isAr ? "يرجى كتابة اسم القسم الفرعي" : "Please enter a sub-muscle name")
      return
    }

    startTransition(async () => {
      try {
        const idsArray = Array.from(selectedIds)
        if (idsArray.length > 0) {
          const res = await assignExercisesToSubMuscleAction(
            idsArray,
            trimmedName,
            muscleGroup
          )
          if (!res.ok) {
            toast.error(res.error || (isAr ? "فشل نقل التمارين" : "Failed to assign exercises"))
            return
          }
        }

        toast.success(
          isMoveOnly
            ? (isAr
                ? `تم نقل ${selectedIds.size} تمرين إلى قسم ${trimmedName} بنجاح`
                : `Moved ${selectedIds.size} exercises to ${trimmedName}`)
            : (isAr
                ? `تمت إضافة قسم "${trimmedName}" ونقل ${selectedIds.size} تمرين بنجاح`
                : `Added "${trimmedName}" and moved ${selectedIds.size} exercises`)
        )

        onSuccess(trimmedName)
        handleOpenChange(false)
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : isAr
            ? "حدث خطأ غير متوقع"
            : "An unexpected error occurred"
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-4xl h-[88vh] max-h-[820px] min-h-[580px] p-0 gap-0 flex flex-col overflow-hidden rounded-3xl border border-border/80 shadow-2xl glass-modal">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 bg-card/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center shrink-0 shadow-sm">
              {isMoveOnly ? (
                <ArrowRightLeft className="size-5" />
              ) : (
                <FolderPlus className="size-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap">
                <span>
                  {isMoveOnly
                    ? (isAr
                        ? `نقل تمارين إلى قسم "${initialSubMuscleName}"`
                        : `Move Exercises to "${initialSubMuscleName}"`)
                    : (isAr
                        ? `إضافة قسم فرعي لمجموعة (${muscleLabel})`
                        : `Add Sub-Muscle for (${muscleLabel})`)}
                </span>
                <Badge variant="outline" className="text-[11px] font-mono border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  {parentExercises.length} {isAr ? "تمرين" : "exercises"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {isMoveOnly
                  ? (isAr
                      ? "حدد التمارين التي ترغب في نقلها إلى هذا القسم الفرعي مباشرة."
                      : "Select exercises from this muscle group to move into this sub-muscle division.")
                  : (isAr
                      ? "أدخل اسم العضلة الفرعية ثم حدد التمارين التي تريد نقلها إليها مباشرة."
                      : "Enter the sub-muscle name and pick which exercises to assign to it.")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 p-5 sm:p-6 gap-4 overflow-hidden">
          {/* Sub-Muscle Name Input */}
          {!isMoveOnly && (
            <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 sm:p-4 shrink-0 shadow-xs">
              <Label htmlFor="subMuscleName" className="text-xs font-bold flex items-center gap-1.5 mb-2">
                <Sparkles className="size-3.5 text-brand-500" />
                <span>{isAr ? "اسم العضلة أو القسم الفرعي الجديد" : "New Sub-Muscle Division Name"}</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subMuscleName"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: الكتف الأمامي، الترابيس السفلية، الصدر العلوي..."
                    : "e.g. Upper Anterior, Lower Traps, Upper Chest..."
                }
                autoFocus
                className="h-11 rounded-xl bg-background border-border/80 text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
              />
            </div>
          )}

          {/* Exercise Picker Section */}
          <div className="flex flex-col flex-1 min-h-0 border border-border/80 rounded-2xl overflow-hidden bg-card/30 shadow-xs">
            {/* Control Bar */}
            <div className="p-3 sm:p-3.5 border-b border-border/70 bg-card/70 flex flex-col gap-2.5 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isAr
                        ? `بحث في ${parentExercises.length} تمرين...`
                        : `Search across ${parentExercises.length} exercises...`
                    }
                    className="h-9 ps-9 pe-8 rounded-xl bg-background border-border/70 text-xs shadow-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted text-xs"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* Quick Selection Actions */}
                <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      className="h-8 px-2.5 text-xs font-semibold rounded-lg"
                    >
                      {isAr ? "تحديد الكل" : "Select All"}
                    </Button>
                    {selectedIds.size > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={deselectAll}
                        className="h-8 px-2.5 text-xs rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        {isAr ? "إلغاء التحديد" : "Deselect"}
                      </Button>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold tabular-nums">
                    <span>{selectedIds.size}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      / {filteredList.length} {isAr ? "محدد" : "selected"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Filter Chips */}
              {(availableSubMuscles.length > 0 || generalCount > 0) && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 shrink-0 me-1">
                    <Filter className="size-3" />
                    {isAr ? "تصفية:" : "Filter:"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSubFilter("ALL")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors",
                      subFilter === "ALL"
                        ? "bg-brand-500 text-white shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {isAr ? "الكل" : "All"} ({parentExercises.length})
                  </button>

                  {generalCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setSubFilter("GENERAL")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors",
                        subFilter === "GENERAL"
                          ? "bg-brand-500 text-white shadow-xs"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {isAr ? "عام (بدون قسم)" : "General"} ({generalCount})
                    </button>
                  )}

                  {availableSubMuscles.map((sub) => {
                    const label = getSubMuscleGroupLabel(sub, locale) || sub
                    const count = parentExercises.filter(
                      (e) => (e.subMuscleGroup || "").toLowerCase() === sub.toLowerCase()
                    ).length
                    const isActive = subFilter.toLowerCase() === sub.toLowerCase()

                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSubFilter(sub)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors",
                          isActive
                            ? "bg-brand-500 text-white shadow-xs"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {label} ({count})
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Exercise Cards 2-Column Grid Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
              {filteredList.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Dumbbell className="size-8 mx-auto text-muted-foreground/40" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {searchQuery
                      ? (isAr ? `لا توجد نتائج مطابقة لـ "${searchQuery}"` : `No exercises matching "${searchQuery}"`)
                      : (isAr ? "لا توجد تمارين في هذا التصنيف" : "No exercises in this category")}
                  </p>
                  {(searchQuery || subFilter !== "ALL") && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("")
                        setSubFilter("ALL")
                      }}
                      className="text-xs h-7 text-brand-600 dark:text-brand-400"
                    >
                      {isAr ? "إعادة ضبط التصفية" : "Reset Filter"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredList.map((exercise) => {
                    const isChecked = selectedIds.has(exercise.id)
                    const currentSub = exercise.subMuscleGroup
                      ? getSubMuscleGroupLabel(exercise.subMuscleGroup, locale) || exercise.subMuscleGroup
                      : isAr
                      ? "عام"
                      : "General"

                    return (
                      <div
                        key={exercise.id}
                        onClick={() => toggleExercise(exercise.id)}
                        className={cn(
                          "group flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-150",
                          isChecked
                            ? "border-brand-500/60 bg-brand-500/10 shadow-xs ring-1 ring-brand-500/30"
                            : "border-border/60 bg-background/60 hover:border-brand-500/40 hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Custom Checkbox */}
                          <div
                            className={cn(
                              "size-5 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                              isChecked
                                ? "bg-brand-600 border-brand-600 text-white shadow-soft"
                                : "border-border/80 bg-background group-hover:border-brand-500/50"
                            )}
                          >
                            {isChecked && <Check className="size-3.5 stroke-[3]" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p dir="ltr" className="text-xs font-bold truncate leading-snug text-foreground text-start">
                              {exercise.name}
                            </p>
                          </div>
                        </div>

                        {/* Current Sub-Muscle Tag */}
                        <span className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ms-2 max-w-[120px] truncate",
                          exercise.subMuscleGroup
                            ? "bg-muted/80 text-foreground/80 border-border/70"
                            : "bg-muted/40 text-muted-foreground border-border/40"
                        )}>
                          {currentSub}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 sm:p-5 border-t border-border/60 bg-card/60 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground order-2 sm:order-1 text-center sm:text-start">
              {selectedIds.size > 0 ? (
                <span className="font-semibold text-foreground">
                  {isAr
                    ? `سيتم نقل ${selectedIds.size} تمرين إلى القسم "${subName || "..."}"`
                    : `Will move ${selectedIds.size} exercise(s) to "${subName || "..."}"`}
                </span>
              ) : (
                <span>
                  {isAr
                    ? "يمكنك إنشاء القسم الآن ونقل التمارين إليه لاحقاً في أي وقت"
                    : "You can create the division now and assign exercises anytime"}
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 order-1 sm:order-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className="rounded-xl text-xs h-10 px-4"
              >
                {t.exerciseLibrary.form.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isPending || (!isMoveOnly && !subName.trim())}
                className="rounded-xl gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs shadow-soft h-10 px-5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{isAr ? "جاري الحفظ..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>
                      {isMoveOnly
                        ? (isAr ? `تأكيد نقل (${selectedIds.size})` : `Confirm Move (${selectedIds.size})`)
                        : (isAr ? "حفظ وإضافة القسم" : "Save & Add Division")}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
