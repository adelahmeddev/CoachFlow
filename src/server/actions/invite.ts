"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  createClientInvite,
  submitClientBasicInfo,
  submitClientAccountInfo,
  getOrCreateInviteSlug,
  regenerateInviteSlug,
  submitJoinClient,
} from "@/server/services/invite.service"
import { getInviteUrl } from "@/lib/app-url"
import { getJoinUrl } from "@/lib/app-url"

export async function generateInviteAction() {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    return { ok: false as const, error: "Unauthorized — missing trainer profile. Please log out and log in again." }
  }

  // Defensive: verify profile still exists (handles DB reset / stale JWT race even after jwt healing)
  const { prisma } = await import("@/lib/prisma")
  let trainerProfileId = session.user.trainerProfileId
  const profile = await prisma.trainerProfile.findUnique({
    where: { id: trainerProfileId },
    select: { id: true },
  })
  if (!profile) {
    // Try to heal by userId lookup (user may have a new profile after DB reset)
    const byUser = await prisma.trainerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (byUser) {
      trainerProfileId = byUser.id
    } else {
      // Last resort: auto-create (should have been done in auth.ts jwt, but handle here too)
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { username: true, phone: true },
        })
        const created = await prisma.trainerProfile.create({
          data: {
            userId: session.user.id,
            fullName: (user as unknown as { username?: string })?.username ?? user?.phone ?? "Trainer",
            phone: user?.phone ?? "",
          },
        })
        trainerProfileId = created.id
      } catch {
        return {
          ok: false as const,
          error: "Your trainer profile is missing. Please log out and log in again to restore it.",
        }
      }
    }
  }

  try {
    const client = await createClientInvite(trainerProfileId)

    revalidatePath("/onboarding")
    revalidatePath("/clients")
    revalidatePath("/dashboard")
    invalidate([
      `trainer:${trainerProfileId}:clients`,
      `trainer:${trainerProfileId}:dashboard`,
    ])

    return {
      ok: true as const,
      clientId: client.id,
      invitePath: `/invite/${client.inviteToken}`,
      inviteUrl: getInviteUrl(client.inviteToken!),
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create invite. Please try again."
    // Return as ok:false instead of throwing 500, so UI can show toast
    return { ok: false as const, error: message }
  }
}

export async function submitClientBasicInfoAction(
  token: string,
  input: unknown
) {
  return submitClientBasicInfo(token, input)
}

export async function submitClientAccountInfoAction(
  token: string,
  input: unknown
) {
  return submitClientAccountInfo(token, input)
}

export async function getJoinLinkAction() {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "TRAINER" || !session.user.trainerProfileId) {
    return { ok: false as const, error: "Unauthorized" }
  }
  let trainerProfileId = session.user.trainerProfileId
  const { prisma } = await import("@/lib/prisma")
  const profile = await prisma.trainerProfile.findUnique({ where: { id: trainerProfileId }, select: { id: true } })
  if (!profile) {
    const byUser = await prisma.trainerProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
    if (byUser) trainerProfileId = byUser.id
    else return { ok: false as const, error: "Trainer profile not found" }
  }
  const slug = await getOrCreateInviteSlug(trainerProfileId)
  return { ok: true as const, slug, joinPath: `/join/${slug}`, joinUrl: getJoinUrl(slug) }
}

export async function regenerateJoinLinkAction() {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "TRAINER" || !session.user.trainerProfileId) {
    return { ok: false as const, error: "Unauthorized" }
  }
  let trainerProfileId = session.user.trainerProfileId
  const { prisma } = await import("@/lib/prisma")
  const profile = await prisma.trainerProfile.findUnique({ where: { id: trainerProfileId }, select: { id: true } })
  if (!profile) {
    const byUser = await prisma.trainerProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
    if (byUser) trainerProfileId = byUser.id
    else return { ok: false as const, error: "Trainer profile not found" }
  }
  const slug = await regenerateInviteSlug(trainerProfileId)
  revalidatePath("/onboarding")
  return { ok: true as const, slug, joinPath: `/join/${slug}`, joinUrl: getJoinUrl(slug) }
}

export async function submitJoinClientAction(slug: string, input: unknown) {
  return submitJoinClient(slug, input)
}
