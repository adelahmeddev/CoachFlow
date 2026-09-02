import { getCurrentSession } from "@/server/auth"
import { redirect } from "next/navigation"
import { Barlow_Condensed, Barlow, JetBrains_Mono } from "next/font/google"
import { listConversationsForTrainer } from "@/server/services/message.service"
import { ConversationList } from "@/components/features/messages/conversation-list"

const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-barlow-condensed", display: "swap" })
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-barlow", display: "swap" })
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono-msg", display: "swap" })

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    redirect("/login")
  }
  const { conversations } = await listConversationsForTrainer(session.user.trainerProfileId, {})

  return (
    <div
      className={`${barlowCondensed.variable} ${barlow.variable} ${mono.variable} flex h-[calc(100dvh-64px)] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft md:h-[calc(100dvh-72px)] md:flex-row`}
    >
      <div className="hidden w-[360px] shrink-0 flex-col border-e bg-muted/10 md:flex">
        <ConversationList conversations={conversations as any} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col bg-background">{children}</div>
    </div>
  )
}