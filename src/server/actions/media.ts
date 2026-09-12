"use server"

import { revalidatePath } from "next/cache"
import { pool } from "@/lib/db"
import { getCurrentSession } from "@/server/auth"
import { maxBytesFor, sniffMedia } from "@/lib/media"
import { mediaReviewSchema, mediaUploadSchema } from "@/lib/validations/media"
import {
  getMediaItem,
  reviewMedia,
  uploadMedia,
} from "@/server/services/media.service"
import { getRecipientPair, notifySafe } from "@/server/services/notification.service"

export async function uploadMediaAction(formData: FormData) {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const parsed = mediaUploadSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title") ?? "",
    note: formData.get("note") ?? "",
  })
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const file = formData.get("file")
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false as const, error: "NO_FILE" }
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const sniffed = sniffMedia(buf)
  if (!sniffed) return { ok: false as const, error: "INVALID_TYPE" }

  // Declared type must match sniffed content (photo vs video mismatch rejected).
  const matches =
    (parsed.data.type === "FORM_VIDEO" && sniffed.kind === "video") ||
    (parsed.data.type !== "FORM_VIDEO" && sniffed.kind === "photo")
  if (!matches) return { ok: false as const, error: "TYPE_MISMATCH" }
  if (buf.length > maxBytesFor(sniffed.kind)) {
    return { ok: false as const, error: "TOO_LARGE" }
  }

  const clientRes = await pool.query(
    `SELECT "id", "trainerId" FROM "Client" WHERE "userId" = $1 LIMIT 1`,
    [session.user.id]
  )
  const client = clientRes.rows[0] as { id: string; trainerId: string } | undefined
  if (!client || client.id !== clientId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  // Reference stored in DB (data URL — same pattern as receipt/logo uploads;
  // never served publicly, only rendered inside authenticated pages).
  const storageUrl = `data:${sniffed.mime};base64,${buf.toString("base64")}`

  try {
    const media = await uploadMedia({
      clientId: client.id,
      trainerId: client.trainerId,
      type: parsed.data.type,
      storageUrl,
      title: parsed.data.title || null,
      note: parsed.data.note || null,
    })
    const pair = await getRecipientPair(client.id)
    if (pair?.trainerUserId) {
      await notifySafe({
        userId: pair.trainerUserId,
        type: "MEDIA_SUBMITTED",
        titleKey: "mediaTitle",
        bodyKey: "mediaBody",
        params: { name: pair.clientName ?? "", n: 1 },
        link: `/clients/${client.id}?tab=media`,
      })
    }
    revalidatePath("/client/media")
    return { ok: true as const, mediaId: media.id }
  } catch (err) {
    if (err instanceof Error && err.message === "CLIENT_NOT_FOUND") {
      return { ok: false as const, error: "UNAUTHORIZED" }
    }
    throw err
  }
}

export async function reviewMediaAction(input: unknown) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const parsed = mediaReviewSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const result = await reviewMedia({
    trainerId: session.user.trainerProfileId,
    mediaId: parsed.data.mediaId,
    reviewerUserId: session.user.id,
    feedback: parsed.data.feedback || null,
  })
  if (!result.ok) return result

  const pair = await getRecipientPair(result.media.clientId)
  if (pair?.clientUserId) {
    await notifySafe({
      userId: pair.clientUserId,
      type: "COACH_FEEDBACK",
      titleKey: "mediaReviewedTitle",
      bodyKey: "mediaReviewedBody",
      params: { coach: session.user.name ?? "" },
      link: "/client/media",
    })
  }

  revalidatePath(`/clients/${result.media.clientId}`)
  revalidatePath(`/clients/${result.media.clientId}?tab=media`)
  revalidatePath("/dashboard")
  return { ok: true as const, media: result.media }
}

/** Fetch one full item (including payload) with strict scope. Never public. */
export async function getMediaItemAction(mediaId: string) {
  const session = await getCurrentSession()
  if (!session?.user) return { ok: false as const, error: "UNAUTHORIZED" }

  if (session.user.role === "CLIENT") {
    const clientId = session.user.clientProfileId
    if (!clientId) return { ok: false as const, error: "UNAUTHORIZED" }
    const media = await getMediaItem(mediaId, { clientId })
    if (!media) return { ok: false as const, error: "NOT_FOUND" }
    return { ok: true as const, media }
  }

  if (session.user.role === "COACH" && session.user.trainerProfileId) {
    const media = await getMediaItem(mediaId, { trainerId: session.user.trainerProfileId })
    // Coach cross-check: item's client must belong to this trainer (enforced
    // by trainerId scope above — item carries its own trainerId).
    if (!media) return { ok: false as const, error: "NOT_FOUND" }
    return { ok: true as const, media }
  }

  return { ok: false as const, error: "UNAUTHORIZED" }
}
