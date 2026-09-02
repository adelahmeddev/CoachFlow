import { pool, generateId } from "@/lib/db"
import type { Role } from "@/lib/db/enums"
import type { Message, Conversation } from "@/lib/db/types"
import { publish } from "@/server/realtime/message-bus"

async function enrichConversationWith(
  conv: Record<string, unknown> & { id: string; trainerId: string; clientId: string },
  clientSelect: "basic" | "withUserId" | "withTrainerIdUserId",
  trainerSelect: "basic" | "withUserId"
) {
  // Fetch related records to emulate include
  const clientPromise = (() => {
    if (clientSelect === "basic") {
      return pool.query(`SELECT "id", "fullName", "phone" FROM "Client" WHERE "id" = $1 LIMIT 1`, [conv.clientId])
    } else if (clientSelect === "withUserId") {
      return pool.query(`SELECT "id", "fullName", "phone", "userId" FROM "Client" WHERE "id" = $1 LIMIT 1`, [conv.clientId])
    } else {
      return pool.query(`SELECT "id", "fullName", "phone", "trainerId", "userId" FROM "Client" WHERE "id" = $1 LIMIT 1`, [conv.clientId])
    }
  })()
  const trainerPromise = (() => {
    if (trainerSelect === "basic") {
      return pool.query(`SELECT "id", "fullName" FROM "TrainerProfile" WHERE "id" = $1 LIMIT 1`, [conv.trainerId])
    } else {
      return pool.query(`SELECT "id", "fullName", "userId" FROM "TrainerProfile" WHERE "id" = $1 LIMIT 1`, [conv.trainerId])
    }
  })()
  const [cRes, tRes] = await Promise.all([clientPromise, trainerPromise])
  return {
    ...conv,
    client: cRes.rows[0] ?? null,
    trainer: tRes.rows[0] ?? null,
  }
}

export async function getOrCreateConversation(trainerId: string, clientId: string) {
  const client = await pool.query(`SELECT "id", "trainerId" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`, [clientId, trainerId])
  if (!client.rowCount || client.rowCount === 0) return null

  let convRes = await pool.query(`SELECT * FROM "Conversation" WHERE "clientId" = $1 LIMIT 1`, [clientId])
  if (convRes.rowCount && convRes.rowCount > 0) {
    const conv = convRes.rows[0] as Record<string, unknown> & { id: string; trainerId: string; clientId: string }
    return enrichConversationWith(conv, "basic", "basic")
  }

  const id = generateId()
  const now = new Date()
  const created = await pool.query(
    `INSERT INTO "Conversation" ("id", "trainerId", "clientId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $4) RETURNING *`,
    [id, trainerId, clientId, now]
  )
  const conv = created.rows[0] as Record<string, unknown> & { id: string; trainerId: string; clientId: string }
  return enrichConversationWith(conv, "basic", "basic")
}

export async function getConversationForTrainer(trainerId: string, clientId: string) {
  const res = await pool.query(`SELECT * FROM "Conversation" WHERE "trainerId" = $1 AND "clientId" = $2 LIMIT 1`, [trainerId, clientId])
  if (!res.rowCount || res.rowCount === 0) return null
  const conv = res.rows[0] as Record<string, unknown> & { id: string; trainerId: string; clientId: string }
  return enrichConversationWith(conv, "withUserId", "basic")
}

export async function getConversationById(conversationId: string) {
  const res = await pool.query(`SELECT * FROM "Conversation" WHERE "id" = $1 LIMIT 1`, [conversationId])
  if (!res.rowCount || res.rowCount === 0) return null
  const conv = res.rows[0] as Record<string, unknown> & { id: string; trainerId: string; clientId: string }
  return enrichConversationWith(conv, "withTrainerIdUserId", "withUserId")
}

