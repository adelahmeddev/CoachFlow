import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"
import { getConversationForClient, getMessages } from "@/server/services/message.service"
import { ChatThread } from "@/components/features/messages/chat-thread"
import { getI18n } from "@/lib/i18n"

export default async function ClientMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>
}) {
  const { cursor } = await searchParams
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/client/login")
  }

  const conv = await getConversationForClient(session.user.id)
  if (!conv) {
    redirect("/client/home")
  }

  const { messages, nextCursor } = await getMessages(conv.id, { cursor, take: 30 })
  const archived = false

  const [nutritionPlanRes, splitRes, inBodyRes] = await Promise.all([
    pool.query(`SELECT "id" FROM "ClientNutritionPlan" WHERE "clientId" = $1 AND "status" = $2::"PlanStatus" LIMIT 1`, [conv.clientId, "ACTIVE"]),
    pool.query(`SELECT "id" FROM "TrainingSplit" WHERE "clientId" = $1 AND "status" = $2::"PlanStatus" LIMIT 1`, [conv.clientId, "ACTIVE"]),
    pool.query(`SELECT "id" FROM "BodyComposition" WHERE "clientId" = $1 LIMIT 1`, [conv.clientId]),
  ])
  const nutritionPlan = nutritionPlanRes.rows[0] ?? null
  const split = splitRes.rows[0] ?? null
  const inBody = inBodyRes.rows[0] ?? null
  const context = {
    hasNutritionPlan: !!nutritionPlan,
    hasSplit: !!split,
    hasInBody: !!inBody,
  }

  const uiMessages = messages.map((m) => ({
    id: m.id,
    body: m.body,
    senderRole: m.senderRole,
    senderId: m.senderId,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
  }))

  const { t } = await getI18n()

  return (
    <div className="mx-auto flex h-[calc(100dvh-64px)] max-w-3xl flex-col overflow-hidden rounded-[20px] border border-[var(--msg-mist)] bg-[var(--msg-paper)] shadow-[0_4px_24px_rgba(0,0,0,0.08)] md:h-[calc(100dvh-80px)]">
      <div className="flex items-center gap-3 border-b border-[var(--msg-mist)] px-4 py-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--msg-orange)] font-[var(--font-barlow-condensed)] text-sm font-bold text-white">
          {(conv.trainer.fullName ?? "T")[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-[var(--font-barlow-condensed)] text-sm font-semibold tracking-wide text-[var(--msg-text-on-paper)]">{conv.trainer.fullName ?? t.nav.clientProfile}</p>
          <p className="font-[var(--font-barlow)] text-xs text-[var(--msg-text-muted)]">{t.client.messages.clientSubtitle} • {t.client.messages.online}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ChatThread
          conversationId={conv.id}
          clientId={conv.clientId}
          messages={uiMessages as any}
          nextCursor={nextCursor}
          currentRole={session.user.role}
          currentUserId={session.user.id}
          archived={archived}
          context={context}
        />
      </div>
    </div>
  )
}
