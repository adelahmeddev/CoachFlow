"use client"

import { cn } from "@/lib/utils"

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "glutes"
  | "core"
  | "cardio"

const muscleConfig: Record<MuscleGroup, { label: string; arLabel: string; emoji: string; color: string }> = {
  chest: { label: "Chest", arLabel: "صدر", emoji: "💪", color: "bg-muscle-500 text-white" },
  back: { label: "Back", arLabel: "ظهر", emoji: "🦾", color: "bg-brand-600 text-white" },
  shoulders: { label: "Shoulders", arLabel: "كتف", emoji: "🏋️", color: "bg-energy-600 text-white" },
  arms: { label: "Arms", arLabel: "دراع", emoji: "💪", color: "bg-muscle-400 text-white" },
  legs: { label: "Legs", arLabel: "رجلين", emoji: "🦵", color: "bg-performance-600 text-white" },
  glutes: { label: "Glutes", arLabel: "جلوتس", emoji: "🍑", color: "bg-performance-500 text-white" },
  core: { label: "Core", arLabel: "بطن", emoji: "🔥", color: "bg-energy-500 text-white" },
  cardio: { label: "Cardio", arLabel: "كارديو", emoji: "❤️", color: "bg-sky-500 text-white" },
}

// Focus string from DB -> muscle groups
const focusToMuscle: Record<string, MuscleGroup[]> = {
  CHEST: ["chest"],
  BACK: ["back"],
  SHOULDERS: ["shoulders"],
  ARMS: ["arms"],
  LEGS: ["legs"],
  GLUTES: ["glutes"],
  CORE: ["core"],
  CARDIO: ["cardio"],
  PUSH: ["chest", "shoulders", "arms"],
  PULL: ["back", "arms"],
  UPPER: ["chest", "back", "shoulders", "arms"],
  LOWER: ["legs", "glutes", "core"],
  FULL_BODY: ["chest", "back", "legs", "core"],
  SHOULDERS_ARMS: ["shoulders", "arms"],
}

export function getMuscleGroupsForFocus(focus: string): MuscleGroup[] {
  return focusToMuscle[focus] ?? []
}

interface MuscleBadgeProps {
  muscle: MuscleGroup
  size?: "sm" | "md"
  showLabel?: boolean
  locale?: string
  className?: string
}

export function MuscleBadge({
  muscle,
  size = "sm",
  showLabel = true,
  locale,
  className,
}: MuscleBadgeProps) {
  const cfg = muscleConfig[muscle]
  const isAr = locale === "ar"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-black/5",
        cfg.color,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <span aria-hidden="true" className="text-[11px]">
        {cfg.emoji}
      </span>
      {showLabel && <span>{isAr ? cfg.arLabel : cfg.label}</span>}
    </span>
  )
}

interface MuscleGroupRowProps {
  muscles: MuscleGroup[]
  locale?: string
  size?: "sm" | "md"
  maxVisible?: number
  className?: string
}

export function MuscleGroupRow({
  muscles,
  locale,
  size = "sm",
  maxVisible = 3,
  className,
}: MuscleGroupRowProps) {
  if (muscles.length === 0) return null
  const visible = muscles.slice(0, maxVisible)
  const extra = muscles.length - visible.length
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {visible.map((m) => (
        <MuscleBadge key={m} muscle={m} size={size} locale={locale} />
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          +{extra}
        </span>
      )}
    </span>
  )
}

export function FocusMuscleBadges({
  focus,
  customFocus,
  locale,
  size = "sm",
  className,
}: {
  focus: string
  customFocus?: string | null
  locale?: string
  size?: "sm" | "md"
  className?: string
}) {
  if (focus === "CUSTOM") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-border",
          className
        )}
      >
        {customFocus || (locale === "ar" ? "مخصص" : "Custom")}
      </span>
    )
  }
  if (focus === "REST") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
          className
        )}
      >
        <span aria-hidden="true">😴</span>
        {locale === "ar" ? "راحة" : "Rest"}
      </span>
    )
  }
  const muscles = getMuscleGroupsForFocus(focus)
  if (muscles.length === 0) {
    return (
      <span className={cn("inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px]", className)}>
        {focus}
      </span>
    )
  }
  return <MuscleGroupRow muscles={muscles} locale={locale} size={size} className={className} />
}
