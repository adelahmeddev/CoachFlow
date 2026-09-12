"use server"

import { revalidatePath } from "next/cache"
import { pool } from "@/lib/db"
import { getCurrentSession } from "@/server/auth"
import { PaymentProofStatus } from "@/lib/db/enums"
import {
  paymentProofReviewSchema,
  paymentProofSubmitSchema,
} from "@/lib/validations/payment-proof"
import {
  listProofsForClient,
  reviewPaymentProof,
  submitPaymentProof,
} from "@/server/services/payment-proof.service"
import { getRecipientPair, notifySafe } from "@/server/services/notification.service"

const MAX_PROOF_BYTES = 4 * 1024 * 1024
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"])

/** Never trust client-provided MIME: sniff magic bytes. */
function sniffImageMime(buf: Buffer): "image/png" | "image/jpeg" | "image/webp" | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png"
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg"
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp"
  }
  return null
}

export async function submitPaymentProofAction(formData: FormData) {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const parsed = paymentProofSubmitSchema.safeParse({
    subscriptionId: formData.get("subscriptionId") || null,
    amount: formData.get("amount") || null,
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
  if (file.size > MAX_PROOF_BYTES) {
    return { ok: false as const, error: "TOO_LARGE" }
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const mime = sniffImageMime(buf)
  if (!mime || !ALLOWED_MIME.has(mime)) {
    return { ok: false as const, error: "INVALID_TYPE" }
  }

  const clientRes = await pool.query(
    `SELECT "id", "trainerId" FROM "Client" WHERE "userId" = $1 LIMIT 1`,
    [session.user.id]
  )
  const client = clientRes.rows[0] as { id: string; trainerId: string } | undefined
  if (!client || client.id !== clientId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  // Store as data URL (same pattern as admin logo upload — no object storage
  // configured in this project). Column is TEXT; never served publicly —
  // only rendered to the owning client and their coach behind auth.
  const proofUrl = `data:${mime};base64,${buf.toString("base64")}`

  try {
    const proof = await submitPaymentProof({
      clientId: client.id,
      trainerId: client.trainerId,
      subscriptionId: parsed.data.subscriptionId ?? null,
      amount: parsed.data.amount ?? null,
      note: parsed.data.note || null,
      proofUrl,
    })
    revalidatePath("/client/profile")
    const pair = await getRecipientPair(client.id)
    if (pair?.trainerUserId) {
      await notifySafe({
        userId: pair.trainerUserId,
        type: "PAYMENT_PROOF_PENDING",
        titleKey: "paymentProofTitle",
        bodyKey: "paymentProofBody",
        params: { name: pair.clientName ?? "" },
        link: `/clients/${client.id}?tab=subscription`,
      })
    }
    return { ok: true as const, proofId: proof.id }
  } catch (err) {
    if (err instanceof Error && err.message === "SUBSCRIPTION_NOT_FOUND") {
      return { ok: false as const, error: "SUBSCRIPTION_NOT_FOUND" }
    }
    throw err
  }
}

export async function reviewPaymentProofAction(input: unknown) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const parsed = paymentProofReviewSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const decision =
    parsed.data.decision === "APPROVED" ? PaymentProofStatus.APPROVED : PaymentProofStatus.REJECTED

  const result = await reviewPaymentProof({
    trainerId: session.user.trainerProfileId,
    proofId: parsed.data.proofId,
    decision,
    reviewerUserId: session.user.id,
    note: parsed.data.note || null,
  })

  if (!result.ok) return result

  revalidatePath("/dashboard")
  const pair = result.proof ? await getRecipientPair(result.proof.clientId) : null
  if (pair?.clientUserId) {
    const approved = decision === PaymentProofStatus.APPROVED
    await notifySafe({
      userId: pair.clientUserId,
      type: "SUBSCRIPTION_STATUS",
      titleKey: "subscriptionTitle",
      bodyKey: approved ? "subscriptionPaidBody" : "subscriptionRejectedBody",
      params: {},
      link: "/client/profile",
    })
  }
  return { ok: true as const, proof: result.proof }
}

export async function getMyPaymentProofsAction() {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }
  const proofs = await listProofsForClient(clientId, 20)
  return { ok: true as const, proofs }
}
