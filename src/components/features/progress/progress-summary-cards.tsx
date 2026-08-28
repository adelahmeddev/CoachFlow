import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { BodyComposition, ProgressReview } from "@/generated/prisma/client"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

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
  // BodyComposition has no nextReassessmentDate; use reviews only (keep PENDING_ASSESSMENT workflow)
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Current Weight</CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {currentWeight !== null ? `${formatNumber(currentWeight)} kg` : "—"}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Weight Change</CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {weightChange === null ? (
              "—"
            ) : (
              <span
                className={cn(
                  "flex items-center gap-1",
                  weightChange > 0
                    ? "text-destructive"
                    : weightChange < 0
                      ? "text-emerald-600"
                      : undefined
                )}
              >
                {weightChange > 0 ? (
                  <ArrowUpRight className="size-5" />
                ) : weightChange < 0 ? (
                  <ArrowDownRight className="size-5" />
                ) : (
                  <Minus className="size-5" />
                )}
                {weightChange > 0 ? "+" : ""}
                {formatNumber(weightChange)} kg
              </span>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Latest Adherence</CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {latestReview?.adherencePct !== null &&
            latestReview?.adherencePct !== undefined
              ? `${formatNumber(latestReview.adherencePct, 0)}%`
              : "—"}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Next Re-Assessment</CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {nextReAssessment ? (
              <span className="text-lg">{formatDate(nextReAssessment)}</span>
            ) : (
              "—"
            )}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
