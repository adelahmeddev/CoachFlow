import { z } from "zod"

export const sendMessageSchema = z.object({
  clientId: z.string().cuid().optional(),
  conversationId: z.string().cuid().optional(),
  body: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long (max 2000)"),
}).refine((d) => !!d.clientId || !!d.conversationId, {
  message: "clientId or conversationId required",
  path: ["clientId"],
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
