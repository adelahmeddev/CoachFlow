"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  FolderPlus,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
} from "lucide-react"
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
import { getMuscleGroupLabel, getSubMuscleGroupLabel } from "@/lib/i18n/labels"
import { SUB_MUSCLE_GROUPS } from "@/lib/constants"
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
  selectedSubMuscle?: string
  customSubMuscles?: Record<string, string[]>
  onSelect: (group: string) => void
  onSelectSubMuscle?: (subMuscle: string) => void
  onAddSubMuscleClick?: (muscleGroup: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onAddGroup: (newGroupName: string) => void
  className?: string
}

export function MuscleSidebar({
  groups,
  exercises,
  selectedMuscle,
  selectedSubMuscle = "ALL",
  customSubMuscles,
  onSelect,
  onSelectSubMuscle,
  onAddSubMuscleClick,
  isCollapsed = false,
  onToggleCollapse,
  onAddGroup,
  className,
}: MuscleSidebarProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  // Quick lookup of exercise counts per group
  const countsByGroup = useMemo(() => {
    return exercises.reduce<Record<string, number>>((acc, ex) => {
      const key = (ex.muscleGroup || "").toLowerCase()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }, [exercises])

  // Exercise counts per sub-muscle for the selected group
  const subMuscleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (selectedMuscle === "ALL") return counts

    const inGroup = exercises.filter(
      (ex) => (ex.muscleGroup || "").toLowerCase() === selectedMuscle.toLowerCase()
    )

    for (const ex of inGroup) {
      if (ex.subMuscleGroup) {
        const k = ex.subMuscleGroup.toLowerCase()
        counts[k] = (counts[k] || 0) + 1
      }
    }

    return counts
  }, [exercises, selectedMuscle])

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
          "flex flex-col h-full min-h-0 bg-card/60 backdrop-blur-sm border-e border-border/80 select-none overflow-hidden transition-all duration-200",
          isCollapsed ? "w-16" : "w-64 xl:w-72",
          className
        )}
      >
        {/* Sidebar Header — Fixed Top */}
        <div className="p-3 border-b border-border/70 shrink-0 bg-card/40 flex items-center justify-between gap-2">
          {!isCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full bg-brand-500 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                {t.exerciseLibrary.filterMuscleGroup || (isAr ? "المجموعات العضلية" : "Muscle Groups")}
              </h3>
            </div>
          )}

          {/* Collapse/Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                "size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-center transition-colors shrink-0",
                isCollapsed && "mx-auto"
              )}
              title={
                isCollapsed
                  ? (isAr ? "توسيع الشريط الجانبي" : "Expand Sidebar")
                  : (isAr ? "طي الشريط الجانبي" : "Collapse Sidebar")
              }
            >
              {isCollapsed ? (
                <PanelLeft className="size-4 text-brand-500" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>
          )}
        </div>

        {/* Scrollable Muscle Tree List — Independent Scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1 focus:outline-none">
          {/* "All Exercises" Item */}
          <button
            type="button"
            onClick={() => {
              onSelect("ALL")
              onSelectSubMuscle?.("ALL")
            }}
            className={cn(
              "w-full flex items-center justify-between p-2 rounded-xl border text-start transition-all",
              selectedMuscle === "ALL"
                ? "bg-brand-500/10 border-brand-500/40 text-brand-600 dark:text-brand-400 font-bold shadow-soft ring-1 ring-brand-500/30"
                : "border-border/50 bg-card hover:bg-muted/50 hover:border-border text-foreground font-medium",
              isCollapsed && "justify-center p-2"
            )}
            title={t.exerciseLibrary.allExercises || (isAr ? "جميع التمارين" : "All Exercises")}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  selectedMuscle === "ALL" ? "bg-brand-500" : "bg-muted-foreground/30"
                )}
              />
              {!isCollapsed && (
                <span className="text-xs font-bold truncate">
                  {t.exerciseLibrary.allExercises || (isAr ? "جميع التمارين" : "All Exercises")}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums font-mono shrink-0",
                  selectedMuscle === "ALL"
                    ? "bg-brand-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {totalExercises}
              </span>
            )}
          </button>

          {/* Muscle Groups Tree */}
          {groups.map((group) => {
            const key = group.toLowerCase()
            const isSelected = selectedMuscle.toLowerCase() === key
            const count = countsByGroup[key] || 0
            const accent = MUSCLE_ACCENTS[key] || DEFAULT_ACCENT
            const label = getMuscleGroupLabel(group, locale) || group

            // Compute sub-muscles (Base + Exercises + Custom)
            const baseSubs = SUB_MUSCLE_GROUPS[key] || []
            const exerciseSubs = exercises
              .filter((ex) => (ex.muscleGroup || "").toLowerCase() === key)
              .map((ex) => (ex.subMuscleGroup || "").trim())
              .filter(Boolean)
            const customSubs = customSubMuscles?.[key] || []

            const seenSubs = new Set<string>()
            const subMuscles: string[] = []
            for (const s of [...baseSubs, ...exerciseSubs, ...customSubs]) {
              const lower = s.toLowerCase()
              if (!seenSubs.has(lower)) {
                seenSubs.add(lower)
                subMuscles.push(s)
              }
            }

            return (
              <div key={group} className="space-y-0.5">
                {/* Parent Muscle Item Button */}
                <button
                  type="button"
                  onClick={() => {
                    onSelect(group)
                    onSelectSubMuscle?.("ALL")
                  }}
                  className={cn(
                    "group relative w-full flex items-center justify-between p-2 rounded-xl border text-start transition-all",
                    isSelected
                      ? cn(
                          "bg-brand-500/10 border-brand-500/40 font-bold text-brand-600 dark:text-brand-400 shadow-soft ring-1 ring-brand-500/20"
                        )
                      : "border-border/40 bg-card/60 hover:bg-muted/50 hover:border-border text-foreground font-medium",
                    isCollapsed && "justify-center p-2"
                  )}
                  title={label}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "size-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110",
                        accent.dot
                      )}
                    />
                    {!isCollapsed && (
                      <span className="text-xs truncate">{label}</span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-md text-[11px] font-mono font-bold tabular-nums transition-colors",
                          isSelected
                            ? "bg-brand-500 text-white"
                            : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                        )}
                      >
                        {count}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-3 text-muted-foreground transition-transform",
                          isSelected ? "rotate-180 text-brand-500" : ""
                        )}
                      />
                    </div>
                  )}
                </button>

                {/* Sub-Muscle Tree Breakdown (Expanded under selected muscle) */}
                {isSelected && !isCollapsed && (
                  <div className="ms-3.5 ps-2.5 border-s-2 border-brand-500/40 my-1 space-y-0.5 py-0.5">
                    {/* "All divisions" item */}
                    <button
                      type="button"
                      onClick={() => onSelectSubMuscle?.("ALL")}
                      className={cn(
                        "w-full px-2 py-1.5 rounded-lg text-xs text-start transition-all flex items-center justify-between",
                        selectedSubMuscle === "ALL"
                          ? "bg-brand-500 text-white font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                      )}
                    >
                      <span>{isAr ? "• كل الأقسام" : "• All Divisions"}</span>
                      <span
                        className={cn(
                          "text-[10px] font-mono px-1.5 py-0.2 rounded font-bold",
                          selectedSubMuscle === "ALL"
                            ? "bg-white/20 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </button>

                    {/* Individual sub-division items */}
                    {subMuscles.map((sub) => {
                      const isSubActive =
                        selectedSubMuscle.toLowerCase() === sub.toLowerCase()
                      const sCount = subMuscleCounts[sub.toLowerCase()] || 0
                      const subLabel =
                        getSubMuscleGroupLabel(sub, locale) || sub

                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => onSelectSubMuscle?.(sub)}
                          className={cn(
                            "w-full px-2 py-1.5 rounded-lg text-xs text-start transition-all flex items-center justify-between",
                            isSubActive
                              ? "bg-brand-500 text-white font-bold shadow-xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                          )}
                        >
                          <span className="truncate">{subLabel}</span>
                          <span
                            className={cn(
                              "text-[10px] font-mono px-1.5 py-0.2 rounded font-bold tabular-nums shrink-0",
                              isSubActive
                                ? "bg-white/20 text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {sCount}
                          </span>
                        </button>
                      )
                    })}

                    {/* Add sub-division (+) button inside the tree */}
                    <button
                      type="button"
                      onClick={() => onAddSubMuscleClick?.(group)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs text-start transition-all flex items-center gap-1.5 text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/5 border border-dashed border-border/60 font-bold"
                      title={isAr ? "إضافة قسم فرعي جديد" : "Add new sub-muscle division"}
                    >
                      <Plus className="size-3" />
                      <span>{isAr ? "إضافة قسم فرعي" : "Add division"}</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Sidebar Footer — Add Muscle Group Button (Fixed Bottom) */}
        {!isCollapsed && (
          <div className="p-2.5 border-t border-border/70 shrink-0 bg-card/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="w-full gap-2 rounded-xl text-xs font-bold h-8.5 border-dashed border-border/80 hover:border-brand-500/50 hover:bg-brand-500/5 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-none"
            >
              <Plus className="size-3.5" />
              <span>
                {t.exerciseLibrary.addMuscleGroup || (isAr ? "إضافة مجموعة جديدة" : "Add Muscle Group")}
              </span>
            </Button>
          </div>
        )}
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
