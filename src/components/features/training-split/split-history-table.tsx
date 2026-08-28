import Link from "next/link"
import type { TrainingSplit } from "@/generated/prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getPlanStatusBadgeVariant, getPlanStatusLabel } from "@/lib/client-labels"
import { SPLIT_TYPE_LABELS } from "@/lib/constants/training-split"
import { formatDate } from "@/lib/format"

interface SplitHistoryTableProps {
  splits: TrainingSplit[]
  clientId: string
}

export function SplitHistoryTable({
  splits,
  clientId,
}: SplitHistoryTableProps) {
  if (splits.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No training splits yet
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Split Type</TableHead>
              <TableHead>Days / Week</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {splits.map((split) => (
              <TableRow key={split.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(split.createdAt)}
                </TableCell>
                <TableCell className="font-medium">
                  {SPLIT_TYPE_LABELS[split.splitType]}
                </TableCell>
                <TableCell>{split.daysPerWeek}</TableCell>
                <TableCell>
                  <Badge variant={getPlanStatusBadgeVariant(split.status)}>
                    {getPlanStatusLabel(split.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/clients/${clientId}/training-split/${split.id}/edit`}
                    >
                      Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-3 md:hidden">
        {splits.map((split) => (
          <div key={split.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{SPLIT_TYPE_LABELS[split.splitType]}</p>
              <Badge variant={getPlanStatusBadgeVariant(split.status)}>{getPlanStatusLabel(split.status)}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {split.daysPerWeek} days / week • {formatDate(split.createdAt)}
            </p>
            <div className="mt-3 flex justify-end">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/clients/${clientId}/training-split/${split.id}/edit`}>Edit</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
