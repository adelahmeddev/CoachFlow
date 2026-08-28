import { CheckCircle2, TrendingUp, TriangleAlert } from "lucide-react"
import { getI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface TargetRow {
  exerciseName: string
  targetSets: number | null
  targetReps: number | null
  targetWeightKg: number | null
  actualSets: number | null
  actualReps: number | null
  actualWeightKg: number | null
  achieved: boolean
  advice: { type: "increase" | "deload" | "none" }
}

interface LastSessionTargetsTableProps {
  rows: TargetRow[]
}

export async function LastSessionTargetsTable({
  rows,
}: LastSessionTargetsTableProps) {
  const { t } = await getI18n()

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t.progress.noSessionLogs}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.progress.exercise}</TableHead>
            <TableHead>{t.progress.target}</TableHead>
            <TableHead>{t.progress.actual}</TableHead>
            <TableHead>{t.progress.achieved}</TableHead>
            <TableHead>{t.progress.suggestion}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.exerciseName}-${index}`}>
              <TableCell className="font-medium">{row.exerciseName}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.targetSets != null ? (
                  <span dir="ltr">
                    {`${row.targetSets}×${row.targetReps ?? "—"}${row.targetWeightKg != null ? ` @${row.targetWeightKg}kg` : ""}`}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {row.actualSets != null || row.actualWeightKg != null ? (
                  <span dir="ltr">
                    {`${row.actualSets ?? "—"}×${row.actualReps ?? "—"}${row.actualWeightKg != null ? ` @${row.actualWeightKg}kg` : ""}`}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {row.achieved ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    {t.progress.achieved}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{t.progress.notAchieved}</Badge>
                )}
              </TableCell>
              <TableCell>
                {row.advice.type === "increase" ? (
                  <Badge variant="default" className="gap-1 bg-emerald-600 dark:bg-emerald-500">
                    <TrendingUp className="size-3" />
                    {t.progress.increaseLoad}
                  </Badge>
                ) : row.advice.type === "deload" ? (
                  <Badge variant="secondary" className="gap-1 text-amber-600">
                    <TriangleAlert className="size-3" />
                    {t.progress.deload}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
