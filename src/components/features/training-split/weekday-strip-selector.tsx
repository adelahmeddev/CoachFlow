"use client"

import React from "react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { cn } from "@/lib/utils"
import { WEEKDAY_CYCLE } from "@/lib/calculations/week-schedule"
import type { Weekday } from "@/lib/db/enums"

interface WeekdayStripSelectorProps {
  value: Weekday | null | undefined
  allAssigned: { index: number; weekday: Weekday | null | undefined }[]
  currentIndex: number
  disabled?: boolean
  onChange: (weekday: Weekday) => void
  onSwap?: (fromIndex: number, toIndex: number) => void
}

export function WeekdayStripSelector({
  value,
  allAssigned,
  currentIndex,
  disabled,
  onChange,
  onSwap,
}: WeekdayStripSelectorProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  // Map of weekday to which other day index owns it
  const claimedMap = new Map<Weekday, number>()
  for (const item of allAssigned) {
    if (item.weekday && item.index !== currentIndex) {
      claimedMap.set(item.weekday, item.index)
    }
  }

  function handleClick(weekday: Weekday) {
    if (disabled) return
    const claimedBy = claimedMap.get(weekday)
    if (claimedBy !== undefined && onSwap) {
      // Swapping with the other day
      onSwap(currentIndex, claimedBy)
    } else {
      onChange(weekday)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground/80">
          {t.trainingSplit.weekday}
        </label>
        {value && (
          <span className="text-xs font-medium text-brand-400">
            {lookup(t, `trainingSplit.weekdays.${value}`)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {WEEKDAY_CYCLE.map((weekday) => {
          const isCurrent = value === weekday
          const claimedBy = claimedMap.get(weekday)
          const isClaimedByOther = claimedBy !== undefined
          const dayLabel = lookup(t, `trainingSplit.weekdays.${weekday}`)

          // Short label (first 3 chars or localized)
          const shortLabel = isAr
            ? dayLabel.slice(0, 3)
            : weekday

          return (
            <button
              key={weekday}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(weekday)}
              title={
                isClaimedByOther
                  ? `${dayLabel} (Used by Day ${claimedBy + 1} - click to swap)`
                  : dayLabel
              }
              className={cn(
                "relative flex-1 min-w-9 h-8.5 rounded-xl text-xs font-semibold transition-all duration-200",
                "flex flex-col items-center justify-center border",
                isCurrent &&
                  "border-brand-400/80 bg-brand-500 text-white shadow-glow ring-1 ring-brand-400/50 scale-[1.03] z-10",
                !isCurrent &&
                  isClaimedByOther &&
                  "border-white/10 bg-white/[0.03] text-muted-foreground/60 hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-300",
                !isCurrent &&
                  !isClaimedByOther &&
                  "border-white/15 bg-white/[0.05] text-foreground/85 hover:border-white/30 hover:bg-white/[0.10] active:scale-95"
              )}
            >
              <span>{shortLabel}</span>
              {isClaimedByOther && !isCurrent && (
                <span className="absolute -bottom-0.5 size-1 rounded-full bg-amber-400/70" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
