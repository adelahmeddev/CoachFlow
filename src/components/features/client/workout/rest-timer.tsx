"use client"

import { Timer } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent } from "@/components/ui/card"

export function RestTimer({
  remainingSeconds,
  totalSeconds,
}: {
  remainingSeconds: number
  totalSeconds?: number
}) {
  const { t } = useI18n()
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const total = totalSeconds ?? remainingSeconds
  const progress = total > 0 ? Math.max(0, Math.min(1, remainingSeconds / total)) : 0
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <Card className="overflow-hidden rounded-2xl border bg-card shadow-soft animate-slide-soft">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="relative flex size-20 shrink-0 items-center justify-center">
          <svg width={96} height={96} className="-rotate-90">
            <circle cx={48} cy={48} r={radius} stroke="var(--border)" strokeWidth={6} fill="none" className="opacity-30" />
            <circle
              cx={48}
              cy={48}
              r={radius}
              stroke="var(--primary)"
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-linear"
              style={{ filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--primary) 30%, transparent))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Timer className="size-4 text-brand-600 dark:text-brand-400" />
            <span className="text-sm font-bold tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight">{lookup(t, "client.workout.restTimer")}</p>
          <p className="text-xs text-muted-foreground">Take a breath — next set is coming.</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
