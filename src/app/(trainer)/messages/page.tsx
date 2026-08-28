import { MessageSquare } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { listConversationsForTrainer } from "@/server/services/message.service"
import { ConversationList } from "@/components/features/messages/conversation-list"
import { getI18n } from "@/lib/i18n"

export default async function MessagesPage() {
  const session = await getCurrentSession()
  const trainerId = session?.user.trainerProfileId
  const { t } = await getI18n()
  if (!trainerId) return null
  const { conversations } = await listConversationsForTrainer(trainerId)

  return (
    <>
      {/* Mobile list */}
      <div className="flex h-full flex-col bg-[var(--msg-steel)] md:hidden">
        <ConversationList conversations={conversations as any} />
      </div>
      {/* Desktop placeholder */}
      <div className="hidden flex-1 flex-col items-center justify-center gap-6 p-8 text-center md:flex">
        <div className="relative size-14 flex-shrink-0">
          <div className="relative size-14 rounded-full border-2 border-[var(--msg-orange)] bg-[var(--msg-steel)]">
            <div className="absolute inset-0 flex items-center justify-center">
              <MessageSquare className="size-7 text-[var(--msg-orange)]" aria-hidden="true" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-[var(--msg-orange)] bg-[var(--msg-orange)]">
            <div className="size-3 rounded-full bg-white" />
          </div>
        </div>
        <div>
          <h2 className="font-[var(--font-barlow-condensed)] text-lg tracking-wide text-[var(--msg-text-on-steel)]">{t.client.messages.selectConversation}</h2>
          <p className="mt-1 font-[var(--font-barlow)] text-sm text-[var(--msg-text-muted)]">{t.client.messages.selectConversationDesc}</p>
        </div>
      </div>
    </>
  )
}