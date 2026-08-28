import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentSession } from "@/server/auth"
import { getTemplatesForTrainer } from "@/server/services/nutrition.service"
import { getTrainerClients } from "@/server/services/client.service"
import { NutritionTemplatesTable } from "@/components/features/nutrition/nutrition-templates-table"
import { getI18n } from "@/lib/i18n"

export default async function NutritionTemplatesPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()
  const trainerProfileId = session?.user.trainerProfileId

  if (!trainerProfileId) {
    return (
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const [templates, clientsResult] = await Promise.all([
    getTemplatesForTrainer(trainerProfileId),
    getTrainerClients(trainerProfileId, { perPage: 1000 }),
  ])

  const rows = templates.map((template) => ({
    id: template.id,
    name: template.name,
    isGlobal: template.isGlobal,
    calories: template.calories,
    proteinGrams: template.proteinGrams,
    carbsGrams: template.carbsGrams,
    fatsGrams: template.fatsGrams,
    mealsCount: template._count.meals,
  }))

  const assignableClients = clientsResult.clients.map((client) => ({
    id: client.id,
    fullName: client.fullName ?? "",
    goal: client.goal,
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t.nutrition.templates}</h1>
          <p className="text-sm text-muted-foreground">{t.nutrition.templatesDescription}</p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link href="/nutrition-templates/new">
            <Plus className="size-4" />
            {t.nutrition.newTemplate}
          </Link>
        </Button>
      </div>

      <NutritionTemplatesTable templates={rows} clients={assignableClients} />
    </div>
  )
}
