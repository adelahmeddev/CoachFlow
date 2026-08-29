import { redirect, notFound } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"
import { getConversationForTrainer, getMessages, isClientArchived } from "@/server/services/message.service"
import { ChatThread } from "@/components/features/messages/chat-thread"
import { ConversationList } from "@/components/features/messages/conversation-list"
import { listConversationsForTrainer } from "@/server/services/message.service"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getI18n } from "@/lib/i18n"

export default async function TrainerThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ cursor?: string }>
}) {
  const { clientId } = await params
  const { cursor } = await searchParams
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "TRAINER" || !session.user.trainerProfileId) {
    redirect("/login")
  }
  const trainerId = session.user.trainerProfileId
  const conversation = await getConversationForTrainer(trainerId, clientId)
  if (!conversation) {
    // auto-create if client belongs to trainer but no conversation yet
    const clientRes = await pool.query(`SELECT "id" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`, [clientId, trainerId])
    const client = clientRes.rows[0] as { id: string } | undefined
    if (!client) notFound()
    // create empty conversation
    const { getOrCreateConversation } = await import("@/server/services/message.service")
    await getOrCreateConversation(trainerId, clientId)
  }

  const conv = conversation ?? (await getConversationForTrainer(trainerId, clientId))
  if (!conv) notFound()

  const { messages, nextCursor } = await getMessages(conv.id, { cursor, take: 30 })
  const archived = await isClientArchived(clientId)
  const { t } = await getI18n()

  // contextual suggestions: check client assets
  const [nutritionPlanRes, splitRes, inBodyRes] = await Promise.all([
    pool.query(`SELECT "id" FROM "ClientNutritionPlan" WHERE "clientId" = $1 AND "status" = $2::"PlanStatus" LIMIT 1`, [clientId, "ACTIVE"]),
    pool.query(`SELECT "id" FROM "TrainingSplit" WHERE "clientId" = $1 AND "status" = $2::"PlanStatus" LIMIT 1`, [clientId, "ACTIVE"]),
    pool.query(`SELECT "id" FROM "BodyComposition" WHERE "clientId" = $1 LIMIT 1`, [clientId]),
  ])
  const nutritionPlan = nutritionPlanRes.rows[0] ?? null
  const split = splitRes.rows[0] ?? null
  const inBody = inBodyRes.rows[0] ?? null
  const context = {
    hasNutritionPlan: !!nutritionPlan,
    hasSplit: !!split,
    hasInBody: !!inBody,
  }

  // map to UIMessage format
  const uiMessages = messages.map((m) => ({
    id: m.id,
    body: m.body,
    senderRole: m.senderRole,
    senderId: m.senderId,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
  }))

  // For mobile: we still need list? We'll render thread with back button, and on desktop the layout already shows list.
  // Fetch list for mobile back navigation? Not needed.

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--msg-paper)]">
      {/* Mobile header — clean */}
      <div className="flex items-center gap-2 border-b border-[var(--msg-mist)] bg-[var(--msg-paper)] px-3 py-2.5 md:hidden">
        <Button asChild variant="ghost" size="icon" className="size-8 shrink-0 text-[var(--msg-text-on-paper)] hover:bg-[var(--msg-mist)]">
          <Link href="/messages" aria-label={t.common.back}>
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-[var(--font-barlow-condensed)] text-sm font-semibold tracking-wide text-[var(--msg-text-on-paper)]">{conv.client.fullName ?? "Client"}</p>
          {conv.client.phone ? (
            <p className="truncate font-[var(--font-barlow)] text-xs text-[var(--msg-text-muted)]" dir="ltr">
              {conv.client.phone}
            </p>
          ) : null}
        </div>
      </div>

      {/* Desktop header — clean */}
      <div className="hidden items-center justify-between border-b border-[var(--msg-mist)] bg-[var(--msg-paper)] px-5 py-3 md:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-[var(--msg-orange)] font-[var(--font-barlow-condensed)] text-sm font-bold text-white">
            {(conv.client.fullName ?? "C")[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-[var(--font-barlow-condensed)] text-base font-semibold tracking-wide text-[var(--msg-text-on-paper)]">{conv.client.fullName ?? "Client"}</p>
            {conv.client.phone ? (
              <p className="font-[var(--font-barlow)] text-xs text-[var(--msg-text-muted)]" dir="ltr">
                {conv.client.phone} • {t.client.messages.online}
              </p>
            ) : null}
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full border-[var(--msg-mist)] font-[var(--font-barlow)] text-xs hover:bg-[var(--msg-steel)] hover:text-[var(--msg-text-on-steel)]">
          <Link href={`/clients/${clientId}`}>{t.clients.viewProfile}</Link>
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <ChatThread
          conversationId={conv.id}
          clientId={clientId}
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
