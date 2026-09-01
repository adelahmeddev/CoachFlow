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

  const initials = getInitials(conversation.client.fullName)
  const isOnline = conversation.lastMessageAt ? Date.now() - new Date(conversation.lastMessageAt).getTime() < 5 * 60 * 1000 : false

  return (
    <Link
      href={`/messages/${conversation.clientId}`}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-xl border px-3 py-3 text-start transition-all duration-200 ${
        isActive
          ? "bg-card border-brand-200 shadow-soft dark:border-brand-900/30"
          : "border-transparent hover:border-border hover:bg-card hover:shadow-soft"
      }`}
    >
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground font-bold text-sm ring-1 ring-border group-[aria-current=page]:bg-brand-500 group-[aria-current=page]:text-white group-[aria-current=page]:ring-brand-500/20">
        {initials}
        {isOnline && (
          <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full bg-performance-500 ring-2 ring-card" aria-hidden="true" />
        )}
        {conversation.unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-soft animate-pulse">
            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold tracking-tight">{conversation.client.fullName ?? "Client"}</span>
          {(() => {
            const time = conversation.lastMessageAt
              ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false }).replace("about ", "")
              : ""
            return time ? (
              <span className="ms-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">{time}</span>
            ) : null
          })()}
        </div>
        <p className="mt-0.5 line-clamp-1 truncate text-xs leading-relaxed text-muted-foreground">
          {preview || (conversation.unreadCount > 0 ? `${conversation.unreadCount} unread` : "No messages")}
        </p>
      </div>
    </Link>
  )
}