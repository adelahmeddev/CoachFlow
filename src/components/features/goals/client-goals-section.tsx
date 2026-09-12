import { Target } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { listGoalsForClient } from "@/server/services/goal.service"
import { getI18n } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoalCard, GoalHistoryList } from "./goal-card"

export async function ClientGoalsSection() {
  const { t, locale } = await getI18n()
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId
  if (!clientId) return null

  const goals = await listGoalsForClient(clientId)
  const active = goals.filter((g) => g.status === "ACTIVE")
  const history = goals.filter((g) => g.status !== "ACTIVE")

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 py-4">
          <Target className="size-5 text-brand-600 dark:text-brand-400" />
          <div>
            <CardTitle className="text-base">{t.goals.myTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">{t.goals.mySubtitle}</p>
          </div>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t.goals.noGoalsClient}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {active.map((g) => (
                <GoalCard key={g.id} goal={g} t={t} locale={locale} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <GoalHistoryList goals={history} t={t} locale={locale} />
    </div>
  )
}
