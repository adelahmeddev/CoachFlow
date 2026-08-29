import { pool, generateId, withTransaction } from "@/lib/db"
import { PlanStatus } from "@/lib/db/enums"
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
import type { PgClient } from "@/lib/db"
import type {
  SupplementDef,
  SubstituteGroup,
  SubstituteItem,
  Meal,
  MealItem,
  NutritionTemplate,
  ClientNutritionPlan,
} from "@/lib/db/types"

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
/* CONTENT -> NESTED CREATE HELPERS (kept for compatibility)          */
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

/* ------------------------------------------------------------------ */
/* RAW PG HELPERS                                                      */
/* ------------------------------------------------------------------ */

type Exec = PgClient | typeof pool

async function fetchSupplementDefsByTemplateId(
  templateId: string,
  exec: Exec
): Promise<SupplementDef[]> {
  const res = await exec.query(
    `SELECT * FROM "SupplementDef" WHERE "templateId" = $1 ORDER BY "order" ASC`,
    [templateId]
  )
  return res.rows as SupplementDef[]
}

async function fetchSupplementDefsByPlanId(planId: string, exec: Exec): Promise<SupplementDef[]> {
  const res = await exec.query(
    `SELECT * FROM "SupplementDef" WHERE "planId" = $1 ORDER BY "order" ASC`,
    [planId]
  )
  return res.rows as SupplementDef[]
}

async function fetchSubstituteGroupsByTemplateId(
  templateId: string,
  exec: Exec
): Promise<Array<SubstituteGroup & { items: SubstituteItem[] }>> {
  const groupsRes = await exec.query(
    `SELECT * FROM "SubstituteGroup" WHERE "templateId" = $1 ORDER BY "order" ASC`,
    [templateId]
  )
  const groups = groupsRes.rows as SubstituteGroup[]
  const result: Array<SubstituteGroup & { items: SubstituteItem[] }> = []
  for (const group of groups) {
    const itemsRes = await exec.query(
      `SELECT * FROM "SubstituteItem" WHERE "groupId" = $1 ORDER BY "order" ASC`,
      [group.id]
    )
    result.push({ ...group, items: itemsRes.rows as SubstituteItem[] })
  }
  return result
}

async function fetchSubstituteGroupsByPlanId(planId: string, exec: Exec): Promise<Array<SubstituteGroup & { items: SubstituteItem[] }>> {
  const groupsRes = await exec.query(
    `SELECT * FROM "SubstituteGroup" WHERE "planId" = $1 ORDER BY "order" ASC`,
    [planId]
  )
  const groups = groupsRes.rows as SubstituteGroup[]
  const result: Array<SubstituteGroup & { items: SubstituteItem[] }> = []
  for (const group of groups) {
    const itemsRes = await exec.query(
      `SELECT * FROM "SubstituteItem" WHERE "groupId" = $1 ORDER BY "order" ASC`,
      [group.id]
    )
    result.push({ ...group, items: itemsRes.rows as SubstituteItem[] })
  }
  return result
}

async function fetchMealsByTemplateId(templateId: string, exec: Exec): Promise<Array<Meal & { items: MealItem[] }>> {
  const mealsRes = await exec.query(
    `SELECT * FROM "Meal" WHERE "templateId" = $1 ORDER BY "order" ASC`,
    [templateId]
  )
  const meals = mealsRes.rows as Meal[]
  const result: Array<Meal & { items: MealItem[] }> = []
  for (const meal of meals) {
    const itemsRes = await exec.query(
      `SELECT * FROM "MealItem" WHERE "mealId" = $1 ORDER BY "order" ASC`,
      [meal.id]
    )
    result.push({ ...meal, items: itemsRes.rows as MealItem[] })
  }
  return result
}

