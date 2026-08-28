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
    <div style={{ backgroundColor: "var(--msg-steel)", color: "var(--msg-text-on-steel)" }} className="flex h-full flex-col">
      <div className="border-b border-[var(--msg-mist)] px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-barlow-condensed)] text-2xl font-semibold tracking-wide">Messages</h2>
          <span className="rounded-full bg-[var(--msg-orange)] px-3 py-1 font-[var(--font-barlow)] text-xs font-semibold text-white">
            {conversations.length}
          </span>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--msg-text-muted)]" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.client.messages.searchPlaceholder}
            aria-label={t.client.messages.searchPlaceholder}
            className="h-10 w-full rounded-full border border-[var(--msg-mist)] bg-[var(--msg-paper)] ps-9 pe-3 font-[var(--font-barlow)] text-sm text-[var(--msg-text-on-steel)] placeholder:text-[var(--msg-text-muted)] focus:border-[var(--msg-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--msg-orange)]/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--msg-orange)] [&::-webkit-scrollbar-thumb]:rounded-full">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[var(--msg-mist)]">
              <MessageSquare className="size-5 text-[var(--msg-text-muted)]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-[var(--font-barlow)] text-sm font-semibold text-[var(--msg-text-on-steel)]">No conversations</p>
              <p className="mt-1 font-[var(--font-barlow)] text-sm leading-relaxed text-[var(--msg-text-muted)]">
                Start a conversation with a client
              </p>
            </div>
          </div>
        ) : (
          <nav className="flex flex-col gap-1 p-3" aria-label="Conversations">
            {filtered.map((c) => (
              <ConversationItem key={c.id} conversation={c} pathname={pathname} t={t} />
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}