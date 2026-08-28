"use client"

import { Dumbbell, Moon, Droplet } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DailyChecklistCard({
  client,
}: {
  client: {
    streak: number
    hasWorkoutToday: boolean
  }
}) {
  const { t } = useI18n()

  const items = [
    {
      id: "workout",
      label: lookup(t, "client.home.workout"),
      icon: Dumbbell,
      done: client.hasWorkoutToday,
    },
    {
      id: "water",
      label: lookup(t, "client.home.water"),
      icon: Droplet,
      done: false,
    },
    {
      id: "sleep",
      label: lookup(t, "client.home.sleep"),
      icon: Moon,
      done: client.streak > 0,
    },
  ]

  const completed = items.filter((i) => i.done).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lookup(t, "client.home.dailyChecklist")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 ${
                item.done
                  ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-300"
                  : "border-border text-muted-foreground"
              }`}
            >
              <item.icon className="size-5" />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-end text-xs text-muted-foreground">
          {completed}/{items.length}
        </p>
      </CardContent>
    </Card>
  )
}
