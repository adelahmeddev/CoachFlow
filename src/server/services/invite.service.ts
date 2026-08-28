import { nanoid } from "nanoid"
import { prisma } from "@/lib/prisma"
import { ClientStatus, Goal } from "@/generated/prisma/enums"
import {
  inviteBasicInfoSchema,
  inviteAccountSchema,
  joinClientSchema,
} from "@/lib/validations/invite"
import { hashPassword } from "@/lib/auth"
import bcrypt from "bcryptjs"

const DEFAULT_INVITE_EXPIRY_DAYS = 7

export type PublicInviteResult =
  | {
      valid: true
      clientId: string
      trainerName: string
      phone: string | null
      basicInfoCompletedAt: Date | null
      hasAccount: boolean
    }
  | { valid: false; reason: "not_found" | "expired" | "completed" }

const STATUS_MAP: Record<"NEW" | "ACTIVE" | "PAUSED", ClientStatus> = {
  NEW: ClientStatus.PENDING_ASSESSMENT,
  ACTIVE: ClientStatus.ACTIVE,
  PAUSED: ClientStatus.PAUSED,
}

async function ensureTrainerProfile(trainerProfileId: string): Promise<string> {
  const existing = await prisma.trainerProfile.findUnique({
    where: { id: trainerProfileId },
    select: { id: true },
  })
  if (existing) return existing.id

  // Try to resolve via User -> TrainerProfile (handles stale JWT after DB reset)
  // We search for any TrainerProfile that might have been recreated, or find User by profile id lookup
  // Since we only have profileId, we try to find the User that owns this stale id
  // Fallback: search for user that has no profile and create one
  // The most reliable is to find User by finding TrainerProfile with this id - if not found, the id is orphan
  // We cannot resolve user from stale id alone, so we throw a clear error that will trigger re-auth
  throw new Error(`Trainer profile not found: ${trainerProfileId}. Please log out and log in again.`)
}

export async function createClientInvite(
  trainerProfileId: string,
  expiresInDays?: number | null
) {
  if (!trainerProfileId || typeof trainerProfileId !== "string") {
    throw new Error("Missing trainer profile. Please log out and log in again.")
  }

  // Validate FK exists before attempting create to give clear error instead of P2003
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { id: trainerProfileId },
    select: { id: true },
  })

  if (!trainerProfile) {
    // Try to give a more helpful error - the JWT is stale
    throw new Error(
      `Trainer profile not found (${trainerProfileId}). Your session is stale after a database reset. Please log out and log in again to create a new profile.`
    )
  }

  const inviteToken = nanoid(24)
  const inviteExpiresAt = new Date(
    Date.now() +
      (expiresInDays ?? DEFAULT_INVITE_EXPIRY_DAYS) * 24 * 60 * 60 * 1000
  )

  try {
    return await prisma.client.create({
      data: {
        trainerId: trainerProfileId,
        inviteToken,
        inviteExpiresAt,
        status: ClientStatus.INVITED,
      },
    })
  } catch (error) {
    // Catch FK violation (P2003) that could still happen due to race/deletion between check and create
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2003"
    ) {
      throw new Error(
        "Failed to create invite: trainer profile no longer exists. Please log out and log in again."
      )
    }
    throw error
  }
}

export async function getTrainerInvites(trainerProfileId: string) {
  return prisma.client.findMany({
    where: { trainerId: trainerProfileId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      status: true,
      inviteToken: true,
      inviteExpiresAt: true,
      basicInfoCompletedAt: true,
      createdAt: true,
    },
  })
}

export async function getPublicClientByInviteToken(
  token: string
): Promise<PublicInviteResult> {
  const client = await prisma.client.findUnique({
    where: { inviteToken: token },
    select: {
      id: true,
      inviteExpiresAt: true,
      basicInfoCompletedAt: true,
      userId: true,
      phone: true,
      trainer: { select: { fullName: true } },
    },
  })

  if (!client) {
    return { valid: false, reason: "not_found" }
  }
  if (client.inviteExpiresAt && client.inviteExpiresAt < new Date()) {
    return { valid: false, reason: "expired" }
  }
  if (client.userId) {
    return { valid: false, reason: "completed" }
  }
  return {
    valid: true,
    clientId: client.id,
    trainerName: client.trainer.fullName,
    phone: client.phone,
    basicInfoCompletedAt: client.basicInfoCompletedAt,
    hasAccount: false,
  }
}

export type SubmitInviteResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

export async function submitClientBasicInfo(
  token: string,
  input: unknown
): Promise<SubmitInviteResult> {
  const invite = await getPublicClientByInviteToken(token)
  if (!invite.valid) {
    return { ok: false, error: "This invite is invalid or has expired." }
  }

  const parsed = inviteBasicInfoSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { fullName, birthDate, phone, goal } = parsed.data as typeof parsed.data & { status?: string }
  // Status field removed from invite form — default to PENDING_ASSESSMENT.
  // Keep backward compat: if old client still sends status, map it; otherwise default.
  const statusValue =
    (parsed.data as unknown as { status?: string }).status != null
      ? STATUS_MAP[(parsed.data as unknown as { status: keyof typeof STATUS_MAP }).status] ?? ClientStatus.PENDING_ASSESSMENT
      : ClientStatus.PENDING_ASSESSMENT

  await prisma.client.update({
    where: { id: invite.clientId },
    data: {
      fullName,
      birthDate: new Date(`${birthDate}T00:00:00Z`),
      phone,
      goal: goal as Goal,
      status: statusValue,
      basicInfoCompletedAt: new Date(),
    },
  })

  return { ok: true }
}

