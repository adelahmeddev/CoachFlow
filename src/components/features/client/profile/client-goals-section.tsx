"use client"

import { Target } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MyGoalsSection({
  client,
}: {
  client: {
    targetWeightKg: number | null
    targetDate: Date | null
  }
}) {
  const { t, locale } = useI18n()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="size-5 text-brand-600 dark:text-brand-400" />
          <CardTitle>{lookup(t, "client.profile.myGoals")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.profile.targetWeight")}
          </label>
          <p className="font-medium">
            {client.targetWeightKg ? `${client.targetWeightKg}kg` : "—"}
          </p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.profile.targetDate")}
          </label>
          <p className="font-medium">
            {client.targetDate
              ? new Date(client.targetDate).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : locale)
              : "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