export async function getConversationForClient(userId: string) {
  const clientRes = await pool.query(`SELECT "id", "trainerId" FROM "Client" WHERE "userId" = $1 LIMIT 1`, [userId])
  if (!clientRes.rowCount || clientRes.rowCount === 0) return null
  const client = clientRes.rows[0] as { id: string; trainerId: string }

  let convRes = await pool.query(`SELECT * FROM "Conversation" WHERE "clientId" = $1 LIMIT 1`, [client.id])
  if (convRes.rowCount && convRes.rowCount > 0) {
    const conv = convRes.rows[0] as Record<string, unknown> & { id: string; trainerId: string; clientId: string }
    return enrichConversationWith(conv, "basic", "basic")
  }
  const id = generateId()
  const now = new Date()
  const created = await pool.query(
    `INSERT INTO "Conversation" ("id", "trainerId", "clientId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $4) RETURNING *`,
    [id, client.trainerId, client.id, now]
  )
  const conv = created.rows[0] as Record<string, unknown> & { id: string; trainerId: string; clientId: string }
  return enrichConversationWith(conv, "basic", "basic")
}

export async function listConversationsForTrainer(
  trainerId: string,
  opts: { q?: string; page?: number; perPage?: number } = {}
) {
  const page = opts.page ?? 1
  const perPage = opts.perPage ?? 20
  const offset = (page - 1) * perPage

  let whereSql = `"Conversation"."trainerId" = $1`
  const whereParams: unknown[] = [trainerId]
  if (opts.q) {
    whereParams.push(`%${opts.q}%`)
    whereSql += ` AND ("Client"."fullName" ILIKE $2 OR "Client"."phone" ILIKE $2)`
  }

  // total count
  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM "Conversation"
     JOIN "Client" ON "Conversation"."clientId" = "Client"."id"
     WHERE ${whereSql}`,
    whereParams
  )
  const total = (countRes.rows[0] as { count: number }).count

  // paginated conversations with client details
  const dataParams = [...whereParams, perPage, offset]
  const limitIdx = whereParams.length + 1
  const offsetIdx = whereParams.length + 2
  const convRes = await pool.query(
    `SELECT "Conversation".*, "Client"."id" AS "c_id", "Client"."fullName" AS "c_fullName", "Client"."phone" AS "c_phone"
     FROM "Conversation"
     JOIN "Client" ON "Conversation"."clientId" = "Client"."id"
     WHERE ${whereSql}
     ORDER BY "Conversation"."lastMessageAt" DESC NULLS LAST
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    dataParams
  )

  const conversations = convRes.rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    trainerId: r.trainerId as string,
    clientId: r.clientId as string,
    lastMessageAt: r.lastMessageAt as Date | null,
    lastMessagePreview: r.lastMessagePreview as string | null,
    createdAt: r.createdAt as Date,
    updatedAt: r.updatedAt as Date,
    client: { id: r.c_id as string, fullName: r.c_fullName as string | null, phone: r.c_phone as string | null },
  }))

  // unread counts per conversation (messages from client not yet read)
  const unreadByConv = new Map<string, number>()
  if (conversations.length > 0) {
    const ids = conversations.map((c) => c.id)
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",")
    const unreadRes = await pool.query(
      `SELECT "conversationId", COUNT(*)::int AS _count FROM "Message"
       WHERE "conversationId" IN (${placeholders}) AND "senderRole" = $${ids.length + 1}::"Role" AND "readAt" IS NULL
       GROUP BY "conversationId"`,
      [...ids, "CLIENT"]
    )
    for (const row of unreadRes.rows as Array<{ conversationId: string; _count: number }>) {
      unreadByConv.set(row.conversationId, row._count)
    }
  }

  // latest message per conversation
  const latestByConv = new Map<string, { body: string; createdAt: Date; senderRole: Role }>()
  if (conversations.length > 0) {
    const ids = conversations.map((c) => c.id)
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",")
    const msgRes = await pool.query(
      `SELECT DISTINCT ON ("conversationId") "conversationId", "body", "createdAt", "senderRole"
       FROM "Message" WHERE "conversationId" IN (${placeholders})
       ORDER BY "conversationId", "createdAt" DESC`,
      ids
    )
    for (const row of msgRes.rows as Array<{ conversationId: string; body: string; createdAt: Date; senderRole: Role }>) {
      latestByConv.set(row.conversationId, { body: row.body, createdAt: row.createdAt, senderRole: row.senderRole })
    }
  }

  const rows = conversations.map((c) => ({
    id: c.id,
    clientId: c.clientId,
    client: c.client,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.lastMessagePreview,
    lastMessage: latestByConv.get(c.id) ?? null,
    unreadCount: unreadByConv.get(c.id) ?? 0,
  }))

  return { conversations: rows, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) }
}

