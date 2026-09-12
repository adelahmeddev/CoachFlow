import { getCurrentSession } from "@/server/auth"
import { listGoalsForClientOfTrainer } from "@/server/services/goal.service"
import { getI18n } from "@/lib/i18n"
import { GoalCard, GoalHistoryList } from "./goal-card"
import { GoalFormDialog } from "./goal-form-dialog"
import { GoalStatusButtons } from "./goal-status-buttons"

export async function GoalsTab({ clientId }: { clientId: string }) {
  const { t, locale } = await getI18n()
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const goals = (await listGoalsForClientOfTrainer(clientId, session.user.trainerProfileId)) ?? []
  const active = goals.filter((g) => g.status === "ACTIVE")
  const history = goals.filter((g) => g.status !== "ACTIVE")

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t.goals.title}</h2>
          <p className="text-muted-foreground">{t.goals.subtitle}</p>
        </div>
        <GoalFormDialog clientId={clientId} />
      </div>

      {active.length === 0 && history.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-sm font-semibold">{t.goals.noGoals}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t.goals.noGoalsDescription}</p>
        </div>
      ) : null}

      {active.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {active.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              t={t}
              locale={locale}
              actions={
                <div className="flex flex-wrap items-center gap-1.5">
                  <GoalFormDialog clientId={clientId} goal={g} />
                  <GoalStatusButtons goal={g} clientId={clientId} />
                </div>
              }
            />
          ))}
        </div>
      ) : null}

      <GoalHistoryList goals={history} t={t} locale={locale} />
    </div>
  )
}
