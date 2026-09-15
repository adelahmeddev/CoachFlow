import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getOwnedClientForForm } from "@/server/services/training-split.service"
import { getTemplatesForForm } from "@/server/services/training-split-template.service"
import { listGlobalExercises } from "@/server/services/exercise.service"
import {
  getClientPainFlags,
  getOtherClientsSplits,
} from "@/server/services/training-split.service"
import { getTrainerWeekStartDay } from "@/server/services/training-split.service"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n"

const TrainingSplitForm = dynamic(
  () =>
    import("@/components/features/training-split/training-split-form").then(
      (m) => m.TrainingSplitForm
    ),
  {
    loading: () => (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="h-48 bg-muted rounded" />
        <div className="h-48 bg-muted rounded" />
      </div>
    ),
  }
)

interface NewTrainingSplitPageProps {
  params: Promise<{ id: string }>
}

export default async function NewTrainingSplitPage({
  params,
}: NewTrainingSplitPageProps) {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
    notFound()
  }

  const { id } = await params
  const trainerProfileId = session.user.trainerProfileId

  const [client, exercises, allTemplates, cloneSources, painFlags, weekStartDay] =
    await Promise.all([
      getOwnedClientForForm(id, trainerProfileId),
      listGlobalExercises(),
      getTemplatesForForm(trainerProfileId),
      getOtherClientsSplits(id, trainerProfileId),
      getClientPainFlags(id, trainerProfileId),
      getTrainerWeekStartDay(trainerProfileId),
    ])

  if (!client) {
    notFound()
  }

  const templates = allTemplates.filter(
    (template) =>
      template.goal === null || template.goal === client.goal
  )

  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="gap-2 ps-0 text-muted-foreground"
      >
        <Link href={`/clients/${id}?tab=training-split`}>
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t.trainingSplit.backToSplit}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.trainingSplit.newSplit}
        </h1>
        <p className="text-muted-foreground">
          {client.fullName ?? t.common.none}
        </p>
      </div>

      <TrainingSplitForm
        clientId={client.id}
        exercises={exercises}
        templates={templates}
        cloneSources={cloneSources}
        painFlags={painFlags}
        weekStartDay={weekStartDay}
      />
    </div>
  )
}
