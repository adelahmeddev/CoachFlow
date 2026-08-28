import { prisma } from "@/lib/prisma"
import { PlanStatus } from "@/generated/prisma/enums"
import { withCache } from "@/lib/cache"
import {
  SUPPLEMENT_DEFS_SEED,
  SUBSTITUTE_GROUPS_SEED,
} from "@/lib/nutrition-fixed"
import type {
  NutritionContentInput,
  SupplementDefInput,
  SubstituteGroupInput,
  MealInput,
} from "@/lib/validations/nutrition"

/* ------------------------------------------------------------------ */
/* FIXED SECTIONS DEFAULTS                                             */
/* ------------------------------------------------------------------ */

function defaultSupplementDefs(): SupplementDefInput[] {
  return SUPPLEMENT_DEFS_SEED.map((def) => ({ ...def }))
}

function defaultSubstituteGroups(): SubstituteGroupInput[] {
  return SUBSTITUTE_GROUPS_SEED.map((group) => ({
    category: group.category,
    caloriesLabel: group.caloriesLabel,
    items: group.items.map((item) => ({ ...item })),
  }))
}

/* ------------------------------------------------------------------ */
/* CONTENT -> NESTED PRISMA CREATE                                     */
/* ------------------------------------------------------------------ */

function supplementDefsCreate(defs: SupplementDefInput[]) {
  return defs.map((def, index) => ({
    order: index + 1,
    name: def.name,
    nameAr: def.nameAr ?? null,
    definition: def.definition ?? null,
    definitionAr: def.definitionAr ?? null,
    importance: def.importance ?? null,
    importanceAr: def.importanceAr ?? null,
  }))
}

function substituteGroupsCreate(groups: SubstituteGroupInput[]) {
  return groups.map((group, groupIndex) => ({
    order: groupIndex + 1,
    category: group.category,
    caloriesLabel: group.caloriesLabel ?? null,
    items: {
      create: group.items.map((item, itemIndex) => ({
        order: itemIndex + 1,
        name: item.name,
        nameAr: item.nameAr ?? null,
        amount: item.amount ?? null,
        unit: item.unit,
      })),
    },
  }))
}

function mealsCreate(meals: MealInput[]) {
  return meals.map((meal, mealIndex) => ({
    order: mealIndex + 1,
    kind: meal.kind,
    name: meal.name,
    nameAr: meal.nameAr ?? null,
    items: {
      create: meal.items.map((item, itemIndex) => ({
        order: itemIndex + 1,
        groupNumber: item.groupNumber,
        foodName: item.foodName,
        foodNameAr: item.foodNameAr ?? null,
        amount: item.amount ?? null,
        unit: item.unit,
        calories: item.calories ?? null,
      })),
    },
  }))
}

const TEMPLATE_INCLUDE = {
  supplementDefs: { orderBy: { order: "asc" as const } },
  substituteGroups: {
    orderBy: { order: "asc" as const },
    include: { items: { orderBy: { order: "asc" as const } } },
  },
  meals: {
    orderBy: { order: "asc" as const },
    include: { items: { orderBy: { order: "asc" as const } } },
  },
}

const PLAN_INCLUDE = {
  template: { select: { id: true, name: true } },
  supplementDefs: { orderBy: { order: "asc" as const } },
  substituteGroups: {
    orderBy: { order: "asc" as const },
    include: { items: { orderBy: { order: "asc" as const } } },
  },
  meals: {
    orderBy: { order: "asc" as const },
    include: { items: { orderBy: { order: "asc" as const } } },
  },
}

/* ------------------------------------------------------------------ */
/* TEMPLATES                                                           */
/* ------------------------------------------------------------------ */

export async function createNutritionTemplate(
  trainerProfileId: string,
  data: NutritionContentInput
) {
  const defs = data.supplementDefs.length
    ? data.supplementDefs
    : defaultSupplementDefs()
  const groups = data.substituteGroups.length
    ? data.substituteGroups
    : defaultSubstituteGroups()

  return prisma.nutritionTemplate.create({
    data: {
      trainerId: trainerProfileId,
      name: data.name,
      isGlobal: data.isGlobal ?? false,
      calories: data.calories ?? null,
      proteinGrams: data.proteinGrams ?? null,
      carbsGrams: data.carbsGrams ?? null,
      fatsGrams: data.fatsGrams ?? null,
      waterLiters: data.waterLiters ?? null,
      coachMessage: data.coachMessage ?? null,
      guidelines: data.guidelines ?? [],
      avoidFoods: data.avoidFoods ?? [],
      recommendedFoods: data.recommendedFoods ?? [],
      supplementDefs: { create: supplementDefsCreate(defs) },
      substituteGroups: { create: substituteGroupsCreate(groups) },
      meals: { create: mealsCreate(data.meals) },
    },
    include: TEMPLATE_INCLUDE,
  })
}