export async function getMessages(
  conversationId: string,
  opts: { cursor?: string; take?: number } = {}
): Promise<{ messages: Message[]; nextCursor: string | null }> {
  const take = opts.take ?? 30
  let cursorCreatedAt: Date | null = null
  if (opts.cursor) {
    const cursorRes = await pool.query<{ createdAt: Date }>(`SELECT "createdAt" FROM "Message" WHERE "id" = $1 LIMIT 1`, [opts.cursor])
    if (cursorRes.rowCount && cursorRes.rowCount > 0) {
      cursorCreatedAt = (cursorRes.rows[0] as { createdAt: Date }).createdAt
    }
  }

  let sql: string
  let params: unknown[]
  if (cursorCreatedAt) {
    sql = `SELECT "id", "body", "senderId", "senderRole", "readAt", "createdAt"
           FROM "Message" WHERE "conversationId" = $1 AND "createdAt" < $2
           ORDER BY "createdAt" DESC LIMIT $3`
    params = [conversationId, cursorCreatedAt, take]
  } else {
    sql = `SELECT "id", "body", "senderId", "senderRole", "readAt", "createdAt"
           FROM "Message" WHERE "conversationId" = $1
           ORDER BY "createdAt" DESC LIMIT $2`
    params = [conversationId, take]
  }

  const res = await pool.query<Message>(sql, params)
  const messages = (res.rows as Message[]).reverse()
  const firstDesc = res.rows[0] as Message | undefined
  const nextCursor = res.rows.length === take ? firstDesc?.id ?? null : null
  return { messages, nextCursor }
}

export async function sendMessage(params: {
  trainerId?: string
  clientUserId?: string
  clientId?: string
  conversationId?: string
  senderId: string
  senderRole: Role
  body: string
}): Promise<{ message: Message; conversationId: string }> {
  const { senderId, senderRole, body } = params
  const trimmed = body.trim()
  if (!trimmed) throw new Error("Empty message")

  let conversation: (Conversation & { client: unknown; trainer: unknown }) | null = null

  if (params.conversationId) {
    const res = await getConversationById(params.conversationId)
    conversation = res as unknown as typeof conversation
  } else if (params.clientId && params.trainerId) {
    const res = await getOrCreateConversation(params.trainerId, params.clientId)
    conversation = res as unknown as typeof conversation
  } else if (params.clientUserId) {
    const clientRes = await pool.query<{ id: string; trainerId: string }>(`SELECT "id", "trainerId" FROM "Client" WHERE "userId" = $1 LIMIT 1`, [params.clientUserId])
    if (!clientRes.rowCount || clientRes.rowCount === 0) throw new Error("Client not found")
    const client = clientRes.rows[0] as { id: string; trainerId: string }
    const res = await getOrCreateConversation(client.trainerId, client.id)
    conversation = res as unknown as typeof conversation
  }

  if (!conversation) throw new Error("Conversation not found")

  // RBAC: ensure sender belongs to conversation
  if (senderRole === "COACH") {
    if ((conversation as Conversation).trainerId !== params.trainerId) {
      const owner = await pool.query<{ id: string }>(`SELECT "id" FROM "TrainerProfile" WHERE "userId" = $1 LIMIT 1`, [senderId])
      if (!owner.rowCount || owner.rowCount === 0 || (owner.rows[0] as { id: string }).id !== (conversation as Conversation).trainerId) throw new Error("Forbidden")
    }
  } else if (senderRole === "CLIENT") {
    const client = await pool.query<{ id: string }>(`SELECT "id" FROM "Client" WHERE "userId" = $1 LIMIT 1`, [senderId])
    if (!client.rowCount || client.rowCount === 0 || (client.rows[0] as { id: string }).id !== (conversation as Conversation).clientId) throw new Error("Forbidden")
  } else {
    throw new Error("Forbidden role")
  }

  const messageId = generateId()
  const now = new Date()
  const msgRes = await pool.query<Message>(
    `INSERT INTO "Message" ("id", "conversationId", "senderId", "senderRole", "body", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::"Role", $5, $6, $6) RETURNING *`,
    [messageId, (conversation as Conversation).id, senderId, senderRole, trimmed, now]
  )
  const message = msgRes.rows[0] as Message

  await pool.query(
    `UPDATE "Conversation" SET "lastMessageAt" = $1, "lastMessagePreview" = $2, "updatedAt" = NOW() WHERE "id" = $3`,
    [message.createdAt, trimmed.slice(0, 80), (conversation as Conversation).id]
  )

  // Bust unread caches so badge updates immediately (otherwise 10s stale)
  unreadTrainerCache.clear()
  unreadClientCache.clear()

  // broadcast to SSE listeners — fire and forget
  try {
    publish((conversation as Conversation).id, {
      type: "message",
      message: {
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        senderRole: message.senderRole,
        createdAt: (message.createdAt as Date).toISOString(),
        readAt: message.readAt ? (message.readAt as Date).toISOString() : null,
        conversationId: (conversation as Conversation).id,
      },
    })
  } catch {}

  return { message, conversationId: (conversation as Conversation).id }
}

