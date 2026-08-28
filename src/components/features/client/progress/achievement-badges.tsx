"use client"

import { Trophy, Flame, Medal, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function AchievementBadges({
  streak,
  workoutCount,
  goalProgress,
}: {
  streak: number
  workoutCount: number
  goalProgress: number
}) {
  const { t } = useI18n()

  const achievements = [
    {
      id: "first-workout",
      title: lookup(t, "client.progress.firstWorkout"),
      icon: Trophy,
      earned: workoutCount >= 1,
    },
    {
      id: "seven-day-streak",
      title: "سلسلة 7 أيام",
      icon: Flame,
      earned: streak >= 7,
    },
    {
      id: "new-pr",
      title: lookup(t, "client.progress.newPR"),
      icon: Sparkles,
      earned: false,
    },
    {
      id: "goal-achieved",
      title: lookup(t, "client.progress.goalAchieved"),
      icon: Medal,
      earned: goalProgress >= 100,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lookup(t, "client.progress.achievements")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-3 text-center",
                ach.earned
                  ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-300"
                  : "border-border text-muted-foreground"
              )}
            >
              <ach.icon className="size-6" />
              <span className="text-xs font-medium">{ach.title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
