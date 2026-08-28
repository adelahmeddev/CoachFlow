"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  trainingSplitTemplateSchema,
  type TrainingSplitTemplateInput,
} from "@/lib/validations/training-split-template"
import {
  createTrainingSplitTemplate,
  deleteTrainingSplitTemplate,
  duplicateTrainingSplitTemplate,
  updateTrainingSplitTemplate,
} from "@/server/services/training-split-template.service"

function isAuthorized(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  return Boolean(
    session?.user &&
      session.user.role === "TRAINER" &&
      session.user.trainerProfileId
  )
}

export async function createTrainingSplitTemplateAction(input: unknown) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = trainingSplitTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const template = await createTrainingSplitTemplate(
    trainerProfileId,
    parsed.data as TrainingSplitTemplateInput
  )
  if (!template) {
    return { ok: false as const, error: "Failed to create template" }
  }

  revalidatePath("/training-split-templates")
  invalidate(["templates", `trainer:${trainerProfileId}:templates`])
  return { ok: true as const, templateId: template.id }
}

export async function updateTrainingSplitTemplateAction(
  templateId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = trainingSplitTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const template = await updateTrainingSplitTemplate(
    templateId,
    trainerProfileId,
    parsed.data as TrainingSplitTemplateInput
  )
  if (!template) {
    return { ok: false as const, error: "Template not found" }
  }

  revalidatePath("/training-split-templates")
  invalidate(["templates", `trainer:${trainerProfileId}:templates`])
  return { ok: true as const }
}

export async function duplicateTrainingSplitTemplateAction(templateId: string) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const template = await duplicateTrainingSplitTemplate(
    templateId,
    trainerProfileId
  )
  if (!template) {
    return { ok: false as const, error: "Template not found" }
  }

  revalidatePath("/training-split-templates")
  invalidate(["templates", `trainer:${trainerProfileId}:templates`])
  return { ok: true as const, templateId: template.id }
}

export async function deleteTrainingSplitTemplateAction(templateId: string) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const deleted = await deleteTrainingSplitTemplate(
    templateId,
    trainerProfileId
  )
  if (!deleted) {
    return { ok: false as const, error: "Template not found" }
  }

  revalidatePath("/training-split-templates")
  invalidate(["templates", `trainer:${trainerProfileId}:templates`])
  return { ok: true as const }
}