export async function markMessagesAsRead(conversationId: string, readerId: string, readerRole: Role) {
  const oppositeRole: Role = readerRole === "COACH" ? "CLIENT" : "COACH"
  await pool.query(
    `UPDATE "Message" SET "readAt" = NOW(), "updatedAt" = NOW()
     WHERE "conversationId" = $1 AND "senderRole" = $2::"Role" AND "readAt" IS NULL`,
    [conversationId, oppositeRole]
  )
  // Bust caches so next poll sees 0 immediately
  unreadTrainerCache.clear()
  unreadClientCache.clear()
}

// Simple 10s in-memory cache to avoid DB hammer from 30s polling (sidebar + bottom-nav)
// Each trainer/client polls every 30s; without cache every poll does 2-3 queries.
const unreadTrainerCache = new Map<string, { count: number; expires: number }>()
const unreadClientCache = new Map<string, { count: number; expires: number }>()
const UNREAD_TTL_MS = 10_000

export async function countUnreadForTrainer(trainerId: string) {
  const cached = unreadTrainerCache.get(trainerId)
  if (cached && cached.expires > Date.now()) return cached.count

  try {
    const res = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "Message"
       WHERE "conversationId" IN (SELECT "id" FROM "Conversation" WHERE "trainerId" = $1)
         AND "senderRole" = $2::"Role" AND "readAt" IS NULL`,
      [trainerId, "CLIENT"]
    )
    const count = (res.rows[0] as { count: number }).count
    unreadTrainerCache.set(trainerId, { count, expires: Date.now() + UNREAD_TTL_MS })
    return count
  } catch (err) {
    console.error("[countUnreadForTrainer] failed", err)
    return cached?.count ?? 0
  }
}

export async function countUnreadForClient(userId: string) {
  const cached = unreadClientCache.get(userId)
  if (cached && cached.expires > Date.now()) return cached.count

  try {
    const res = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "Message" m
       JOIN "Conversation" c ON m."conversationId" = c."id"
       JOIN "Client" cl ON c."clientId" = cl."id"
       WHERE cl."userId" = $1 AND m."senderRole" = $2::"Role" AND m."readAt" IS NULL`,
      [userId, "COACH"]
    )
    const count = (res.rows[0] as { count: number }).count
    unreadClientCache.set(userId, { count, expires: Date.now() + UNREAD_TTL_MS })
    return count
  } catch (err) {
    console.error("[countUnreadForClient] failed", err)
    return cached?.count ?? 0
  }
}

// Call after marking read or sending message to bust cache immediately
export function invalidateUnreadCache(trainerId?: string, clientUserId?: string) {
  if (trainerId) unreadTrainerCache.delete(trainerId)
  if (clientUserId) unreadClientCache.delete(clientUserId)
}

export async function isClientArchived(clientId: string) {
  const client = await pool.query(`SELECT "id" FROM "Client" WHERE "id" = $1 LIMIT 1`, [clientId])
  return !client.rowCount || client.rowCount === 0
}