export async function updateNutritionTemplate(
  trainerProfileId: string,
  templateId: string,
  data: NutritionContentInput
) {
  const template = await prisma.nutritionTemplate.findFirst({
    where: { id: templateId, OR: [{ trainerId: trainerProfileId }, { isGlobal: true }] },
    select: { id: true },
  })
  if (!template) return null

  return prisma.$transaction(async (tx) => {
    await tx.supplementDef.deleteMany({ where: { templateId } })
    await tx.substituteGroup.deleteMany({ where: { templateId } })
    await tx.meal.deleteMany({ where: { templateId } })

    return tx.nutritionTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        calories: data.calories ?? null,
        proteinGrams: data.proteinGrams ?? null,
        carbsGrams: data.carbsGrams ?? null,
        fatsGrams: data.fatsGrams ?? null,
        waterLiters: data.waterLiters ?? null,
        coachMessage: data.coachMessage ?? null,
        guidelines: data.guidelines ?? [],
        avoidFoods: data.avoidFoods ?? [],
        recommendedFoods: data.recommendedFoods ?? [],
        supplementDefs: { create: supplementDefsCreate(data.supplementDefs) },
        substituteGroups: { create: substituteGroupsCreate(data.substituteGroups) },
        meals: { create: mealsCreate(data.meals) },
      },
      include: TEMPLATE_INCLUDE,
    })
  })
}

export async function deleteNutritionTemplate(
  trainerProfileId: string,
  templateId: string
) {
  const template = await prisma.nutritionTemplate.findFirst({
    where: {
      id: templateId,
      OR: [{ trainerId: trainerProfileId }, { isGlobal: true }],
    },
    select: { id: true },
  })
  if (!template) return false
  await prisma.nutritionTemplate.delete({ where: { id: templateId } })
  return true
}

export function getTemplatesForTrainer(trainerProfileId: string) {
  return withCache(
    async () => {
      const rows = await prisma.nutritionTemplate.findMany({
        where: {
          OR: [{ trainerId: trainerProfileId }, { isGlobal: true }],
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          isGlobal: true,
          calories: true,
          proteinGrams: true,
          carbsGrams: true,
          fatsGrams: true,
          _count: { select: { meals: true } },
          createdAt: true,
          updatedAt: true,
        },
      })
      return rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }))
    },
    ["nutrition-templates-v2", trainerProfileId],
    [`trainer:${trainerProfileId}:templates`, "templates"],
    600
  )()
}

export async function getTemplateForEdit(
  trainerProfileId: string,
  templateId: string
) {
  const template = await prisma.nutritionTemplate.findFirst({
    where: {
      id: templateId,
      OR: [{ trainerId: trainerProfileId }, { isGlobal: true }],
    },
    include: TEMPLATE_INCLUDE,
  })
  if (!template) return null
  if (!template.isGlobal && template.trainerId !== trainerProfileId) return null
  return template
}

/* ------------------------------------------------------------------ */
/* DEEP COPY: TEMPLATE -> PLAN SNAPSHOT                                */
/* ------------------------------------------------------------------ */

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

async function copyTemplateToPlanInTx(
  tx: TxClient,
  templateId: string,
  planId: string
) {
  const template = await tx.nutritionTemplate.findUnique({
    where: { id: templateId },
    include: TEMPLATE_INCLUDE,
  })
  if (!template) throw new Error("TEMPLATE_NOT_FOUND")

  await tx.supplementDef.deleteMany({ where: { planId } })
  await tx.substituteGroup.deleteMany({ where: { planId } })
  await tx.meal.deleteMany({ where: { planId } })

  await tx.clientNutritionPlan.update({
    where: { id: planId },
    data: {
      templateId: template.id,
      calories: template.calories,
      proteinGrams: template.proteinGrams,
      carbsGrams: template.carbsGrams,
      fatsGrams: template.fatsGrams,
      waterLiters: template.waterLiters,
      coachMessage: template.coachMessage,
      guidelines: [...template.guidelines],
      avoidFoods: [...template.avoidFoods],
      recommendedFoods: [...template.recommendedFoods],
      supplementDefs: { create: supplementDefsCreate(template.supplementDefs) },
      substituteGroups: {
        create: template.substituteGroups.map((group, groupIndex) => ({
          order: groupIndex + 1,
          category: group.category,
          caloriesLabel: group.caloriesLabel,
          items: {
            create: group.items.map((item, itemIndex) => ({
              order: itemIndex + 1,
              name: item.name,
              nameAr: item.nameAr,
              amount: item.amount,
              unit: item.unit,
            })),
          },
        })),
      },
      meals: {
        create: template.meals.map((meal, mealIndex) => ({
          order: mealIndex + 1,
          kind: meal.kind,
          name: meal.name,
          nameAr: meal.nameAr,
          items: {
            create: meal.items.map((item, itemIndex) => ({
              order: itemIndex + 1,
              groupNumber: item.groupNumber,
              foodName: item.foodName,
              foodNameAr: item.foodNameAr,
              amount: item.amount,
              unit: item.unit,
              calories: item.calories,
            })),
          },
        })),
      },
    },
  })
}

