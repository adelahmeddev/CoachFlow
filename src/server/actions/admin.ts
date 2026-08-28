"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import { createTrainer } from "@/server/services/admin.service"

export async function adminCreateTrainerAction(input: unknown) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false as const, code: "UNAUTHORIZED" as const }
  }

  const result = await createTrainer(input)
  if (!result.ok) {
    if ("fieldErrors" in result) {
      return { ok: false as const, fieldErrors: result.fieldErrors }
    }
    return { ok: false as const, code: result.code }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/trainers")
  invalidate(["admin:stats"])
  return { ok: true as const, userId: result.userId }
}