"use server"

import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/server/auth"
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config"
import {
  businessSchema,
  notificationsSchema,
  preferencesSchema,
  profileSchema,
  securitySchema,
} from "@/lib/validations/settings"

type ActionResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; error?: string }

type PreferencesResult =
  | { ok: true; language?: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; error?: string }

function isAuthorized(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  return Boolean(
    session?.user &&
      session.user.role === "TRAINER" &&
      session.user.trainerProfileId
  )
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const userId = session!.user!.id
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { fullName, phone } = parsed.data

  const existing = await prisma.user.findFirst({
    where: { phone, id: { not: userId } },
  })
  if (existing) {
    return { ok: false, error: "PHONE_EXISTS" }
  }

  await prisma.trainerProfile.update({
    where: { id: trainerProfileId },
    data: { fullName, phone },
  })

  revalidatePath("/settings")
  return { ok: true }
}

export async function updateSecurityAction(
  input: unknown
): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const userId = session!.user!.id

  const parsed = securitySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const passwordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  )
  if (!passwordValid) {
    return { ok: false, error: "WRONG_CURRENT_PASSWORD" }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  return { ok: true }
}

export async function updatePreferencesAction(
  input: unknown
): Promise<PreferencesResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = preferencesSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { language, units, weekStartDay, timezone } = parsed.data

  await prisma.trainerProfile.update({
    where: { id: trainerProfileId },
    data: {
      units,
      weekStartDay,
      timezone: timezone || null,
    },
  })

  if (isLocale(language)) {
    const cookieStore = await cookies()
    cookieStore.set(LOCALE_COOKIE, language, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  }

  revalidatePath("/settings")
  return { ok: true, language }
}

export async function updateNotificationsAction(
  input: unknown
): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = notificationsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await prisma.trainerProfile.update({
    where: { id: trainerProfileId },
    data: parsed.data,
  })

  revalidatePath("/settings")
  return { ok: true }
}

export async function updateBusinessAction(
  input: unknown
): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = businessSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await prisma.trainerProfile.update({
    where: { id: trainerProfileId },
    data: { businessName: parsed.data.businessName || null },
  })

  revalidatePath("/settings")
  return { ok: true }
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const userId = session!.user!.id

  try {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.trainerProfile.findUnique({
        where: { userId },
        select: { id: true },
      })
      if (profile) {
        await tx.client.deleteMany({ where: { trainerId: profile.id } })
      }
      await tx.user.delete({ where: { id: userId } })
    })

    const cookieStore = await cookies()
    cookieStore.set("next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
    })
  } catch {
    return { ok: false, error: "DELETE_FAILED" }
  }

  redirect("/login")
}
