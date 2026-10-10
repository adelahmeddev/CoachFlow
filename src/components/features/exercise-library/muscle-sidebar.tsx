"use client"

import { useState } from "react"
import { Layers, Plus, Check, FolderPlus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n/client"
import { getMuscleGroupLabel } from "@/lib/i18n/labels"
import { cn } from "@/lib/utils"
import type { LibraryExercise } from "@/server/services/exercise.service"

export const MUSCLE_ACCENTS: Record<
  string,
  { border: string; bg: string; text: string; dot: string }
> = {
  chest: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  back: {
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  shoulders: {
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    dot: "bg-fuchsia-500",
  },
  arms: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  legs: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  glutes: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  core: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  cardio: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
}

export const DEFAULT_ACCENT = {
  border: "border-border",
  bg: "bg-muted/50",
  text: "text-foreground",
  dot: "bg-brand-500",
}

interface MuscleSidebarProps {
  groups: string[]
  exercises: LibraryExercise[]
  selectedMuscle: string
  onSelect: (group: string) => void
  onAddGroup: (newGroupName: string) => void
  className?: string
}

export function MuscleSidebar({
  groups,
  exercises,
  selectedMuscle,
  onSelect,
  onAddGroup,
  className,
}: MuscleSidebarProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  // Quick lookup of exercise counts per group
  const countsByGroup = exercises.reduce<Record<string, number>>((acc, ex) => {
    const key = (ex.muscleGroup || "").toLowerCase()
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const totalExercises = exercises.length

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newGroupName.trim()
    if (!trimmed) return
    onAddGroup(trimmed)
    setNewGroupName("")
    setAddDialogOpen(false)
  }

  return (
    <>
      <aside
        className={cn(
          "flex flex-col h-full min-h-0 bg-card/60 backdrop-blur-sm border-e border-border/80 select-none overflow-hidden",
          className
        )}
      >
        {/* Sidebar Header — Fixed Top */}
        <div className="p-3.5 border-b border-border/70 space-y-2.5 shrink-0 bg-card/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-brand-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t.exerciseLibrary.filterMuscleGroup}
              </h3>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {groups.length}
            </span>
          </div>

          {/* "All Exercises" Card */}
          <button
            type="button"
            onClick={() => onSelect("ALL")}
            className={cn(
              "w-full flex items-center justify-between p-2.5 rounded-xl border text-start transition-all",
              selectedMuscle === "ALL"
                ? "bg-brand-500/10 border-brand-500/40 text-brand-600 dark:text-brand-400 shadow-soft font-bold ring-1 ring-brand-500/30"
                : "border-border/60 bg-card hover:bg-muted/50 hover:border-border text-foreground font-medium"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  selectedMuscle === "ALL" ? "bg-brand-500" : "bg-muted-foreground/30"
                )}
              />
              <span className="text-sm truncate">
                {t.exerciseLibrary.allExercises || (isAr ? "جميع التمارين" : "All Exercises")}
              </span>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold tabular-nums shrink-0",
                selectedMuscle === "ALL"
                  ? "bg-brand-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {totalExercises}
            </span>
          </button>
        </div>

        {/* Scrollable Muscle List — Independent Internal Scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1.5 focus:outline-none">
          {groups.map((group) => {
            const key = group.toLowerCase()
            const isSelected = selectedMuscle.toLowerCase() === key
            const count = countsByGroup[key] || 0
            const accent = MUSCLE_ACCENTS[key] || DEFAULT_ACCENT
            const label = getMuscleGroupLabel(group, locale) || group

            return (
              <button
                key={group}
                type="button"
                onClick={() => onSelect(group)}
                className={cn(
                  "group relative w-full flex items-center justify-between p-2.5 rounded-xl border text-start transition-all",
                  isSelected
                    ? cn(
                        "bg-card border-brand-500/50 shadow-soft ring-1 ring-brand-500/30 font-bold",
                        accent.text
                      )
                    : "border-border/50 bg-card/60 hover:bg-muted/50 hover:border-border text-foreground font-medium"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Color Accent Indicator Dot */}
                  <span
                    className={cn(
                      "size-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110",
                      accent.dot
                    )}
                  />
                  <span className="text-sm truncate">{label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold tabular-nums transition-colors",
                      isSelected
                        ? "bg-brand-500 text-white"
                        : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                    )}
                  >
                    {count}
                  </span>
                  {isSelected && (
                    <Check className="size-3.5 text-brand-500 shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Sidebar Footer — Add Muscle Group Button (Fixed Bottom) */}
        <div className="p-3 border-t border-border/70 shrink-0 bg-card/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="w-full gap-2 rounded-xl text-xs font-bold h-9 border-dashed border-border/80 hover:border-brand-500/50 hover:bg-brand-500/5 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-none"
          >
            <Plus className="size-3.5" />
            <span>
              {t.exerciseLibrary.addMuscleGroup || (isAr ? "إضافة مجموعة عضلية" : "Add Muscle Group")}
            </span>
          </Button>
        </div>
      </aside>

      {/* Add Muscle Group Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="size-5 text-brand-500" />
              <span>
                {t.exerciseLibrary.addMuscleGroupTitle ||
                  (isAr ? "إضافة مجموعة عضلية جديدة" : "Add New Muscle Group")}
              </span>
            </DialogTitle>
            <DialogDescription>
              {t.exerciseLibrary.addMuscleGroupDescription ||
                (isAr
                  ? "أدخل اسم المجموعة العضلية لتصنيف التمارين تحتها."
                  : "Enter the name of the new muscle category to organize your exercises.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGroup} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-sm font-semibold">
                {isAr ? "اسم المجموعة العضلية" : "Muscle Group Name"}
              </Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={
                  t.exerciseLibrary.muscleGroupNamePlaceholder ||
                  (isAr ? "مثال: الساعدين، السمانة" : "e.g. Forearms, Calves")
                }
                autoFocus
                className="h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="rounded-xl"
              >
                {t.exerciseLibrary.form.cancel}
              </Button>
              <Button
                type="submit"
                disabled={!newGroupName.trim()}
                className="rounded-xl gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold shadow-soft"
              >
                <Sparkles className="size-3.5" />
                <span>
                  {t.exerciseLibrary.addMuscleGroup ||
                    (isAr ? "إضافة المجموعة" : "Add Group")}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