export async function getOrCreateInviteSlug(trainerProfileId: string): Promise<string> {
  const profile = await prisma.trainerProfile.findUnique({
    where: { id: trainerProfileId },
    select: { inviteSlug: true },
  })
  if (!profile) throw new Error(`Trainer profile not found: ${trainerProfileId}`)
  if (profile.inviteSlug) return profile.inviteSlug
  const slug = nanoid(10)
  const updated = await prisma.trainerProfile.update({
    where: { id: trainerProfileId },
    data: { inviteSlug: slug, inviteSlugCreatedAt: new Date(), previousInviteSlug: null, previousInviteSlugExpiresAt: null },
    select: { inviteSlug: true },
  })
  return updated.inviteSlug!
}

export async function regenerateInviteSlug(trainerProfileId: string): Promise<string> {
  const profile = await prisma.trainerProfile.findUnique({
    where: { id: trainerProfileId },
    select: { inviteSlug: true },
  })
  if (!profile) throw new Error(`Trainer profile not found: ${trainerProfileId}`)
  const newSlug = nanoid(10)
  const graceExpiresAt = new Date(Date.now() + 5 * 60 * 1000)
  const updated = await prisma.trainerProfile.update({
    where: { id: trainerProfileId },
    data: {
      previousInviteSlug: profile.inviteSlug,
      previousInviteSlugExpiresAt: profile.inviteSlug ? graceExpiresAt : null,
      inviteSlug: newSlug,
      inviteSlugCreatedAt: new Date(),
    },
    select: { inviteSlug: true },
  })
  return updated.inviteSlug!
}

export async function getTrainerByJoinSlug(slug: string) {
  const now = new Date()
  const byCurrent = await prisma.trainerProfile.findUnique({
    where: { inviteSlug: slug },
    select: { id: true, fullName: true, inviteSlug: true },
  })
  if (byCurrent) return { trainerProfileId: byCurrent.id, trainerName: byCurrent.fullName, isGrace: false }
  const byPrevious = await prisma.trainerProfile.findFirst({
    where: { previousInviteSlug: slug, previousInviteSlugExpiresAt: { gt: now } },
    select: { id: true, fullName: true },
  })
  if (byPrevious) return { trainerProfileId: byPrevious.id, trainerName: byPrevious.fullName, isGrace: true }
  return null
}

export async function submitJoinClient(
  slug: string,
  input: unknown
): Promise<SubmitInviteResult & { clientId?: string }> {
  const trainer = await getTrainerByJoinSlug(slug)
  if (!trainer) {
    return { ok: false, error: "This invite link is invalid or has expired." }
  }
  const parsed = joinClientSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }
  const { fullName, phone, goal, password } = parsed.data
  const existing = await prisma.client.findFirst({
    where: { trainerId: trainer.trainerProfileId, phone },
    select: { id: true },
  })
  if (existing) {
    return { ok: false, error: "A client with this phone number already exists for this trainer.", fieldErrors: { phone: ["Phone already registered"] } }
  }
  const passwordHash = await hashPassword(password)
  try {
    const client = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: phone,
          phone,
          passwordHash,
          role: "CLIENT" as const,
        },
      })
      return tx.client.create({
        data: {
          trainerId: trainer.trainerProfileId,
          fullName,
          phone,
          goal: goal as Goal,
          status: ClientStatus.PENDING_ASSESSMENT,
          basicInfoCompletedAt: new Date(),
          userId: user.id,
        },
      })
    })
    return { ok: true, clientId: client.id }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        error: "An account with this phone number already exists.",
        fieldErrors: { phone: ["Phone already registered"] },
      }
    }
    throw error
  }
}

export async function submitClientAccountInfo(
  token: string,
  input: unknown
): Promise<SubmitInviteResult> {
  const invite = await getPublicClientByInviteToken(token)
  if (!invite.valid) {
    return { ok: false, error: "This invite is invalid or has expired." }
  }

  if (!invite.basicInfoCompletedAt) {
    // Client must complete basic info before setting up the account password
    return { ok: false, error: "Please complete your basic information first." }
  }

  if (invite.hasAccount) {
    return { ok: false, error: "Account already setup. Please log in." }
  }

  const parsed = inviteAccountSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { password } = parsed.data

  // Hash the password
  const passwordHash = await hashPassword(password)

  try {
    await prisma.$transaction(async (tx) => {
      // Create a User record with role CLIENT, using the client's phone as username
      const user = await tx.user.create({
        data: {
          username: invite.phone ?? `client_${invite.clientId}`,
          phone: invite.phone ?? undefined,
          passwordHash,
          role: "CLIENT" as const,
        },
      })

      // Link User to Client via userId
      await tx.client.update({
        where: { id: invite.clientId },
        data: {
          userId: user.id,
        },
      })
    })

    return { ok: true }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      // Double-submit or concurrent completion: if this client already got
      // linked to an account, treat as success; otherwise surface a clear error.
      const refreshed = await prisma.client.findUnique({
        where: { id: invite.clientId },
        select: { userId: true },
      })
      if (refreshed?.userId) {
        return { ok: true }
      }
      return {
        ok: false,
        error: "An account with this phone number already exists.",
      }
    }
    throw error
  }
}
