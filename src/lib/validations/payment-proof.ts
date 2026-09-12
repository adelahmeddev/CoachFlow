import { z } from "zod"

export const paymentProofSubmitSchema = z.object({
  subscriptionId: z.string().min(1).max(64).optional().nullable(),
  amount: z.coerce.number().positive().max(1_000_000).optional().nullable(),
  note: z.string().trim().max(500).optional().default(""),
})

export type PaymentProofSubmitInput = z.infer<typeof paymentProofSubmitSchema>

export const paymentProofReviewSchema = z.object({
  proofId: z.string().min(1).max(64),
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(500).optional().default(""),
})

export type PaymentProofReviewInput = z.infer<typeof paymentProofReviewSchema>
