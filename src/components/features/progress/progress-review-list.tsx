import type { ProgressReview } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/format"

interface ProgressReviewListProps {
  reviews: ProgressReview[]
}

function adherenceBadge(pct: number | null | undefined): {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
} {
  if (pct === null || pct === undefined) {
    return { label: "No adherence", variant: "outline" }
  }
  if (pct >= 80) return { label: `${pct}% adherence`, variant: "default" }
  if (pct >= 60) return { label: `${pct}% adherence`, variant: "secondary" }
  return { label: `${pct}% adherence`, variant: "destructive" }
}

export function ProgressReviewList({ reviews }: ProgressReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No progress reviews yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const adherence = adherenceBadge(review.adherencePct)
        return (
          <Card key={review.id}>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{formatDate(review.reviewDate)}</p>
                <Badge variant={adherence.variant}>{adherence.label}</Badge>
                {review.energyLevel !== null &&
                review.energyLevel !== undefined ? (
                  <Badge variant="outline">
                    Energy: {review.energyLevel}/10
                  </Badge>
                ) : null}
              </div>
              {review.nextAssessmentDate ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Next assessment: {formatDate(review.nextAssessmentDate)}
                </p>
              ) : null}
              {review.trainerNotes ? (
                <p className="mt-2 text-sm">{review.trainerNotes}</p>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
