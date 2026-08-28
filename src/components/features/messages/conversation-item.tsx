"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useI18n } from "@/lib/i18n/client"

type ConversationRow = {
  id: string
  clientId: string
  client: { id: string; fullName: string | null; phone: string | null }
  lastMessageAt: Date | string | null
  lastMessagePreview: string | null
  lastMessage: { body: string; createdAt: Date | string } | null
  unreadCount: number
}

function getInitials(name: string | null) {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
}

type ConversationItemProps = {
  conversation: ConversationRow
  pathname: string
  t: ReturnType<typeof useI18n>["t"]
}

export function ConversationItem({ conversation, pathname, t }: ConversationItemProps) {
  const isActive = pathname === `/messages/${conversation.clientId}` || pathname === `/messages/${conversation.id}`
  const preview = conversation.lastMessagePreview || conversation.lastMessage?.body || ""
  const time = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false }).replace("about ", "")
    : ""

  return (
    <Link
      key={conversation.id}
      href={`/messages/${conversation.clientId}`}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-start transition-colors ${isActive
        ? "bg-[var(--msg-paper)]"
        : "hover:bg-[var(--msg-paper)]/50"}`}
    >
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--msg-steel)] text-[var(--msg-text-on-steel)] font-[var(--font-barlow-condensed)] font-bold text-sm">
        {conversation.client.fullName ? conversation.client.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join("").slice(0, 1) : "?"}
        {conversation.unreadCount > 0 && (
          <span className="absolute -bottom-1 -end-1 flex min-w-5 items-center justify-center rounded-full bg-[var(--msg-orange)] font-[var(--font-barlow)] text-[10px] font-bold text-white">
            {conversation.unreadCount}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-[var(--font-barlow)] text-sm font-semibold tracking-tight">
            {conversation.client.fullName ?? "Client"}
          </span>
          {(() => {
            const time = conversation.lastMessageAt
              ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false }).replace("about ", "")
              : ""
            return time ? (
              <span className="ms-auto shrink-0 font-[var(--font-barlow)] text-[11px] tabular-nums text-[var(--msg-text-muted)] group-[aria-current=page]:text-[var(--msg-text-on-steel)]">
                {time}
              </span>
            ) : null
          })()}
        </div>
        <p className="mt-0.5 line-clamp-1 block truncate font-[var(--font-barlow)] text-xs leading-relaxed text-[var(--msg-text-muted)]">
          {preview ? `— ${preview}` : "No messages"}
        </p>
      </div>
    </Link>
  )
}