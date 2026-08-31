"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  nutritionContentSchema,
  assignTemplateSchema,
  type NutritionContentInput,
} from "@/lib/validations/nutrition"
import {
  createNutritionTemplate,
  updateNutritionTemplate,
  deleteNutritionTemplate,
  getTemplatesForTrainer,
  assignTemplateToClients,
  refreshPlanFromTemplate,
  savePlanContent,
  toggleMealChoice,
  getOwnedClientTrainerId,
} from "@/server/services/nutrition.service"

type Session = Awaited<ReturnType<typeof getCurrentSession>>

function requireTrainer(session: Session): string | null {
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    return null
  }
  return session.user.trainerProfileId
}

async function requirePlanTrainer(clientId: string): Promise<string | null> {
  const session = await getCurrentSession()
  const trainerId = requireTrainer(session)
  if (!trainerId) return null
  const ownerTrainerId = await getOwnedClientTrainerId(clientId)
  if (ownerTrainerId !== trainerId) return null
  return trainerId
}

function parseContent(input: unknown):
  | { ok: true; data: NutritionContentInput }
  | { ok: false; fieldErrors: Record<string, string[]> } {
  const parsed = nutritionContentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }
  return { ok: true, data: parsed.data }
}

export async function createNutritionTemplateAction(input: unknown) {
  const session = await getCurrentSession()
  const trainerProfileId = requireTrainer(session)
  if (!trainerProfileId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const content = parseContent(input)
  if (!content.ok) {
    return { ok: false as const, fieldErrors: content.fieldErrors }
  }

  const template = await createNutritionTemplate(
    trainerProfileId,
    content.data
  )

  invalidate(["templates", `trainer:${trainerProfileId}:templates`])
  revalidatePath("/nutrition-templates")
  return { ok: true as const, id: template.id }
}

export async function updateNutritionTemplateAction(
  templateId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  const trainerProfileId = requireTrainer(session)
  if (!trainerProfileId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const content = parseContent(input)
  if (!content.ok) {
    return { ok: false as const, fieldErrors: content.fieldErrors }
  }

  const template = await updateNutritionTemplate(
    trainerProfileId,
    templateId,
    content.data
  )
  if (!template) {
    return { ok: false as const, error: "TEMPLATE_NOT_FOUND" }
  }

  invalidate(["templates", `trainer:${trainerProfileId}:templates`])
  revalidatePath("/nutrition-templates")
  return { ok: true as const, id: template.id }
}

export async function deleteNutritionTemplateAction(templateId: string) {
  const session = await getCurrentSession()
  const trainerProfileId = requireTrainer(session)
  if (!trainerProfileId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const deleted = await deleteNutritionTemplate(trainerProfileId, templateId)
  if (!deleted) {
    return { ok: false as const, error: "TEMPLATE_NOT_FOUND" }
  }

  invalidate(["templates", `trainer:${trainerProfileId}:templates`])
  revalidatePath("/nutrition-templates")
  return { ok: true as const }
}

export async function assignTemplateAction(
  templateId: string,
  clientIds: string[]
) {
  const session = await getCurrentSession()
  const trainerProfileId = requireTrainer(session)
  if (!trainerProfileId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const parsed = assignTemplateSchema.safeParse({ clientIds })
  if (!parsed.success) {
    return { ok: false as const, error: "INVALID_CLIENTS" }
  }

  try {
    const count = await assignTemplateToClients(
      trainerProfileId,
      templateId,
      parsed.data.clientIds
    )
    for (const clientId of parsed.data.clientIds) {
      invalidate([`client:${clientId}:nutrition`, `client:${clientId}:profile`])
      revalidatePath(`/clients/${clientId}?tab=nutrition`)
      revalidatePath("/client/nutrition")
    }
    revalidatePath("/clients")
    return { ok: true as const, count }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      (error as { message?: string }).message === "TEMPLATE_NOT_FOUND"
    ) {
      return { ok: false as const, error: "TEMPLATE_NOT_FOUND" }
    }
    throw error
  }
}

export async function refreshPlanFromTemplateAction(planId: string, clientId: string) {
  const trainerProfileId = await requirePlanTrainer(clientId)
  if (!trainerProfileId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const updated = await refreshPlanFromTemplate(trainerProfileId, planId)
  if (!updated) {
    return { ok: false as const, error: "PLAN_NOT_FOUND" }
  }

  invalidate([
    `client:${clientId}:nutrition`,
    `client:${clientId}:profile`,
  ])
  revalidatePath(`/clients/${clientId}?tab=nutrition`)
  revalidatePath("/client/nutrition")
  return { ok: true as const }
}

export async function savePlanContentAction(
  planId: string,
  clientId: string,
  input: unknown
) {
  const trainerProfileId = await requirePlanTrainer(clientId)
  if (!trainerProfileId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const content = parseContent(input)
  if (!content.ok) {
    return { ok: false as const, fieldErrors: content.fieldErrors }
  }

  const plan = await savePlanContent(trainerProfileId, planId, content.data)
  if (!plan) {
    return { ok: false as const, error: "PLAN_NOT_FOUND" }
  }

  invalidate([
    `client:${clientId}:nutrition`,
    `client:${clientId}:profile`,
  ])
  revalidatePath(`/clients/${clientId}?tab=nutrition`)
  revalidatePath("/client/nutrition")
  return { ok: true as const }
}

export async function toggleMealChoiceAction(mealItemId: string) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "CLIENT") {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }
  const clientId = session.user.clientProfileId
  if (!clientId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const result = await toggleMealChoice(clientId, mealItemId)
  if (!result) {
    return { ok: false as const, error: "ITEM_NOT_FOUND" }
  }

  invalidate([`client:${clientId}:nutrition`])
  return { ok: true as const, chosen: result.chosen }
}