export async function assignTemplateToClients(
  trainerProfileId: string,
  templateId: string,
  clientIds: string[]
): Promise<number> {
  const template = await prisma.nutritionTemplate.findFirst({
    where: {
      id: templateId,
      OR: [{ trainerId: trainerProfileId }, { isGlobal: true }],
    },
    select: { id: true },
  })
  if (!template) throw new Error("TEMPLATE_NOT_FOUND")

  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds }, trainerId: trainerProfileId },
    select: { id: true },
  })

  let assigned = 0
  for (const client of clients) {
    await prisma.$transaction(async (tx) => {
      await tx.clientNutritionPlan.updateMany({
        where: { clientId: client.id, status: PlanStatus.ACTIVE },
        data: { status: PlanStatus.COMPLETED, endDate: new Date() },
      })

      const plan = await tx.clientNutritionPlan.create({
        data: {
          clientId: client.id,
          templateId: template.id,
          status: PlanStatus.ACTIVE,
          startDate: new Date(),
        },
      })

      await copyTemplateToPlanInTx(tx, template.id, plan.id)
    })
    assigned += 1
  }

  return assigned
}

export async function refreshPlanFromTemplate(
  trainerProfileId: string,
  planId: string
): Promise<boolean> {
  const plan = await prisma.clientNutritionPlan.findFirst({
    where: { id: planId, client: { trainerId: trainerProfileId } },
    select: { id: true, templateId: true },
  })
  if (!plan || !plan.templateId) return false

  await prisma.$transaction(async (tx) => {
    await copyTemplateToPlanInTx(tx, plan.templateId!, plan.id)
  })
  return true
}

/* ------------------------------------------------------------------ */
/* PLAN READ/WRITE                                                     */
/* ------------------------------------------------------------------ */

export async function getActivePlanFull(clientId: string) {
  return prisma.clientNutritionPlan.findFirst({
    where: { clientId, status: PlanStatus.ACTIVE },
    include: PLAN_INCLUDE,
  })
}

export function getCachedActivePlanFull(clientId: string) {
  return withCache(
    () => getActivePlanFull(clientId),
    ["client-nutrition-plan-full", clientId],
    [`client:${clientId}:nutrition`],
    120
  )()
}

export async function getOwnedClientTrainerId(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { trainerId: true },
  })
  return client?.trainerId ?? null
}

export async function savePlanContent(
  trainerProfileId: string,
  planId: string,
  data: NutritionContentInput
) {
  const plan = await prisma.clientNutritionPlan.findFirst({
    where: { id: planId, client: { trainerId: trainerProfileId } },
    select: { id: true, clientId: true },
  })
  if (!plan) return null

  return prisma.$transaction(async (tx) => {
    await tx.supplementDef.deleteMany({ where: { planId } })
    await tx.substituteGroup.deleteMany({ where: { planId } })
    await tx.meal.deleteMany({ where: { planId } })

    return tx.clientNutritionPlan.update({
      where: { id: planId },
      data: {
        calories: data.calories ?? null,
        proteinGrams: data.proteinGrams ?? null,
        carbsGrams: data.carbsGrams ?? null,
        fatsGrams: data.fatsGrams ?? null,
        waterLiters: data.waterLiters ?? null,
        coachMessage: data.coachMessage ?? null,
        guidelines: data.guidelines ?? [],
        avoidFoods: data.avoidFoods ?? [],
        recommendedFoods: data.recommendedFoods ?? [],
        supplementDefs: { create: supplementDefsCreate(data.supplementDefs) },
        substituteGroups: { create: substituteGroupsCreate(data.substituteGroups) },
        meals: { create: mealsCreate(data.meals) },
      },
      include: PLAN_INCLUDE,
    })
  })
}

export async function getPlanHistory(clientId: string) {
  return prisma.clientNutritionPlan.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      calories: true,
      template: { select: { name: true } },
    },
  })
}

/* ------------------------------------------------------------------ */
/* MEAL CHOICES                                                        */
/* ------------------------------------------------------------------ */

function todayMidnight(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

export async function toggleMealChoice(clientId: string, mealItemId: string) {
  const item = await prisma.mealItem.findFirst({
    where: {
      id: mealItemId,
      meal: { plan: { clientId, status: PlanStatus.ACTIVE } },
    },
    select: { id: true },
  })
  if (!item) return null

  const date = todayMidnight()
  const existing = await prisma.mealChoice.findUnique({
    where: {
      clientId_mealItemId_date: { clientId, mealItemId, date },
    },
    select: { id: true },
  })

  if (existing) {
    await prisma.mealChoice.delete({ where: { id: existing.id } })
    return { chosen: false }
  }

  await prisma.mealChoice.create({ data: { clientId, mealItemId, date } })
  return { chosen: true }
}

export async function getTodayMealChoices(clientId: string) {
  const choices = await prisma.mealChoice.findMany({
    where: { clientId, date: todayMidnight() },
    select: { mealItemId: true },
  })
  return choices.map((choice) => choice.mealItemId)
}
