import { pool, generateId, withTransaction } from "@/lib/db"
import { PaymentProofStatus, PaymentStatus } from "@/lib/db/enums"
import type { PaymentProof } from "@/lib/db/types"

export type PaymentProofWithClient = PaymentProof & {
  clientName: string | null
  clientPhone: string | null
  planName: string | null
}

async function assertClientOwnedByTrainer(clientId: string, trainerId: string) {
  const res = await pool.query(
    `SELECT "id", "trainerId" FROM "Client" WHERE "id" = $1 LIMIT 1`,
    [clientId]
  )
  const client = res.rows[0] as { id: string; trainerId: string } | undefined
  if (!client || client.trainerId !== trainerId) return null
  return client
}

export async function submitPaymentProof(params: {
  clientId: string
  trainerId: string
  subscriptionId?: string | null
  amount?: number | null
  note?: string | null
  proofUrl: string
}): Promise<PaymentProof> {
  const client = await assertClientOwnedByTrainer(params.clientId, params.trainerId)
  if (!client) throw new Error("CLIENT_NOT_FOUND")

  let subscriptionId: string | null = null
  if (params.subscriptionId) {
    const subRes = await pool.query(
      `SELECT "id" FROM "Subscription" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
      [params.subscriptionId, params.clientId]
    )
    if (!subRes.rows[0]) throw new Error("SUBSCRIPTION_NOT_FOUND")
    subscriptionId = params.subscriptionId
  }

  const id = generateId()
  const res = await pool.query<PaymentProof>(
    `INSERT INTO "PaymentProof" ("id", "clientId", "trainerId", "subscriptionId", "amount", "proofUrl", "status", "note", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING'::"PaymentProofStatus", $7, NOW(), NOW())
     RETURNING *`,
    [
      id,
      params.clientId,
      params.trainerId,
      subscriptionId,
      params.amount ?? null,
      params.proofUrl,
      params.note?.trim() ? params.note.trim() : null,
    ]
  )
  return res.rows[0] as PaymentProof
}

export async function listProofsForCoach(
  trainerId: string,
  opts: { status?: PaymentProofStatus; page?: number; perPage?: number } = {}
): Promise<{ proofs: PaymentProofWithClient[]; total: number; page: number; perPage: number; totalPages: number }> {
  const page = opts.page ?? 1
  const perPage = Math.min(opts.perPage ?? 10, 50)

  const conditions = [`pp."trainerId" = $1`]
  const params: unknown[] = [trainerId]
  if (opts.status) {
    params.push(opts.status)
    conditions.push(`pp."status" = $${params.length}::"PaymentProofStatus"`)
  }
  const where = conditions.join(" AND ")

  const [totalRes, rowsRes] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM "PaymentProof" pp WHERE ${where}`, params),
    pool.query(
      `SELECT pp.*, c."fullName" AS "clientName", c."phone" AS "clientPhone", s."planName" AS "planName"
       FROM "PaymentProof" pp
       JOIN "Client" c ON c."id" = pp."clientId"
       LEFT JOIN "Subscription" s ON s."id" = pp."subscriptionId"
       WHERE ${where}
       ORDER BY pp."createdAt" DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPage, (page - 1) * perPage]
    ),
  ])

  const total = (totalRes.rows[0] as { count: number }).count
  return {
    proofs: rowsRes.rows as PaymentProofWithClient[],
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function listProofsForClient(clientId: string, limit = 20): Promise<PaymentProof[]> {
  const res = await pool.query<PaymentProof>(
    `SELECT * FROM "PaymentProof" WHERE "clientId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
    [clientId, limit]
  )
  return res.rows as PaymentProof[]
}

/** Coach-scoped per-client list — verifies ownership first (IDOR-safe). */
export async function listProofsForClientOfTrainer(
  clientId: string,
  trainerId: string,
  limit = 20
): Promise<PaymentProof[] | null> {
  const owned = await assertClientOwnedByTrainer(clientId, trainerId)
  if (!owned) return null
  return listProofsForClient(clientId, limit)
}

export async function countPendingProofs(trainerId: string): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count FROM "PaymentProof"
     WHERE "trainerId" = $1 AND "status" = 'PENDING'::"PaymentProofStatus"`,
    [trainerId]
  )
  return (res.rows[0] as { count: number }).count
}

export type ReviewResult =
  | { ok: true; proof: PaymentProof }
  | { ok: false; error: "NOT_FOUND" | "ALREADY_PROCESSED" }

/**
 * Approve/reject a proof atomically. The `WHERE status = PENDING` guard makes
 * concurrent reviews idempotent: exactly one wins, the other gets
 * ALREADY_PROCESSED instead of double-applying subscription changes.
 */
export async function reviewPaymentProof(params: {
  trainerId: string
  proofId: string
  decision: PaymentProofStatus
  reviewerUserId: string
  note?: string | null
}): Promise<ReviewResult> {
  return withTransaction(async (tx) => {
    const updated = await tx.query<PaymentProof>(
      `UPDATE "PaymentProof"
       SET "status" = $1::"PaymentProofStatus", "reviewedBy" = $2, "reviewedAt" = NOW(),
           "note" = COALESCE($3, "note"), "updatedAt" = NOW()
       WHERE "id" = $4 AND "trainerId" = $5 AND "status" = 'PENDING'::"PaymentProofStatus"
       RETURNING *`,
      [
        params.decision,
        params.reviewerUserId,
        params.note?.trim() ? params.note.trim() : null,
        params.proofId,
        params.trainerId,
      ]
    )
    const proof = (updated.rows[0] as PaymentProof | undefined) ?? null
    if (!proof) {
      const exists = await tx.query(`SELECT "id" FROM "PaymentProof" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`, [
        params.proofId,
        params.trainerId,
      ])
      if (exists.rows[0]) return { ok: false as const, error: "ALREADY_PROCESSED" as const }
      return { ok: false as const, error: "NOT_FOUND" as const }
    }

    // Approval settles the linked subscription using existing business rules:
    // mark it PAID (the subscription row itself — status/lifecycle untouched).
    if (params.decision === PaymentProofStatus.APPROVED && proof.subscriptionId) {
      await tx.query(
        `UPDATE "Subscription" SET "paymentStatus" = $1::"PaymentStatus", "updatedAt" = NOW()
         WHERE "id" = $2 AND "clientId" = $3`,
        [PaymentStatus.PAID, proof.subscriptionId, proof.clientId]
      )
    }

    return { ok: true as const, proof }
  })
}
