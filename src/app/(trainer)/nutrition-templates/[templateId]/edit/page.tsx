import { notFound } from "next/navigation"
import { NutritionBuilder } from "@/components/features/nutrition/nutrition-builder"
import { DeleteTemplateButton } from "@/components/features/nutrition/delete-template-button"
import { getCurrentSession } from "@/server/auth"
import { getTemplateForEdit } from "@/server/services/nutrition.service"
import { getI18n } from "@/lib/i18n"

export default async function EditNutritionTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params
  const { t } = await getI18n()
  const session = await getCurrentSession()
  const trainerProfileId = session?.user.trainerProfileId

  if (!trainerProfileId) {
    return <p className="p-8 text-destructive">{t.toasts.unauthorized}</p>
  }

  const template = await getTemplateForEdit(trainerProfileId, templateId)
  if (!template) notFound()

  const initial = {
    name: template.name,
    calories: template.calories,
    proteinGrams: template.proteinGrams,
    carbsGrams: template.carbsGrams,
    fatsGrams: template.fatsGrams,
    waterLiters: template.waterLiters,
    coachMessage: template.coachMessage ?? "",
    guidelines: [...template.guidelines],
    avoidFoods: [...template.avoidFoods],
    recommendedFoods: [...template.recommendedFoods],
    supplementDefs: template.supplementDefs.map((def) => ({
      name: def.name,
      nameAr: def.nameAr ?? "",
      definition: def.definition ?? "",
      definitionAr: def.definitionAr ?? "",
      importance: def.importance ?? "",
      importanceAr: def.importanceAr ?? "",
    })),
    substituteGroups: template.substituteGroups.map((group) => ({
      category: group.category,
      caloriesLabel: group.caloriesLabel ?? "",
      items: group.items.map((item) => ({
        name: item.name,
        nameAr: item.nameAr ?? "",
        amount: item.amount,
        unit: item.unit,
      })),
    })),
    meals: template.meals.map((meal) => ({
      kind: meal.kind,
      name: meal.name,
      nameAr: meal.nameAr ?? "",
      items: meal.items.map((item) => ({
        foodName: item.foodName,
        foodNameAr: item.foodNameAr ?? "",
        amount: item.amount,
        unit: item.unit,
        calories: item.calories,
        groupNumber: item.groupNumber,
      })),
    })),
  }

  const canDelete = true

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t.nutrition.editTemplate}: {template.name}
        </h1>
        {canDelete && (
          <DeleteTemplateButton
            templateId={template.id}
            templateName={template.name}
          />
        )}
      </div>
      <NutritionBuilder mode="template" initial={initial} templateId={template.id} />
      {canDelete && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <h3 className="font-medium text-destructive">{t.common.delete}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.nutrition.deleteConfirm}
          </p>
          <div className="mt-3">
            <DeleteTemplateButton
              templateId={template.id}
              templateName={template.name}
            />
          </div>
        </div>
      )}
    </div>
  )
}
