import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import {
  getOwnedClientForForm,
  getTrainingSplitForEdit,
} from "@/server/services/training-split.service"
import { getTemplatesForForm } from "@/server/services/training-split-template.service"
import { listGlobalExercises } from "@/server/services/exercise.service"
import {
  getClientPainFlags,
  getOtherClientsSplits,
} from "@/server/services/training-split.service"

import { Button } from "@/components/ui/button"
import { TrainingSplitForm } from "@/components/features/training-split/training-split-form"
import { getI18n } from "@/lib/i18n"
import { getTrainerWeekStartDay } from "@/server/services/training-split.service"

interface EditTrainingSplitPageProps {
  params: Promise<{ id: string; splitId: string }>
}

export default async function EditTrainingSplitPage({
  params,
}: EditTrainingSplitPageProps) {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    (session.user.role !== "COACH" && session.user.role !== "SUPER_ADMIN") ||
    (session.user.role === "COACH" && !session.user.trainerProfileId)
  ) {
    notFound()
  }

  const { id, splitId } = await params
  const trainerProfileId =
    session.user.role === "SUPER_ADMIN" ? undefined : session.user.trainerProfileId

  const [client, split, exercises, allTemplates, cloneSources, painFlags, weekStartDay] =
    await Promise.all([
      getOwnedClientForForm(id, trainerProfileId),
      getTrainingSplitForEdit(id, trainerProfileId, splitId),
      listGlobalExercises(),
      getTemplatesForForm(trainerProfileId),
      getOtherClientsSplits(id, trainerProfileId),
      getClientPainFlags(id, trainerProfileId),
      getTrainerWeekStartDay(trainerProfileId),
    ])

  if (!client || !split) {
    notFound()
  }

  const templates = allTemplates.filter(
    (template) =>
      (template.goal === null || template.goal === client.goal) &&
      (split.daysPerWeek === 0 ||
        template.daysPerWeek === split.daysPerWeek)
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
          {t.trainingSplit.editSplit}
        </h1>
        <p className="text-muted-foreground">
          {client.fullName ?? t.common.none}
        </p>
      </div>

      <TrainingSplitForm
        clientId={client.id}
        split={split}
        exercises={exercises}
        templates={templates}
        cloneSources={cloneSources}
        painFlags={painFlags}
        weekStartDay={weekStartDay}
      />
    </div>
  )
}
