import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/enums"
import { publish } from "@/server/realtime/message-bus"

export async function getOrCreateConversation(trainerId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, trainerId },
    select: { id: true, trainerId: true },
  })
  if (!client) return null

  let conv = await prisma.conversation.findUnique({
    where: { clientId },
    include: {
      client: { select: { id: true, fullName: true, phone: true } },
      trainer: { select: { id: true, fullName: true } },
    },
  })
  if (conv) return conv

  conv = await prisma.conversation.create({
    data: {
      trainerId,
      clientId,
    },
    include: {
      client: { select: { id: true, fullName: true, phone: true } },
      trainer: { select: { id: true, fullName: true } },
    },
  })
  return conv
}

export async function getConversationForTrainer(trainerId: string, clientId: string) {
  return prisma.conversation.findFirst({
    where: { trainerId, clientId },
    include: {
      client: { select: { id: true, fullName: true, phone: true, userId: true } },
      trainer: { select: { id: true, fullName: true } },
    },
  })
}

export async function getConversationById(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      client: { select: { id: true, fullName: true, phone: true, trainerId: true, userId: true } },
      trainer: { select: { id: true, fullName: true, userId: true } },
    },
  })
}

export async function getConversationForClient(userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true, trainerId: true },
  })
  if (!client) return null

  let conv = await prisma.conversation.findUnique({
    where: { clientId: client.id },
    include: {
      client: { select: { id: true, fullName: true } },
      trainer: { select: { id: true, fullName: true } },
    },
  })
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { trainerId: client.trainerId, clientId: client.id },
      include: {
        client: { select: { id: true, fullName: true } },
        trainer: { select: { id: true, fullName: true } },
      },
    })
  }
  return conv
}

export async function listConversationsForTrainer(
  trainerId: string,
  opts: { q?: string; page?: number; perPage?: number } = {}
) {
  const page = opts.page ?? 1
  const perPage = opts.perPage ?? 20
  const where: any = { trainerId }
  if (opts.q) {
    where.client = {
      OR: [
        { fullName: { contains: opts.q, mode: "insensitive" } },
        { phone: { contains: opts.q, mode: "insensitive" } },
      ],
    }
  }

  const [total, conversations] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        client: { select: { id: true, fullName: true, phone: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true, senderRole: true },
        },
      },
    }),
  ])

  // unread counts per conversation (messages from client not yet read)
  const unreadByConv = new Map<string, number>()
  if (conversations.length > 0) {
    const ids = conversations.map((c) => c.id)
    const unread = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: ids },
        senderRole: "CLIENT",
        readAt: null,
      },
      _count: { _all: true },
    })
    for (const row of unread) {
      unreadByConv.set(row.conversationId, row._count._all)
    }
  }

  const rows = conversations.map((c) => ({
    id: c.id,
    clientId: c.clientId,
    client: c.client,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.lastMessagePreview,
    lastMessage: c.messages[0] ?? null,
    unreadCount: unreadByConv.get(c.id) ?? 0,
  }))

  return { conversations: rows, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) }
}

export async function getMessages(
  conversationId: string,
  opts: { cursor?: string; take?: number } = {}
) {
  const take = opts.take ?? 30
  const where: any = { conversationId }
  // cursor is message id; fetch older than cursor
  let cursorMessage: { createdAt: Date } | null = null
  if (opts.cursor) {
    cursorMessage = await prisma.message.findUnique({
      where: { id: opts.cursor },
      select: { createdAt: true },
    })
    if (cursorMessage) {
      where.createdAt = { lt: cursorMessage.createdAt }
    }
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      body: true,
      senderId: true,
      senderRole: true,
      readAt: true,
      createdAt: true,
    },
  })

  // return oldest first for UI
  const ordered = messages.reverse()
  const nextCursor = messages.length === take ? messages[0]?.id : null
  return { messages: ordered, nextCursor }
}

export async function sendMessage(params: {
  trainerId?: string
  clientUserId?: string
  clientId?: string
  conversationId?: string
  senderId: string
  senderRole: Role
  body: string
}) {
  const { senderId, senderRole, body } = params
  const trimmed = body.trim()
  if (!trimmed) throw new Error("Empty message")

  let conversation: any = null

  if (params.conversationId) {
    conversation = await getConversationById(params.conversationId)
  } else if (params.clientId && params.trainerId) {
    conversation = await getOrCreateConversation(params.trainerId, params.clientId)
  } else if (params.clientUserId) {
    // client sending via his own userId — resolve his conversation
    const client = await prisma.client.findUnique({
      where: { userId: params.clientUserId },
      select: { id: true, trainerId: true },
    })
    if (!client) throw new Error("Client not found")
    conversation = await getOrCreateConversation(client.trainerId, client.id)
  }

  if (!conversation) throw new Error("Conversation not found")

  // RBAC: ensure sender belongs to conversation
  if (senderRole === "TRAINER") {
    if (conversation.trainerId !== params.trainerId) {
      // also allow if sender is trainer of this conversation
      const owner = await prisma.trainerProfile.findUnique({
        where: { userId: senderId },
        select: { id: true },
      })
      if (!owner || owner.id !== conversation.trainerId) throw new Error("Forbidden")
    }
  } else if (senderRole === "CLIENT") {
    const client = await prisma.client.findUnique({
      where: { userId: senderId },
      select: { id: true },
    })
    if (!client || client.id !== conversation.clientId) throw new Error("Forbidden")
  } else {
    throw new Error("Forbidden role")
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      senderRole,
      body: trimmed,
    },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: message.createdAt,
      lastMessagePreview: trimmed.slice(0, 80),
    },
  })

  // broadcast to SSE listeners — fire and forget
  try {
    publish(conversation.id, {
      type: "message",
      message: {
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        senderRole: message.senderRole,
        createdAt: message.createdAt.toISOString(),
        readAt: message.readAt ? message.readAt.toISOString() : null,
        conversationId: conversation.id,
      },
    })
  } catch {}

  return { message, conversationId: conversation.id }
}

export async function markMessagesAsRead(conversationId: string, readerId: string, readerRole: Role) {
  const oppositeRole: Role = readerRole === "TRAINER" ? "CLIENT" : "TRAINER"
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderRole: oppositeRole,
      readAt: null,
    },
    data: { readAt: new Date() },
  })
}

export async function countUnreadForTrainer(trainerId: string) {
  const convs = await prisma.conversation.findMany({
    where: { trainerId },
    select: { id: true },
  })
  if (convs.length === 0) return 0
  return prisma.message.count({
    where: {
      conversationId: { in: convs.map((c) => c.id) },
      senderRole: "CLIENT",
      readAt: null,
    },
  })
}

export async function countUnreadForClient(userId: string) {
  const client = await prisma.client.findUnique({ where: { userId }, select: { id: true } })
  if (!client) return 0
  const conv = await prisma.conversation.findUnique({ where: { clientId: client.id }, select: { id: true } })
  if (!conv) return 0
  return prisma.message.count({
    where: { conversationId: conv.id, senderRole: "TRAINER", readAt: null },
  })
}

export async function isClientArchived(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } })
  return !client
}