async function fetchMealsByPlanId(planId: string, exec: Exec): Promise<Array<Meal & { items: MealItem[] }>> {
  const mealsRes = await exec.query(
    `SELECT * FROM "Meal" WHERE "planId" = $1 ORDER BY "order" ASC`,
    [planId]
  )
  const meals = mealsRes.rows as Meal[]
  const result: Array<Meal & { items: MealItem[] }> = []
  for (const meal of meals) {
    const itemsRes = await exec.query(
      `SELECT * FROM "MealItem" WHERE "mealId" = $1 ORDER BY "order" ASC`,
      [meal.id]
    )
    result.push({ ...meal, items: itemsRes.rows as MealItem[] })
  }
  return result
}

export type NutritionTemplateFull = NutritionTemplate & {
  supplementDefs: SupplementDef[]
  substituteGroups: Array<SubstituteGroup & { items: SubstituteItem[] }>
  meals: Array<Meal & { items: MealItem[] }>
}

export type ClientNutritionPlanFull = ClientNutritionPlan & {
  template: { id: string; name: string } | null
  supplementDefs: SupplementDef[]
  substituteGroups: Array<SubstituteGroup & { items: SubstituteItem[] }>
  meals: Array<Meal & { items: MealItem[] }>
}

async function fetchTemplateFull(templateId: string, exec: Exec): Promise<NutritionTemplateFull | null> {
  const tmplRes = await exec.query(
    `SELECT * FROM "NutritionTemplate" WHERE "id" = $1 LIMIT 1`,
    [templateId]
  )
  if (!tmplRes.rowCount || tmplRes.rowCount === 0) return null
  const template = tmplRes.rows[0] as NutritionTemplate
  const supplementDefs = await fetchSupplementDefsByTemplateId(templateId, exec)
  const substituteGroups = await fetchSubstituteGroupsByTemplateId(templateId, exec)
  const meals = await fetchMealsByTemplateId(templateId, exec)
  return { ...template, supplementDefs, substituteGroups, meals }
}

async function fetchPlanFull(planId: string, exec: Exec): Promise<ClientNutritionPlanFull | null> {
  const planRes = await exec.query(
    `SELECT * FROM "ClientNutritionPlan" WHERE "id" = $1 LIMIT 1`,
    [planId]
  )
  if (!planRes.rowCount || planRes.rowCount === 0) return null
  const plan = planRes.rows[0] as ClientNutritionPlan
  let template: { id: string; name: string } | null = null
  if (plan.templateId) {
    const tRes = await exec.query(
      `SELECT "id", "name" FROM "NutritionTemplate" WHERE "id" = $1 LIMIT 1`,
      [plan.templateId]
    )
    if (tRes.rowCount && tRes.rowCount > 0) {
      template = tRes.rows[0] as { id: string; name: string }
    }
  }
  const supplementDefs = await fetchSupplementDefsByPlanId(planId, exec)
  const substituteGroups = await fetchSubstituteGroupsByPlanId(planId, exec)
  const meals = await fetchMealsByPlanId(planId, exec)
  return { ...plan, template, supplementDefs, substituteGroups, meals }
}

/* Insert helpers for transaction */
async function insertSupplementDefsForTemplate(
  client: PgClient,
  templateId: string,
  defs: SupplementDefInput[]
) {
  for (let idx = 0; idx < defs.length; idx++) {
    const def = defs[idx]
    const id = generateId()
    await client.query(
      `INSERT INTO "SupplementDef" ("id", "templateId", "name", "nameAr", "definition", "definitionAr", "importance", "importanceAr", "order")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        templateId,
        def.name,
        def.nameAr ?? null,
        def.definition ?? null,
        def.definitionAr ?? null,
        def.importance ?? null,
        def.importanceAr ?? null,
        idx + 1,
      ]
    )
  }
}

async function insertSupplementDefsForPlan(
  client: PgClient,
  planId: string,
  defs: { name: string; nameAr: string | null; definition: string | null; definitionAr: string | null; importance: string | null; importanceAr: string | null; order: number }[]
) {
  for (const def of defs) {
    const id = generateId()
    await client.query(
      `INSERT INTO "SupplementDef" ("id", "planId", "name", "nameAr", "definition", "definitionAr", "importance", "importanceAr", "order")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, planId, def.name, def.nameAr, def.definition, def.definitionAr, def.importance, def.importanceAr, def.order]
    )
  }
}

