"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { BellOff, CheckCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import type { Dictionary } from "@/lib/i18n/messages/en"
import { formatDate, interpolate } from "@/lib/i18n/format"
import type { Notification } from "@/lib/db/types"
import {
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/server/actions/notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function resolveText(
  template: string,
  params: Record<string, string | number>,
  t: Dictionary
): string {
  // Params starting with "@" are i18n paths resolved in the viewer's locale
  // (e.g. "@plan.nutrition"), so notifications localize on read, not on write.
  const resolved: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v.startsWith("@")) {
      resolved[k] = (lookup(t, v.slice(1)) as string) || v
    } else {
      resolved[k] = v
    }
  }
  return interpolate(template, resolved)
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const { t, locale } = useI18n()
  const items = lookup(t, "notifications.items") as unknown as Record<string, string>
  const title = resolveText(items[notification.titleKey] ?? notification.titleKey, notification.params, t)
  const body = resolveText(items[notification.bodyKey] ?? notification.bodyKey, notification.params, t)
  const unread = !notification.readAt

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
        unread ? "border-brand-300 bg-brand-500/[0.06] dark:border-brand-800" : "bg-card"
      )}
    >
      <span
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          unread ? "bg-brand-500" : "bg-muted-foreground/30"
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug break-words">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed break-words text-muted-foreground">{body}</p>
        <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
          {formatDate(notification.createdAt, locale)}
        </p>
      </div>
      {unread ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 text-xs"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRead(notification.id)
          }}
        >
          {t.notifications.markRead}
        </Button>
      ) : null}
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    )
  }
  return content
}

export function NotificationList({
  initial,
  initialCursor,
}: {
  initial: Notification[]
  initialCursor: string | null
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<Notification[]>(initial)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pending, startTransition] = useTransition()

  async function loadMore() {
    if (!cursor) return
    setLoadingMore(true)
    const result = await listNotificationsAction(cursor, false)
    setLoadingMore(false)
    if (result.ok) {
      const seen = new Set(items.map((i) => i.id))
      setItems((prev) => [...prev, ...result.notifications.filter((n) => !seen.has(n.id))])
      setCursor(result.nextCursor)
    } else {
      toast.error(t.toasts.error)
    }
  }

  function handleRead(id: string) {
    const nextItems = items.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    setItems(nextItems)
    const unreadCount = nextItems.filter((n) => !n.readAt).length
    window.dispatchEvent(new CustomEvent("notifications:read", { detail: { count: unreadCount } }))
    
    startTransition(async () => {
      await markNotificationReadAction(id)
    })
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })))
    window.dispatchEvent(new CustomEvent("notifications:read", { detail: { count: 0 } }))
    
    startTransition(async () => {
      const result = await markAllNotificationsReadAction()
      if (result.ok) {
        toast.success(t.notifications.markedAllRead)
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  const hasUnread = items.some((n) => !n.readAt)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t.notifications.subtitle}</p>
        {hasUnread ? (
          <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={pending} className="gap-1.5">
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
            {t.notifications.markAllRead}
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <BellOff className="size-6" />
            </span>
            <p className="text-sm font-semibold">{t.notifications.emptyTitle}</p>
            <p className="max-w-[36ch] text-xs text-muted-foreground">
              {t.notifications.emptyDescription}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <NotificationRow key={n.id} notification={n} onRead={handleRead} />
          ))}
        </div>
      )}

      {cursor ? (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="size-4 animate-spin me-2" /> : null}
            {t.notifications.loadMore}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
