"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import { Search, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useI18n } from "@/lib/i18n/client"
import { ConversationItem } from "./conversation-item"

type ConversationRow = {
  id: string
  clientId: string
  client: { id: string; fullName: string | null; phone: string | null }
  lastMessageAt: Date | string | null
  lastMessagePreview: string | null
  lastMessage: { body: string; createdAt: Date | string } | null
  unreadCount: number
}

export function ConversationList({
  conversations,
}: {
  conversations: ConversationRow[]
}) {
  const { t } = useI18n()
  const pathname = usePathname()
  const [q, setQ] = useState("")

  const filtered = q
    ? conversations.filter((c) => {
        const name = (c.client.fullName ?? "").toLowerCase()
        const phone = (c.client.phone ?? "").toLowerCase()
        const qq = q.toLowerCase()
        return name.includes(qq) || phone.includes(qq)
      })
    : conversations

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">الرسائل</h2>
          <span className="inline-flex items-center rounded-full bg-brand-500 px-2.5 py-1 text-xs font-bold text-white shadow-soft">
            {conversations.length}
          </span>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.client.messages.searchPlaceholder}
            aria-label={t.client.messages.searchPlaceholder}
            className="h-10 w-full rounded-xl border bg-muted/30 ps-9 pe-3 text-sm placeholder:text-muted-foreground focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-brand-500/40 [&::-webkit-scrollbar-thumb]:rounded-full">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <MessageSquare className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold">No conversations</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">ابدأ محادثة مع بطل من ملفه</p>
            </div>
          </div>
        ) : (
          <nav className="flex flex-col gap-2 p-3" aria-label="Conversations">
            {filtered.map((c) => (
              <ConversationItem key={c.id} conversation={c} pathname={pathname} t={t} />
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}