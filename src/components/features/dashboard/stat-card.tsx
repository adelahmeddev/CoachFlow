"use client"

import Link from "next/link"
import { TrendingDown, TrendingUp, Minus, Users, Clock3, CheckCircle2, CalendarClock, ArrowRight, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function useCountUp(target: number, duration = 900) {
  const safeTarget = typeof target === "number" && Number.isFinite(target) ? target : 0
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(safeTarget)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * safeTarget))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [safeTarget, duration])
  return Number.isFinite(value) ? value : 0
}

type StatIconName = "users" | "clock" | "check" | "calendar" | "alert"

interface StatCardProps {
  label: string
  value: number
  iconName: StatIconName
  /** Change vs previous 30-day window. Positive = up, negative = down, undefined = no data */
  delta?: number
  variant?: "brand" | "energy" | "muscle" | "performance"
  sublabel?: string
  href?: string
}

function DeltaBadge({ delta }: { delta: number }) {
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
        aria-label="لا يوجد تغيير"
      >
        <Minus className="size-2.5 shrink-0" aria-hidden="true" />
        <span>0</span>
      </span>
    )
  }
  const positive = delta > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-tight ring-1 ring-inset",
        positive
          ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:bg-rose-500/15 dark:text-rose-400"
      )}
      aria-label={positive ? `زيادة ${delta}` : `انخفاض ${Math.abs(delta)}`}
    >
      {positive ? (
        <TrendingUp className="size-2.5 shrink-0" aria-hidden="true" />
      ) : (
        <TrendingDown className="size-2.5 shrink-0" aria-hidden="true" />
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
  alert: AlertTriangle,
} as const

export function StatCard({ label, value, iconName, delta, variant = "brand", sublabel, href }: StatCardProps) {
  const safeValue = typeof value === "number" && Number.isFinite(value) ? value : 0
  const animated = useCountUp(safeValue)
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

  const cardContent = (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/90 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        href && "cursor-pointer",
        borderHoverMap[variant]
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent to-transparent opacity-80",
          accentMap[variant]
        )}
        aria-hidden="true"
      />
      {/* subtle texture */}
      <div className="pointer-events-none absolute -end-6 -top-6 size-24 rounded-full bg-gradient-to-br from-brand-500/5 to-energy-500/5 blur-xl" aria-hidden="true" />
      <CardContent className="relative flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5">
        <div
          className={cn(
            "flex size-12 sm:size-13 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1",
            "bg-gradient-to-br",
            gradientMap[variant]
          )}
        >
          <Icon className="size-5 sm:size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black leading-none tracking-tight tabular-nums animate-count-up text-foreground">
              {animated}
            </span>
            {delta !== undefined && <DeltaBadge delta={delta} />}
          </div>
          {sublabel && (
            <p className="mt-1 truncate text-[11px] sm:text-xs text-muted-foreground font-medium leading-tight">
              {sublabel}
            </p>
          )}
        </div>
        {href && (
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground/60 transition-all duration-200 group-hover:text-foreground group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} aria-label={label} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {cardContent}
      </Link>
    )
  }

  return cardContent
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
