"use client"

import { TrendingDown, TrendingUp, Minus, Users, Clock3, CheckCircle2, CalendarClock } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

type StatIconName = "users" | "clock" | "check" | "calendar"

interface StatCardProps {
  label: string
  value: number
  iconName: StatIconName
  /** Change vs previous 30-day window. Positive = up, negative = down, undefined = no data */
  delta?: number
  variant?: "brand" | "energy" | "muscle" | "performance"
  sublabel?: string
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
        aria-label="لا يوجد تغيير"
      >
        <Minus className="size-3 shrink-0" aria-hidden="true" />
        <span>0</span>
      </span>
    )
  }
  const positive = delta > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        positive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20"
          : "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20"
      )}
      aria-label={positive ? `زيادة ${delta}` : `انخفاض ${Math.abs(delta)}`}
    >
      {positive ? (
        <TrendingUp className="size-3 shrink-0" aria-hidden="true" />
      ) : (
        <TrendingDown className="size-3 shrink-0" aria-hidden="true" />
      )}
      <span>
        {positive ? "+" : ""}
        {delta}
      </span>
    </span>
  )
}

const iconMap = {
  users: Users,
  clock: Clock3,
  check: CheckCircle2,
  calendar: CalendarClock,
} as const

export function StatCard({ label, value, iconName, delta, variant = "brand", sublabel }: StatCardProps) {
  const animated = useCountUp(value)
  const Icon = iconMap[iconName]
  const gradientMap = {
    brand: "from-brand-500 to-brand-600 ring-brand-600/20 dark:from-brand-500 dark:to-brand-600",
    energy: "from-energy-500 to-brand-500 ring-energy-500/20",
    muscle: "from-muscle-500 to-brand-500 ring-muscle-500/20",
    performance: "from-performance-500 to-performance-600 ring-performance-500/20",
  } as const

  const accentMap = {
    brand: "via-brand-500/30",
    energy: "via-energy-500/30",
    muscle: "via-muscle-500/30",
    performance: "via-performance-500/30",
  } as const

  const borderHoverMap = {
    brand: "hover:border-brand-200 dark:hover:border-brand-800/50 hover:shadow-glow",
    energy: "hover:border-energy-200 dark:hover:border-energy-800/50 hover:shadow-[0_0_24px_-4px_#F59E0B40]",
    muscle: "hover:border-muscle-200 dark:hover:border-muscle-800/50 hover:shadow-[0_0_24px_-4px_#EF444440]",
    performance: "hover:border-performance-200 dark:hover:border-performance-800/50 hover:shadow-[0_0_24px_-4px_#22C55E40]",
  } as const

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        borderHoverMap[variant]
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-60",
          accentMap[variant]
        )}
        aria-hidden="true"
      />
      {/* subtle texture */}
      <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br from-brand-500/5 to-energy-500/5 blur-xl" aria-hidden="true" />
      <CardContent className="relative flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-soft ring-1 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1",
            "bg-gradient-to-br",
            gradientMap[variant]
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[28px] font-extrabold leading-none tracking-tight tabular-nums animate-count-up">
              {animated}
            </p>
            {delta !== undefined && <DeltaBadge delta={delta} />}
          </div>
          {sublabel && (
            <p className="truncate text-xs text-muted-foreground leading-none">{sublabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="border bg-card shadow-soft">
      <CardContent className="flex items-center gap-4 p-5">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}
