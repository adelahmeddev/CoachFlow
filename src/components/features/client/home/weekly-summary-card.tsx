"use client"

import { CalendarCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type WeekEntry = {
  dayNumber: number | null
  focus: string
  customFocus: string | null
  status: string
  done: boolean
}

const STATUS_DOT_CLASSES: Record<string, string> = {
  DONE: "bg-emerald-500",
  TODAY: "bg-brand-600 ring-2 ring-brand-600/30 dark:bg-brand-500",
  CURRENT: "bg-brand-600 ring-2 ring-brand-600/30 dark:bg-brand-500",
  MISSED: "bg-red-400 dark:bg-red-500",
  UPCOMING: "bg-border",
  REST: "bg-transparent border border-dashed border-border",
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  DONE: "client.week.done",
  TODAY: "client.week.today",
  CURRENT: "client.week.currentTurn",
  MISSED: "client.week.missed",
  UPCOMING: "client.week.upcoming",
  REST: "client.week.rest",
}

export function WeeklySummaryCard({
  entries,
  planned,
  done,
}: {
  entries: WeekEntry[]
  planned: number
  done: number
}) {
  const { t } = useI18n()
  const pct =
    planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-brand-600 dark:text-brand-400" />
            <CardTitle>{lookup(t, "client.week.workoutsThisWeek")}</CardTitle>
          </div>
          <span className="text-xl font-semibold tabular-nums">
            {done}
            <span className="text-muted-foreground">/{planned}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-2" />
        {entries.length > 0 ? (
          <div className="flex items-center justify-between gap-1.5">
            {entries.map((entry, i) => (
              <span
                key={`${entry.dayNumber ?? "rest"}-${i}`}
                title={
                  entry.status === "REST" || entry.dayNumber == null
                    ? lookup(t, "client.week.restDay")
                    : `${lookup(t, "client.week.dayN").replace("{n}", String(entry.dayNumber))} · ${
                        entry.focus === "CUSTOM"
                          ? entry.customFocus ||
                            lookup(t, "trainingSplit.custom")
                          : entry.focus
                      } · ${lookup(t, STATUS_LABEL_KEYS[entry.status] ?? "client.week.upcoming")}`
                }
                className={cn(
                  "flex h-7 flex-1 items-center justify-center rounded-full text-[10px] font-medium",
                  STATUS_DOT_CLASSES[entry.status] ?? "bg-border"
                )}
              >
                {entry.dayNumber ?? ""}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
