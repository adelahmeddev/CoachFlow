"use client"

import { User } from "lucide-react"
import type { Goal } from "@/lib/db/enums"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { getGoalLabel, parseGoals } from "@/lib/i18n/labels"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MyInfoSection({
  client,
}: {
  client: {
    id: string
    fullName: string
    phone: string
    email: string
    goals?: Goal[]
  }
}) {
  const { t, locale } = useI18n()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="size-5 text-brand-600 dark:text-brand-400" />
          <CardTitle>{lookup(t, "client.profile.myInfo")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.profile.name")}
          </label>
          <p className="font-medium">{client.fullName}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.profile.phone")}
          </label>
          <p className="font-medium">{client.phone || "—"}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Email</label>
          <p className="font-medium">{client.email || "—"}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.profile.goal")}
          </label>
          <p className="font-medium">
            {parseGoals(client.goals).length > 0
              ? parseGoals(client.goals).map((g) => getGoalLabel(g, locale) ?? g.replace(/_/g, " ")).join(", ")
              : "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
