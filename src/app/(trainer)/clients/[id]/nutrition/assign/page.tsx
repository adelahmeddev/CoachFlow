import { notFound } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getClientProfile } from "@/server/services/client-profile.service"
import { getTemplatesForTrainer } from "@/server/services/nutrition.service"
import { AssignTemplateFromClient } from "@/components/features/nutrition/assign-template-from-client"
import { getI18n } from "@/lib/i18n"

export default async function AssignNutritionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getCurrentSession()
  const { t } = await getI18n()

  if (!session?.user || session.user.role !== "TRAINER" || !session.user.trainerProfileId) {
    notFound()
  }

  await getClientProfile(id, session.user.trainerProfileId)

  const templates = await getTemplatesForTrainer(session.user.trainerProfileId)

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Change Nutrition Plan</h1>
      <AssignTemplateFromClient
        clientId={id}
        templates={templates.map(tpl => ({
          id: tpl.id,
          name: tpl.name,
          calories: tpl.calories,
          mealsCount: tpl._count.meals,
          isGlobal: tpl.isGlobal,
        }))}
      />
    </div>
  )
}
