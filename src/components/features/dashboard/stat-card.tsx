import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  /** Change vs previous 30-day window. Positive = up, negative = down, undefined = no data */
  delta?: number
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

export function StatCard({ label, value, icon: Icon, delta }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border bg-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent opacity-60"
        aria-hidden="true"
      />
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft ring-1 ring-brand-600/20 dark:from-brand-500 dark:to-brand-600">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-[13px] font-medium leading-none text-muted-foreground">
            {label}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[26px] font-semibold leading-none tracking-tight tabular-nums">
              {value}
            </p>
            {delta !== undefined && <DeltaBadge delta={delta} />}
          </div>
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
