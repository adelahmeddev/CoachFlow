"use client"

import * as React from "react"
import { Check, Dumbbell, Flame, HeartPulse, ShieldCheck, TrendingUp, Zap } from "lucide-react"
import type { Goal } from "@/lib/db/enums"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

export interface MultiGoalPickerProps {
  value?: Goal[]
  onChange: (value: Goal[]) => void
  disabled?: boolean
  error?: string
  className?: string
}

interface GoalOptionMeta {
  value: Goal
  icon: React.ComponentType<{ className?: string }>
  titleAr: string
  titleEn: string
  descAr: string
  descEn: string
}

export const GOAL_OPTIONS: GoalOptionMeta[] = [
  {
    value: "WEIGHT_LOSS",
    icon: Flame,
    titleAr: "إنقاص الوزن",
    titleEn: "Weight Loss",
    descAr: "حرق الدهون والتنشيف",
    descEn: "Fat loss & calorie burning",
  },
  {
    value: "MUSCLE_BUILDING",
    icon: Dumbbell,
    titleAr: "بناء العضلات",
    titleEn: "Muscle Building",
    descAr: "زيادة الحجم والكتلة العضلية",
    descEn: "Hypertrophy & muscle growth",
  },
  {
    value: "STRENGTH",
    icon: Zap,
    titleAr: "زيادة القوة",
    titleEn: "Strength",
    descAr: "رفع أوزان أعلى وأداء بدني أقوى",
    descEn: "Powerlifting & peak power",
  },
  {
    value: "GENERAL_FITNESS",
    icon: HeartPulse,
    titleAr: "لياقة عامة وصحة",
    titleEn: "General Fitness",
    descAr: "تحسين النفس والنشاط اليومي",
    descEn: "Stamina, cardio & wellness",
  },
  {
    value: "WEIGHT_GAIN",
    icon: TrendingUp,
    titleAr: "زيادة الوزن",
    titleEn: "Weight Gain",
    descAr: "زيادة صحية للوزن والضخامة",
    descEn: "Healthy mass & bulking",
  },
  {
    value: "REHAB",
    icon: ShieldCheck,
    titleAr: "تأهيل واستشفاء",
    titleEn: "Rehab & Recovery",
    descAr: "تقوية المفاصل والتعافي من الإصابات",
    descEn: "Joint health & injury recovery",
  },
]

export function MultiGoalPicker({
  value = [],
  onChange,
  disabled = false,
  error,
  className,
}: MultiGoalPickerProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const selectedList = Array.isArray(value) ? value : []

  const toggleGoal = (goal: Goal) => {
    if (disabled) return
    const next = selectedList.includes(goal)
      ? selectedList.filter((g) => g !== goal)
      : [...selectedList, goal]
    onChange(next)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {GOAL_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const isSelected = selectedList.includes(opt.value)

          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => toggleGoal(opt.value)}
              className={cn(
                "group relative flex items-start gap-2.5 rounded-xl border p-2.5 text-start transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-brand-500 bg-brand-500/[0.08] shadow-xs ring-1 ring-brand-500/30 dark:bg-brand-500/15"
                  : "border-border/70 bg-card/60 hover:border-brand-300/60 hover:bg-muted/40 dark:border-border/60 dark:hover:border-brand-700/50"
              )}
            >
              {/* Checkbox square indicator */}
              <span
                className={cn(
                  "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-md border transition-all duration-150",
                  isSelected
                    ? "border-brand-600 bg-brand-600 text-white shadow-xs dark:border-brand-500 dark:bg-brand-500"
                    : "border-muted-foreground/30 bg-background group-hover:border-muted-foreground/60"
                )}
              >
                {isSelected && <Check className="size-3 stroke-[3]" />}
              </span>

              {/* Icon */}
              <span
                className={cn(
                  "mt-0.5 flex size-6.5 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isSelected
                    ? "bg-brand-500/15 text-brand-600 dark:text-brand-300"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
              </span>

              {/* Text content */}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-xs font-semibold leading-tight transition-colors",
                    isSelected
                      ? "text-brand-900 dark:text-brand-100"
                      : "text-foreground"
                  )}
                >
                  {isAr ? opt.titleAr : opt.titleEn}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                  {isAr ? opt.descAr : opt.descEn}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive animate-shake">{error}</p>
      )}
    </div>
  )
}
