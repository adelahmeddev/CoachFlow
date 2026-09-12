import { z } from "zod"
import { ProgressMediaType } from "@/lib/db/enums"

export const mediaUploadSchema = z.object({
  type: z.nativeEnum(ProgressMediaType),
  title: z.string().trim().max(100).optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
})

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>

export const mediaReviewSchema = z.object({
  mediaId: z.string().min(1).max(64),
  feedback: z.string().trim().max(1000).optional().default(""),
})

export type MediaReviewInput = z.infer<typeof mediaReviewSchema>
