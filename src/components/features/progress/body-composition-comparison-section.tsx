import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { BodyComposition } from "@/lib/db/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

type ComparisonField = { key: string; label: string; unit: string }

const COMPARISON_FIELDS: ComparisonField[] = [
  { key: "weightKg", label: "Weight", unit: "kg" },
  { key: "bodyFatKg", label: "Body Fat", unit: "kg" },
  { key: "muscleMassKg", label: "Muscle Mass", unit: "kg" },
  { key: "bodyWaterPct", label: "Body Water", unit: "%" },
  { key: "bmrKcal", label: "BMR", unit: "kcal" },
  { key: "fitnessScore", label: "Fitness Score", unit: "" },
  { key: "waistHipRatio", label: "Waist-Hip Ratio", unit: "" },
  { key: "visceralFatLevel", label: "Visceral Fat", unit: "" },
  { key: "fatControlKg", label: "Fat Control", unit: "kg" },
]

interface BodyCompositionComparisonSectionProps {
  baseline: BodyComposition | null
  latest: BodyComposition | null
  hasMultiple: boolean
}

function calculateBodyCompositionComparison(
  latest: Record<string, unknown>,
  baseline: BodyComposition,
  fields: ComparisonField[]
) {
  return fields.map((f) => {
    const currentValue = latest[f.key] as number | null | undefined
    const previousValue = (baseline as unknown as Record<string, unknown>)[f.key] as number | null | undefined
    const curr = currentValue ?? null
    const prev = previousValue ?? null
    let difference: number | null = null
    if (typeof curr === "number" && typeof prev === "number") {
      difference = +(curr - prev).toFixed(2)
      // remove trailing zeros for display? keep numeric
      if (Number.isInteger(difference)) difference = Math.round(difference)
    }
    return {
      field: f.key,
      label: f.label,
      unit: f.unit,
      currentValue: curr,
      previousValue: prev,
      difference,
    }
  })
}

function formatValue(
  value: number | string | null,
  unit?: string
): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "number") {
    return `${value}${unit ? ` ${unit}` : ""}`
  }
  return String(value)
}

function DeltaBadge({ difference }: { difference: number | null }) {
  if (difference === null) {
    return <span className="text-muted-foreground">—</span>
  }
  const Icon =
    difference > 0 ? ArrowUpRight : difference < 0 ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5",
        difference > 0
          ? "text-destructive"
          : difference < 0
            ? "text-emerald-600"
            : "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {difference > 0 ? "+" : ""}
      {difference}
    </span>
  )
}

export function BodyCompositionComparisonSection({
  baseline,
  latest,
  hasMultiple,
}: BodyCompositionComparisonSectionProps) {
  if (!hasMultiple || !latest || !baseline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Baseline vs Latest</CardTitle>
          <CardDescription>InBody comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Only one InBody record exists. Create another InBody to see
            comparison.
          </p>
        </CardContent>
      </Card>
    )
  }

  const deltas = calculateBodyCompositionComparison(
    latest as unknown as Record<string, unknown>,
    baseline,
    COMPARISON_FIELDS
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Baseline vs Latest</CardTitle>
        <CardDescription>
          Comparing {formatDate((baseline as unknown as { date: Date }).date)} vs{" "}
          {formatDate((latest as unknown as { date: Date }).date)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>Latest</TableHead>
                <TableHead>Delta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deltas.map((delta) => (
                <TableRow key={delta.field}>
                  <TableCell className="font-medium">{delta.label}</TableCell>
                  <TableCell>
                    {formatValue(delta.previousValue, delta.unit)}
                  </TableCell>
                  <TableCell>
                    {formatValue(delta.currentValue, delta.unit)}
                  </TableCell>
                  <TableCell>
                    <DeltaBadge difference={delta.difference} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
