"use client"

import { Target } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function GoalProjectionCard({ progress }: { progress: number }) {
  const { t } = useI18n()
  const achieved = progress >= 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="size-5 text-brand-600 dark:text-brand-400" />
          <CardTitle>{lookup(t, "client.home.goalProgress")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {lookup(t, "client.common.current")}: {progress}%
          </span>
          <span>
            {lookup(t, "client.common.remaining")}: {100 - progress}%
          </span>
        </div>
        {achieved ? (
          <p className="text-sm font-medium text-emerald-600">
            {lookup(t, "client.progress.goalAchieved")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
