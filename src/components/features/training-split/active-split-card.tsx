import Link from "next/link"
import { Pencil } from "lucide-react"
import type { TrainingSplit, TrainingSplitDay } from "@/lib/db/types"
import { ScheduleMode } from "@/lib/db/enums"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getI18n } from "@/lib/i18n"
import { lookup } from "@/lib/i18n/lookup"
import { getPlanStatusBadgeVariant, getPlanStatusLabel, SPLIT_TYPE_LABELS, DAY_FOCUS_LABELS } from "@/lib/constants"
import { TrainingSplitStatusButtons } from "@/components/features/training-split/training-split-status-buttons"

interface ActiveSplitCardProps {
  split: TrainingSplit & { days: TrainingSplitDay[] }
  clientId: string
}

export async function ActiveSplitCard({ split, clientId }: ActiveSplitCardProps) {
  const { t } = await getI18n()
  const isFixed = split.scheduleMode !== ScheduleMode.SEQUENTIAL

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{SPLIT_TYPE_LABELS[split.splitType]}</CardTitle>
          <Badge variant={getPlanStatusBadgeVariant(split.status)}>
            {getPlanStatusLabel(split.status)}
          </Badge>
          <Badge variant="secondary">
            {isFixed
              ? t.trainingSplit.scheduleModeFixed
              : t.trainingSplit.scheduleModeSequential}
          </Badge>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" size="sm">
            <Link href={`/clients/${clientId}/training-split/${split.id}/edit`}>
              <Pencil className="size-3.5" />
              Edit
            </Link>
          </Button>
          <TrainingSplitStatusButtons
            clientId={clientId}
            splitId={split.id}
            currentStatus={split.status}
            className="flex items-center gap-2"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Days per week</dt>
            <dd className="font-medium">{split.daysPerWeek}</dd>
          </div>
        </dl>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {split.days.map((day) => (
            <div
              key={day.id}
              className="rounded-lg border p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">Day {day.dayNumber}</p>
                {isFixed && day.weekday ? (
                  <Badge variant="outline" className="px-1.5 text-[10px]">
                    {lookup(t, `trainingSplit.weekdays.${day.weekday}`)}
                  </Badge>
                ) : null}
                {!isFixed ? (
                  <Badge variant="outline" className="px-1.5 text-[10px]">
                    {lookup(t, "trainingSplit.stepLabel")} {day.dayNumber}
                  </Badge>
                ) : null}
              </div>
              <p className="font-medium">
                {day.focus === "CUSTOM"
                  ? day.customFocus || "Custom"
                  : DAY_FOCUS_LABELS[day.focus]}
              </p>
              {day.notes ? (
                <p className="mt-1 text-xs text-muted-foreground">{day.notes}</p>
              ) : null}
            </div>
          ))}
        </div>

        {split.notes ? (
          <p className="text-sm text-muted-foreground">{split.notes}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
