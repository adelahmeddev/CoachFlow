import Link from "next/link"
import { Plus } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getClientTrainingSplitData } from "@/server/services/training-split.service"
import { Button } from "@/components/ui/button"
import { ActiveSplitCard } from "@/components/features/training-split/active-split-card"
import { ClientWeekStatus } from "@/components/features/training-split/client-week-status"
import { SplitHistoryTable } from "@/components/features/training-split/split-history-table"
import { getI18n } from "@/lib/i18n"

interface TrainingSplitTabProps {
  clientId: string
}

export async function TrainingSplitTab({ clientId }: TrainingSplitTabProps) {
  const { t } = await getI18n()
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const data = await getClientTrainingSplitData(
    clientId,
    session.user.trainerProfileId
  )

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const activeSplit = data.splits.find((split) => split.status === "ACTIVE") ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t.trainingSplit.title}</h2>
          <p className="text-muted-foreground">
            {t.trainingSplit.manageSplitAndDays}
          </p>
        </div>
        <Button asChild>
          <Link href={`/clients/${clientId}/training-split/new`}>
            <Plus className="me-1 h-4 w-4" />
            {t.trainingSplit.newSplit}
          </Link>
        </Button>
      </div>

      {activeSplit ? (
        <>
          <ActiveSplitCard split={activeSplit} clientId={clientId} />
          <ClientWeekStatus clientId={clientId} />
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-sm font-semibold">{t.trainingSplit.noActiveSplit}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.trainingSplit.createSplitForClient}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={`/clients/${clientId}/training-split/new`}>
              {t.trainingSplit.newSplit}
            </Link>
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t.trainingSplit.splitHistory}</h3>
        <SplitHistoryTable splits={data.splits} clientId={clientId} />
      </div>
    </div>
  )
}