async function insertSubstituteGroupsForTemplate(
  client: PgClient,
  templateId: string,
  groups: SubstituteGroupInput[]
) {
  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const group = groups[gIdx]
    const groupId = generateId()
    await client.query(
      `INSERT INTO "SubstituteGroup" ("id", "templateId", "category", "caloriesLabel", "order")
       VALUES ($1, $2, $3::"SubstituteCategory", $4, $5)`,
      [groupId, templateId, group.category, group.caloriesLabel ?? null, gIdx + 1]
    )
    for (let iIdx = 0; iIdx < group.items.length; iIdx++) {
      const item = group.items[iIdx]
      const itemId = generateId()
      await client.query(
        `INSERT INTO "SubstituteItem" ("id", "groupId", "name", "nameAr", "amount", "unit", "order")
         VALUES ($1, $2, $3, $4, $5, $6::"QuantityUnit", $7)`,
        [itemId, groupId, item.name, item.nameAr ?? null, item.amount ?? null, item.unit, iIdx + 1]
      )
    }
  }
}

async function insertSubstituteGroupsForPlan(
  client: PgClient,
  planId: string,
  groups: Array<{ category: string; caloriesLabel: string | null; order: number; items: Array<{ name: string; nameAr: string | null; amount: number | null; unit: string; order: number }> }>
) {
  for (const group of groups) {
    const groupId = generateId()
    await client.query(
      `INSERT INTO "SubstituteGroup" ("id", "planId", "category", "caloriesLabel", "order")
       VALUES ($1, $2, $3::"SubstituteCategory", $4, $5)`,
      [groupId, planId, group.category, group.caloriesLabel, group.order]
    )
    for (const item of group.items) {
      const itemId = generateId()
      await client.query(
        `INSERT INTO "SubstituteItem" ("id", "groupId", "name", "nameAr", "amount", "unit", "order")
         VALUES ($1, $2, $3, $4, $5, $6::"QuantityUnit", $7)`,
        [itemId, groupId, item.name, item.nameAr, item.amount, item.unit, item.order]
      )
    }
  }
}

async function insertMealsForTemplate(
  client: PgClient,
  templateId: string,
  meals: MealInput[]
) {
  for (let mIdx = 0; mIdx < meals.length; mIdx++) {
    const meal = meals[mIdx]
    const mealId = generateId()
    await client.query(
      `INSERT INTO "Meal" ("id", "templateId", "kind", "order", "name", "nameAr")
       VALUES ($1, $2, $3::"MealKind", $4, $5, $6)`,
      [mealId, templateId, meal.kind, mIdx + 1, meal.name, meal.nameAr ?? null]
    )
    for (let iIdx = 0; iIdx < meal.items.length; iIdx++) {
      const item = meal.items[iIdx]
      const itemId = generateId()
      await client.query(
        `INSERT INTO "MealItem" ("id", "mealId", "groupNumber", "foodName", "foodNameAr", "amount", "unit", "calories", "order")
         VALUES ($1, $2, $3, $4, $5, $6, $7::"QuantityUnit", $8, $9)`,
        [
          itemId,
          mealId,
          item.groupNumber,
          item.foodName,
          item.foodNameAr ?? null,
          item.amount ?? null,
          item.unit,
          item.calories ?? null,
          iIdx + 1,
        ]
      )
    }
  }
}

