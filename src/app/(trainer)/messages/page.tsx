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
      <div className="flex h-full flex-col bg-card md:hidden">
        <ConversationList conversations={conversations as any} />
      </div>
      {/* Desktop placeholder */}
      <div className="hidden flex-1 flex-col items-center justify-center gap-4 p-8 text-center md:flex">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
          <MessageSquare className="size-8" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight">{t.client.messages.selectConversation}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.client.messages.selectConversationDesc}</p>
          <p className="mt-2 text-xs text-muted-foreground">اختر بطل من القائمة وابدأ المحادثة 💬</p>
        </div>
      </div>
    </>
  )
}