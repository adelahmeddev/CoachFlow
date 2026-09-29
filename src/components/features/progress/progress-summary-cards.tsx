import { ArrowDownRight, ArrowUpRight, Minus, Scale, TrendingDown, TrendingUp, CalendarCheck2, Target } from "lucide-react"
import type { BodyComposition, ProgressReview } from "@/lib/db/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ProgressRing } from "@/components/ui/progress-ring"
import { useI18n } from "@/lib/i18n/client"

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
  const { locale } = useI18n()
  const isAr = locale === "ar"
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
      label: isAr ? "الوزن الحالي" : "Current Weight",
      value: currentWeight !== null ? `${formatNumber(currentWeight)} kg` : "—",
      icon: Scale,
      variant: "brand" as const,
      sub: baselineWeight !== null ? (isAr ? `بدأ من ${formatNumber(baselineWeight)} kg` : `Started at ${formatNumber(baselineWeight)} kg`) : (isAr ? "بداية الرحلة" : "Journey start"),
    },
    {
      label: isAr ? "تغيّر الوزن" : "Weight Change",
      value: weightChange === null ? "—" : `${weightChange > 0 ? "+" : ""}${formatNumber(weightChange)} kg`,
      icon: weightChange !== null ? (weightChange > 0 ? TrendingUp : weightChange < 0 ? TrendingDown : Minus) : Scale,
      variant: weightChange !== null ? (weightChange < 0 ? "performance" as const : weightChange > 0 ? "muscle" as const : "brand" as const) : "brand" as const,
      sub: weightChange !== null ? (weightChange < 0 ? (isAr ? "نزول ممتاز" : "Great loss") : weightChange > 0 ? (isAr ? "زيادة" : "Increase") : (isAr ? "ثابت" : "Stable")) : "—",
      isDelta: true,
      weightChange,
    },
    {
      label: isAr ? "الالتزام" : "Adherence",
      value: adherence !== null ? `${formatNumber(adherence, 0)}%` : "—",
      icon: Target,
      variant: "performance" as const,
      sub: adherence !== null ? (adherence >= 80 ? (isAr ? "ممتاز" : "Excellent") : adherence >= 60 ? (isAr ? "كويس" : "Good") : (isAr ? "شد حيلك" : "Keep pushing")) : "—",
      showRing: adherence !== null,
      ringValue: adherence ?? 0,
    },
    {
      label: isAr ? "المتابعة الجاية" : "Next Check-in",
      value: nextReAssessment ? formatDate(nextReAssessment) : "—",
      icon: CalendarCheck2,
      variant: "energy" as const,
      sub: nextReAssessment ? (isAr ? "جهز المتابعة" : "Prepare review") : (isAr ? "حدد ميعاد" : "Schedule date"),
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
              <p className="text-[11px] font-bold uppercase tracking-widest break-words text-muted-foreground">{c.label}</p>
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
              <p className="text-xl font-extrabold leading-snug tracking-tight tabular-nums break-words">
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
            <p className="mt-1 text-xs break-words text-muted-foreground">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