async function insertMealsForPlan(
  client: PgClient,
  planId: string,
  meals: Array<{ kind: string; name: string; nameAr: string | null; order: number; items: Array<{ groupNumber: number; foodName: string; foodNameAr: string | null; amount: number | null; unit: string; calories: number | null; order: number }> }>
) {
  for (const meal of meals) {
    const mealId = generateId()
    await client.query(
      `INSERT INTO "Meal" ("id", "planId", "kind", "order", "name", "nameAr")
       VALUES ($1, $2, $3::"MealKind", $4, $5, $6)`,
      [mealId, planId, meal.kind, meal.order, meal.name, meal.nameAr]
    )
    for (const item of meal.items) {
      const itemId = generateId()
      await client.query(
        `INSERT INTO "MealItem" ("id", "mealId", "groupNumber", "foodName", "foodNameAr", "amount", "unit", "calories", "order")
         VALUES ($1, $2, $3, $4, $5, $6, $7::"QuantityUnit", $8, $9)`,
        [itemId, mealId, item.groupNumber, item.foodName, item.foodNameAr, item.amount, item.unit, item.calories, item.order]
      )
    }
  }
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

  return withTransaction(async (client) => {
    const id = generateId()
    const now = new Date()
    await client.query(
      `INSERT INTO "NutritionTemplate" ("id", "trainerId", "name", "isGlobal", "calories", "proteinGrams", "carbsGrams", "fatsGrams", "waterLiters", "coachMessage", "guidelines", "avoidFoods", "recommendedFoods", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)`,
      [
        id,
        trainerProfileId,
        data.name,
        data.isGlobal ?? false,
        data.calories ?? null,
        data.proteinGrams ?? null,
        data.carbsGrams ?? null,
        data.fatsGrams ?? null,
        data.waterLiters ?? null,
        data.coachMessage ?? null,
        data.guidelines ?? [],
        data.avoidFoods ?? [],
        data.recommendedFoods ?? [],
        now,
      ]
    )

    await insertSupplementDefsForTemplate(client, id, defs)
    await insertSubstituteGroupsForTemplate(client, id, groups)
    await insertMealsForTemplate(client, id, data.meals)

    const full = await fetchTemplateFull(id, client)
    return full!
  })
}

export async function updateNutritionTemplate(
  trainerProfileId: string,
  templateId: string,
  data: NutritionContentInput
) {
  const check = await pool.query(
    `SELECT "id" FROM "NutritionTemplate" WHERE "id" = $1 AND ("trainerId" = $2 OR "isGlobal" = true) LIMIT 1`,
    [templateId, trainerProfileId]
  )
  if (!check.rowCount || check.rowCount === 0) return null

  return withTransaction(async (client) => {
    await client.query(`DELETE FROM "Meal" WHERE "templateId" = $1`, [templateId])
    await client.query(`DELETE FROM "SubstituteGroup" WHERE "templateId" = $1`, [templateId])
    await client.query(`DELETE FROM "SupplementDef" WHERE "templateId" = $1`, [templateId])

    await client.query(
      `UPDATE "NutritionTemplate" SET "name" = $1, "calories" = $2, "proteinGrams" = $3, "carbsGrams" = $4, "fatsGrams" = $5, "waterLiters" = $6, "coachMessage" = $7, "guidelines" = $8, "avoidFoods" = $9, "recommendedFoods" = $10, "updatedAt" = NOW() WHERE "id" = $11`,
      [
        data.name,
        data.calories ?? null,
        data.proteinGrams ?? null,
        data.carbsGrams ?? null,
        data.fatsGrams ?? null,
        data.waterLiters ?? null,
        data.coachMessage ?? null,
        data.guidelines ?? [],
        data.avoidFoods ?? [],
        data.recommendedFoods ?? [],
        templateId,
      ]
    )

    await insertSupplementDefsForTemplate(client, templateId, data.supplementDefs)
    await insertSubstituteGroupsForTemplate(client, templateId, data.substituteGroups)
    await insertMealsForTemplate(client, templateId, data.meals)

    const full = await fetchTemplateFull(templateId, client)
    return full!
  })
}

