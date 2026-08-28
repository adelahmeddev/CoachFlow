import { cn } from "@/lib/utils"
import { getI18n } from "@/lib/i18n"
import { lookup } from "@/lib/i18n/lookup"
import { getClientWeekBoard } from "@/server/services/week.service"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const STATUS_DOT_CLASSES: Record<string, string> = {
  DONE: "bg-emerald-500 text-white",
  MISSED: "bg-rose-500 text-white",
  TODAY: "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-soft dark:from-brand-500 dark:to-brand-600",
  CURRENT: "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-soft dark:from-brand-500 dark:to-brand-600",
  UPCOMING: "border bg-background text-muted-foreground",
  REST: "bg-muted text-muted-foreground",
}

export async function ClientWeekStatus({ clientId }: { clientId: string }) {
  const { t } = await getI18n()
  const data = await getClientWeekBoard(clientId)

  if (data.board.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          {t.trainingSplit.weekStatusTitle}
        </CardTitle>
        <span className="text-xs tabular-nums text-muted-foreground" dir="ltr">
          {data.summary.done} / {data.summary.planned}
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {data.board.map((entry) => (
            <span
              key={entry.key}
              title={`${entry.weekday ? lookup(t, `trainingSplit.weekdays.${entry.weekday}`) : entry.dateKey} — ${lookup(
                t,
                `client.week.${
                  entry.status === "CURRENT"
                    ? "currentTurn"
                    : entry.status.toLowerCase()
                }`
              )}`}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg px-1 text-[10px] font-medium",
                STATUS_DOT_CLASSES[entry.status] ?? ""
              )}
            >
              {entry.dayId
                ? entry.dayNumber
                : entry.extraWorkout
                  ? "✦"
                  : "–"}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
