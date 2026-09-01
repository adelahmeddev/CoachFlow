import { ArrowDownRight, ArrowUpRight, Minus, Scale, TrendingDown, TrendingUp, CalendarCheck2, Target } from "lucide-react"
import type { BodyComposition, ProgressReview } from "@/lib/db/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ProgressRing } from "@/components/ui/progress-ring"

type BodyCompositionLike = BodyComposition & Record<string, unknown>

interface ProgressSummaryCardsProps {
  baseline: BodyComposition | null
  latest: BodyComposition | null
  reviews: ProgressReview[]
}

function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return "—"
  return value.toFixed(digits)
}

function nextReAssessmentDate(
  _baseline: BodyComposition | null,
  _latest: BodyComposition | null,
  reviews: ProgressReview[]
): Date | null {
  const fromReviews = reviews
    .map((r) => r.nextAssessmentDate)
    .filter((d): d is Date => Boolean(d))
  if (fromReviews.length === 0) return null
  return fromReviews.reduce((soonest, d) => (d < soonest ? d : soonest))
}

export function ProgressSummaryCards({
  baseline,
  latest,
  reviews,
}: ProgressSummaryCardsProps) {
  const currentWeight = latest?.weightKg ?? null
  const baselineWeight = baseline?.weightKg ?? null
  const weightChange =
    currentWeight !== null && baselineWeight !== null
      ? currentWeight - baselineWeight
      : null

  const latestReview = reviews[0] ?? null
  const nextReAssessment = nextReAssessmentDate(baseline, latest, reviews)
  const adherence = latestReview?.adherencePct ?? null

  const cards = [
    {
      label: "الوزن الحالي",
      enLabel: "Current Weight",
      value: currentWeight !== null ? `${formatNumber(currentWeight)} kg` : "—",
      icon: Scale,
      variant: "brand" as const,
      sub: baselineWeight !== null ? `بدأ من ${formatNumber(baselineWeight)} kg` : "بداية الرحلة",
    },
    {
      label: "تغيّر الوزن",
      enLabel: "Weight Change",
      value: weightChange === null ? "—" : `${weightChange > 0 ? "+" : ""}${formatNumber(weightChange)} kg`,
      icon: weightChange !== null ? (weightChange > 0 ? TrendingUp : weightChange < 0 ? TrendingDown : Minus) : Scale,
      variant: weightChange !== null ? (weightChange < 0 ? "performance" as const : weightChange > 0 ? "muscle" as const : "brand" as const) : "brand" as const,
      sub: weightChange !== null ? (weightChange < 0 ? "نزول ممتاز 🔥" : weightChange > 0 ? "زيادة" : "ثابت") : "—",
      isDelta: true,
      weightChange,
    },
    {
      label: "الالتزام",
      enLabel: "Adherence",
      value: adherence !== null ? `${formatNumber(adherence, 0)}%` : "—",
      icon: Target,
      variant: "performance" as const,
      sub: adherence !== null ? (adherence >= 80 ? "ممتاز" : adherence >= 60 ? "كويس" : "شد حيلك") : "—",
      showRing: adherence !== null,
      ringValue: adherence ?? 0,
    },
    {
      label: "المتابعة الجاية",
      enLabel: "Next Check-in",
      value: nextReAssessment ? formatDate(nextReAssessment) : "—",
      icon: CalendarCheck2,
      variant: "energy" as const,
      sub: nextReAssessment ? "جهز المتابعة" : "حدد ميعاد",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-px opacity-60",
              c.variant === "brand" && "bg-gradient-to-r from-transparent via-brand-500/20 to-transparent",
              c.variant === "performance" && "bg-gradient-to-r from-transparent via-performance-500/20 to-transparent",
              c.variant === "muscle" && "bg-gradient-to-r from-transparent via-muscle-500/20 to-transparent",
              c.variant === "energy" && "bg-gradient-to-r from-transparent via-energy-500/20 to-transparent"
            )}
            aria-hidden="true"
          />
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-soft ring-1",
                c.variant === "brand" && "bg-gradient-to-br from-brand-500 to-brand-600 ring-brand-500/20",
                c.variant === "performance" && "bg-gradient-to-br from-performance-500 to-performance-600 ring-performance-500/20",
                c.variant === "muscle" && "bg-gradient-to-br from-muscle-500 to-brand-500 ring-muscle-500/20",
                c.variant === "energy" && "bg-gradient-to-br from-energy-500 to-brand-500 ring-energy-500/20"
              )}
            >
              <c.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{c.label}</p>
              <p className="text-xs text-muted-foreground/70">{c.enLabel}</p>
            </div>
            {c.showRing && c.ringValue !== undefined && (
              <ProgressRing value={c.ringValue} size={44} strokeWidth={4} variant={c.variant} showValue={false} className="shrink-0" />
            )}
          </div>
          <div className="mt-3">
            {c.isDelta && c.weightChange !== null && c.weightChange !== undefined ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xl font-extrabold tabular-nums",
                  c.weightChange > 0 ? "text-muscle-600" : c.weightChange < 0 ? "text-performance-600" : ""
                )}
              >
                {c.weightChange > 0 ? <ArrowUpRight className="size-5" /> : c.weightChange < 0 ? <ArrowDownRight className="size-5" /> : <Minus className="size-5" />}
                {c.value}
              </span>
            ) : (
              <p className="text-xl font-extrabold leading-none tracking-tight tabular-nums">
                {c.showRing ? (
                  <span className="inline-flex items-baseline gap-1">
                    {c.value}
                    {c.ringValue !== undefined && c.ringValue !== null && (
                      <span className="text-xs font-medium text-muted-foreground">/ 100</span>
                    )}
                  </span>
                ) : (
                  c.value
                )}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