export async function deleteNutritionTemplate(
  trainerProfileId: string,
  templateId: string
) {
  const check = await pool.query(
    `SELECT "id" FROM "NutritionTemplate" WHERE "id" = $1 AND ("trainerId" = $2 OR "isGlobal" = true) LIMIT 1`,
    [templateId, trainerProfileId]
  )
  if (!check.rowCount || check.rowCount === 0) return false
  await pool.query(`DELETE FROM "NutritionTemplate" WHERE "id" = $1`, [templateId])
  return true
}

export function getTemplatesForTrainer(trainerProfileId: string) {
  return withCache(
    async () => {
      const tmplRes = await pool.query(
        `SELECT "id", "name", "isGlobal", "calories", "proteinGrams", "carbsGrams", "fatsGrams", "createdAt", "updatedAt"
         FROM "NutritionTemplate"
         WHERE "trainerId" = $1 OR "isGlobal" = true
         ORDER BY "updatedAt" DESC`,
        [trainerProfileId]
      )
      const templates = tmplRes.rows as Array<{
        id: string
        name: string
        isGlobal: boolean
        calories: number | null
        proteinGrams: number | null
        carbsGrams: number | null
        fatsGrams: number | null
        createdAt: Date
        updatedAt: Date
      }>

      const rows: Array<{
        id: string
        name: string
        isGlobal: boolean
        calories: number | null
        proteinGrams: number | null
        carbsGrams: number | null
        fatsGrams: number | null
        createdAt: Date
        updatedAt: Date
        _count: { meals: number }
      }> = []

      for (const tpl of templates) {
        const countRes = await pool.query(
          `SELECT COUNT(*)::int AS count FROM "Meal" WHERE "templateId" = $1`,
          [tpl.id]
        )
        const count = (countRes.rows[0] as { count: number }).count
        rows.push({
          ...tpl,
          _count: { meals: count },
        })
      }

      return rows.map((row) => ({
        ...row,
        createdAt: (row.createdAt as Date).toISOString(),
        updatedAt: (row.updatedAt as Date).toISOString(),
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
  const check = await pool.query(
    `SELECT "id", "trainerId", "isGlobal" FROM "NutritionTemplate" WHERE "id" = $1 AND ("trainerId" = $2 OR "isGlobal" = true) LIMIT 1`,
    [templateId, trainerProfileId]
  )
  if (!check.rowCount || check.rowCount === 0) return null
  const row = check.rows[0] as { trainerId: string | null; isGlobal: boolean }
  if (!row.isGlobal && row.trainerId !== trainerProfileId) return null

  const full = await fetchTemplateFull(templateId, pool)
  return full
}

/* ------------------------------------------------------------------ */
/* DEEP COPY: TEMPLATE -> PLAN SNAPSHOT                                */
/* ------------------------------------------------------------------ */

async function copyTemplateToPlanInTx(
  client: PgClient,
  templateId: string,
  planId: string
) {
  const template = await fetchTemplateFull(templateId, client)
  if (!template) throw new Error("TEMPLATE_NOT_FOUND")

  await client.query(`DELETE FROM "Meal" WHERE "planId" = $1`, [planId])
  await client.query(`DELETE FROM "SubstituteGroup" WHERE "planId" = $1`, [planId])
  await client.query(`DELETE FROM "SupplementDef" WHERE "planId" = $1`, [planId])

  const tpl = template as unknown as {
    id: string
    calories: number | null
    proteinGrams: number | null
    carbsGrams: number | null
    fatsGrams: number | null
    waterLiters: number | null
    coachMessage: string | null
    guidelines: string[]
    avoidFoods: string[]
    recommendedFoods: string[]
    supplementDefs: Array<{ name: string; nameAr: string | null; definition: string | null; definitionAr: string | null; importance: string | null; importanceAr: string | null; order: number }>
    substituteGroups: Array<{ category: string; caloriesLabel: string | null; order: number; items: Array<{ name: string; nameAr: string | null; amount: number | null; unit: string; order: number }> }>
    meals: Array<{ kind: string; name: string; nameAr: string | null; order: number; items: Array<{ groupNumber: number; foodName: string; foodNameAr: string | null; amount: number | null; unit: string; calories: number | null; order: number }> }>
  }

  await client.query(
    `UPDATE "ClientNutritionPlan" SET "templateId" = $1, "calories" = $2, "proteinGrams" = $3, "carbsGrams" = $4, "fatsGrams" = $5, "waterLiters" = $6, "coachMessage" = $7, "guidelines" = $8, "avoidFoods" = $9, "recommendedFoods" = $10, "updatedAt" = NOW() WHERE "id" = $11`,
    [
      tpl.id,
      tpl.calories,
      tpl.proteinGrams,
      tpl.carbsGrams,
      tpl.fatsGrams,
      tpl.waterLiters,
      tpl.coachMessage,
      [...tpl.guidelines],
      [...tpl.avoidFoods],
      [...tpl.recommendedFoods],
      planId,
    ]
  )

  // supplementDefs
  const supDefs = tpl.supplementDefs.map((def, idx) => ({
    name: def.name,
    nameAr: def.nameAr,
    definition: def.definition,
    definitionAr: def.definitionAr,
    importance: def.importance,
    importanceAr: def.importanceAr,
    order: idx + 1,
  }))
  await insertSupplementDefsForPlan(client, planId, supDefs)

  // substituteGroups with re-ordered indices
  const groups = tpl.substituteGroups.map((group, groupIndex) => ({
    category: group.category,
    caloriesLabel: group.caloriesLabel,
    order: groupIndex + 1,
    items: group.items.map((item, itemIndex) => ({
      name: item.name,
      nameAr: item.nameAr,
      amount: item.amount,
      unit: item.unit,
      order: itemIndex + 1,
    })),
  }))
  await insertSubstituteGroupsForPlan(client, planId, groups)

  // meals
  const meals = tpl.meals.map((meal, mealIndex) => ({
    kind: meal.kind,
    name: meal.name,
    nameAr: meal.nameAr,
    order: mealIndex + 1,
    items: meal.items.map((item, itemIndex) => ({
      groupNumber: item.groupNumber,
      foodName: item.foodName,
      foodNameAr: item.foodNameAr,
      amount: item.amount,
      unit: item.unit,
      calories: item.calories,
      order: itemIndex + 1,
    })),
  }))
  await insertMealsForPlan(client, planId, meals)
}

export async function assignTemplateToClients(
  trainerProfileId: string,
  templateId: string,
  clientIds: string[]
): Promise<number> {
  const tmplCheck = await pool.query(
    `SELECT "id" FROM "NutritionTemplate" WHERE "id" = $1 AND ("trainerId" = $2 OR "isGlobal" = true) LIMIT 1`,
    [templateId, trainerProfileId]
  )
  if (!tmplCheck.rowCount || tmplCheck.rowCount === 0) throw new Error("TEMPLATE_NOT_FOUND")

  if (clientIds.length === 0) return 0

  const placeholders = clientIds.map((_, i) => `$${i + 2}`).join(",")
  const clientsRes = await pool.query(
    `SELECT "id" FROM "Client" WHERE "id" IN (${placeholders}) AND "trainerId" = $1`,
    [trainerProfileId, ...clientIds]
  )
  const clients = clientsRes.rows as Array<{ id: string }>

  let assigned = 0
  for (const client of clients) {
    await withTransaction(async (tx) => {
      await tx.query(
        `UPDATE "ClientNutritionPlan" SET "status" = $1::"PlanStatus", "endDate" = NOW(), "updatedAt" = NOW() WHERE "clientId" = $2 AND "status" = $3::"PlanStatus"`,
        [PlanStatus.COMPLETED, client.id, PlanStatus.ACTIVE]
      )

      const planId = generateId()
      const now = new Date()
      await tx.query(
        `INSERT INTO "ClientNutritionPlan" ("id", "clientId", "templateId", "status", "startDate", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4::"PlanStatus", $5, $6, $6)`,
        [planId, client.id, templateId, PlanStatus.ACTIVE, now, now]
      )

      await copyTemplateToPlanInTx(tx, templateId, planId)
    })
    assigned += 1
  }

  return assigned
}

export async function refreshPlanFromTemplate(
  trainerProfileId: string,
  planId: string
): Promise<boolean> {
  const planRes = await pool.query(
    `SELECT cnp."id", cnp."templateId"
     FROM "ClientNutritionPlan" cnp
     JOIN "Client" c ON cnp."clientId" = c."id"
     WHERE cnp."id" = $1 AND c."trainerId" = $2 LIMIT 1`,
    [planId, trainerProfileId]
  )
  if (!planRes.rowCount || planRes.rowCount === 0) return false
  const plan = planRes.rows[0] as { id: string; templateId: string | null }
  if (!plan.templateId) return false

  await withTransaction(async (tx) => {
    await copyTemplateToPlanInTx(tx, plan.templateId!, plan.id)
  })
  return true
}

/* ------------------------------------------------------------------ */
/* PLAN READ/WRITE                                                     */
/* ------------------------------------------------------------------ */

export async function getActivePlanFull(clientId: string) {
  const planRes = await pool.query(
    `SELECT "id" FROM "ClientNutritionPlan" WHERE "clientId" = $1 AND "status" = $2::"PlanStatus" ORDER BY "createdAt" DESC LIMIT 1`,
    [clientId, PlanStatus.ACTIVE]
  )
  if (!planRes.rowCount || planRes.rowCount === 0) return null
  const planId = (planRes.rows[0] as { id: string }).id
  const full = await fetchPlanFull(planId, pool)
  return full
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
  const res = await pool.query(
    `SELECT "trainerId" FROM "Client" WHERE "id" = $1 LIMIT 1`,
    [clientId]
  )
  return (res.rows[0] as { trainerId: string } | undefined)?.trainerId ?? null
}

export async function savePlanContent(
  trainerProfileId: string,
  planId: string,
  data: NutritionContentInput
) {
  const planCheck = await pool.query(
    `SELECT cnp."id", cnp."clientId"
     FROM "ClientNutritionPlan" cnp
     JOIN "Client" c ON cnp."clientId" = c."id"
     WHERE cnp."id" = $1 AND c."trainerId" = $2 LIMIT 1`,
    [planId, trainerProfileId]
  )
  if (!planCheck.rowCount || planCheck.rowCount === 0) return null

  return withTransaction(async (client) => {
    await client.query(`DELETE FROM "Meal" WHERE "planId" = $1`, [planId])
    await client.query(`DELETE FROM "SubstituteGroup" WHERE "planId" = $1`, [planId])
    await client.query(`DELETE FROM "SupplementDef" WHERE "planId" = $1`, [planId])

    await client.query(
      `UPDATE "ClientNutritionPlan" SET "calories" = $1, "proteinGrams" = $2, "carbsGrams" = $3, "fatsGrams" = $4, "waterLiters" = $5, "coachMessage" = $6, "guidelines" = $7, "avoidFoods" = $8, "recommendedFoods" = $9, "updatedAt" = NOW() WHERE "id" = $10`,
      [
        data.calories ?? null,
        data.proteinGrams ?? null,
        data.carbsGrams ?? null,
        data.fatsGrams ?? null,
        data.waterLiters ?? null,
        data.coachMessage ?? null,
        data.guidelines ?? [],
        data.avoidFoods ?? [],
        data.recommendedFoods ?? [],
        planId,
      ]
    )

    const supDefsForPlan = data.supplementDefs.map((def, idx) => ({
      name: def.name,
      nameAr: def.nameAr ?? null,
      definition: def.definition ?? null,
      definitionAr: def.definitionAr ?? null,
      importance: def.importance ?? null,
      importanceAr: def.importanceAr ?? null,
      order: idx + 1,
    }))
    await insertSupplementDefsForPlan(client, planId, supDefsForPlan)

    const groupsForPlan = data.substituteGroups.map((group, gIdx) => ({
      category: group.category,
      caloriesLabel: group.caloriesLabel ?? null,
      order: gIdx + 1,
      items: group.items.map((item, iIdx) => ({
        name: item.name,
        nameAr: item.nameAr ?? null,
        amount: item.amount ?? null,
        unit: item.unit,
        order: iIdx + 1,
      })),
    }))
    await insertSubstituteGroupsForPlan(client, planId, groupsForPlan)

    await insertMealsForPlan(
      client,
      planId,
      data.meals.map((meal, mIdx) => ({
        kind: meal.kind,
        name: meal.name,
        nameAr: meal.nameAr ?? null,
        order: mIdx + 1,
        items: meal.items.map((item, iIdx) => ({
          groupNumber: item.groupNumber,
          foodName: item.foodName,
          foodNameAr: item.foodNameAr ?? null,
          amount: item.amount ?? null,
          unit: item.unit,
          calories: item.calories ?? null,
          order: iIdx + 1,
        })),
      }))
    )

    const full = await fetchPlanFull(planId, client)
    return full!
  })
}

export async function getPlanHistory(clientId: string) {
  const res = await pool.query(
    `SELECT cnp."id", cnp."status", cnp."startDate", cnp."endDate", cnp."createdAt", cnp."calories", cnp."templateId", nt."name" AS "templateName"
     FROM "ClientNutritionPlan" cnp
     LEFT JOIN "NutritionTemplate" nt ON cnp."templateId" = nt."id"
     WHERE cnp."clientId" = $1
     ORDER BY cnp."createdAt" DESC
     LIMIT 10`,
    [clientId]
  )
  return (res.rows as Array<{
    id: string
    status: string
    startDate: Date | null
    endDate: Date | null
    createdAt: Date
    calories: number | null
    templateId: string | null
    templateName: string | null
  }>).map((row) => ({
    id: row.id,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
    calories: row.calories,
    template: row.templateName ? { name: row.templateName } : null,
  }))
}

/* ------------------------------------------------------------------ */
/* MEAL CHOICES                                                        */
/* ------------------------------------------------------------------ */

function todayMidnight(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

export async function toggleMealChoice(clientId: string, mealItemId: string) {
  const itemCheck = await pool.query(
    `SELECT mi."id"
     FROM "MealItem" mi
     JOIN "Meal" m ON mi."mealId" = m."id"
     JOIN "ClientNutritionPlan" cnp ON m."planId" = cnp."id"
     WHERE mi."id" = $1 AND cnp."clientId" = $2 AND cnp."status" = $3::"PlanStatus"
     LIMIT 1`,
    [mealItemId, clientId, PlanStatus.ACTIVE]
  )
  if (!itemCheck.rowCount || itemCheck.rowCount === 0) return null

  const date = todayMidnight()
  const existing = await pool.query(
    `SELECT "id" FROM "MealChoice" WHERE "clientId" = $1 AND "mealItemId" = $2 AND "date" = $3 LIMIT 1`,
    [clientId, mealItemId, date]
  )

  if (existing.rowCount && existing.rowCount > 0) {
    await pool.query(`DELETE FROM "MealChoice" WHERE "id" = $1`, [(existing.rows[0] as { id: string }).id])
    return { chosen: false }
  }

  const id = generateId()
  await pool.query(
    `INSERT INTO "MealChoice" ("id", "clientId", "mealItemId", "date", "createdAt")
     VALUES ($1, $2, $3, $4, NOW())`,
    [id, clientId, mealItemId, date]
  )
  return { chosen: true }
}

export async function getTodayMealChoices(clientId: string) {
  const date = todayMidnight()
  const res = await pool.query(
    `SELECT "mealItemId" FROM "MealChoice" WHERE "clientId" = $1 AND "date" = $2`,
    [clientId, date]
  )
  return (res.rows as Array<{ mealItemId: string }>).map((r) => r.mealItemId)
}
