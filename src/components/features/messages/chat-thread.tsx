"use client"

import { useEffect, useRef, useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { MessageBubble } from "@/components/features/messages/message-bubble"
import { MessageComposer } from "@/components/features/messages/message-composer"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"
import type { Role } from "@/generated/prisma/enums"
import { markMessagesReadAction } from "@/server/actions/messages"
import type { ClientContext } from "@/lib/messages/suggestions"
import { sendMessageAction } from "@/server/actions/messages"

type UIMessage = {
  id: string
  body: string
  senderRole: string
  senderId: string
  createdAt: string
  readAt?: string | null
  pending?: boolean
  failed?: boolean
}

export function ChatThread({
  conversationId,
  clientId,
  messages: initialMessages,
  nextCursor,
  currentRole,
  currentUserId,
  archived,
  context,
}: {
  conversationId: string
  clientId: string
  messages: UIMessage[]
  nextCursor: string | null
  currentRole: string
  currentUserId: string
  archived?: boolean
  context?: any
}) {
  const { t, locale } = useI18n() as unknown as { t: any; locale: string }
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages)
  const [composerText, setComposerText] = useState("")
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const isOnline = useRef(true)

  useEffect(() => {
    setMessages((prev) => {
      const map = new Map<string, UIMessage>()
      for (const m of initialMessages) {
        map.set(m.id, m)
      }
      // keep pending messages that are not already in initialMessages by id
      for (const m of prev) {
        if ((m as any).pending && !map.has(m.id)) {
          // avoid duplicate by body+senderId if server echoed it
          const duplicate = Array.from(map.values()).find(im => im.body === m.body && im.senderId === m.senderId && Math.abs(new Date(im.createdAt).getTime() - new Date(m.createdAt).getTime()) < 5000)
          if (!duplicate) map.set(m.id, m)
        }
      }
      const merged = Array.from(map.values())
      // deduplicate by id just in case
      const seen = new Set<string>()
      const unique = merged.filter(m => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
      })
      // preserve order by createdAt ascending
      unique.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      return unique
    })
  }, [initialMessages])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await markMessagesReadAction(conversationId)
      if (!cancelled) {
        window.dispatchEvent(new CustomEvent('messages:read'))
      }
    })()
    return () => { cancelled = true }
  }, [conversationId, messages.length])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => { isOnline.current = true; retryFailedMessages() }
    const handleOffline = () => { isOnline.current = false }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline) }
  }, [])

  // SSE
  useEffect(() => {
    let es: EventSource | null = null
    let closed = false
    function connect() {
      try {
        es = new EventSource(`/api/messages/stream?conversationId=${conversationId}`)
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data)
            if (data.type === "message" && data.message) {
              const m = data.message as UIMessage
              setMessages((prev) => {
                if (prev.some((x) => x.id === m.id)) return prev
                const filtered = prev.filter((p) => !((p as any).pending && p.body === m.body && p.senderId === m.senderId))
                return [...filtered, m]
              })
            }
          } catch {}
        }
        es.onerror = () => { if (closed) return; es?.close(); setTimeout(() => { if (!closed) connect() }, 3000) }
      } catch {}
    }
    connect()
    return () => { closed = true; es?.close() }
  }, [conversationId])

  // Polling fallback
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    let visibleInterval = 3000
    let hiddenInterval = 10000
    const tick = async () => {
      try {
        const res = await fetch(`/api/messages?conversationId=${conversationId}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const fetched: UIMessage[] = data.messages ?? []
        if (fetched.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id))
            const newOnes = fetched.filter((m) => !ids.has(m.id))
            if (newOnes.length === 0) return prev
            const pendingFiltered = prev.filter((p) => !((p as any).pending && newOnes.some((n) => n.body === (p as any).body)))
            const merged = [...prev.filter((p) => !(p as any).pending), ...newOnes]
            merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            const stillPending = prev.filter((p) => (p as any).pending && !newOnes.some((n) => n.body === p.body))
            return [...merged, ...stillPending]
          })
        }
      } catch {}
    }
    function startPolling(ms: number) { if (interval) clearInterval(interval); interval = setInterval(tick, ms) }
    const onVisibility = () => { if (document.hidden) startPolling(hiddenInterval); else { startPolling(visibleInterval); tick(); router.refresh() } }
    const onFocus = () => { tick(); router.refresh() }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onFocus)
    startPolling(document.hidden ? hiddenInterval : visibleInterval)
    return () => { if (interval) clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("focus", onFocus) }
  }, [conversationId, router])

  // 90-second timeout for pending messages
  const scheduleFailure = useCallback((tempId: string) => {
    const timeout = setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, pending: false, failed: true } : m))
      retryTimeouts.current.delete(tempId)
    }, 90000) // 1.5 minutes
    retryTimeouts.current.set(tempId, timeout)
  }, [])

  const retryFailedMessages = useCallback(() => {
    if (!isOnline.current) return
    setMessages((prev) =>
      prev.map((m) => {
        if (m.failed && m.senderId === currentUserId) {
          const tempId = m.id
          const body = m.body
          sendMessageAction({ conversationId, clientId, body }).then(res => {
            if (res.ok) {
              setMessages((p) => p.map((mm) => mm.id === tempId ? { ...mm, id: (res as any).messageId, pending: false, failed: false } : mm))
            } else {
              setMessages((p) => p.map((mm) => mm.id === tempId ? { ...mm, failed: true, pending: false } : mm))
              scheduleFailure(tempId)
            }
          })
          return { ...m, pending: true, failed: false }
        }
        return m
      })
    )
  }, [conversationId, clientId, currentUserId])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      retryTimeouts.current.forEach((t) => clearTimeout(t))
      retryTimeouts.current.clear()
    }
  }, [])

  useEffect(() => {
    if (autoScroll) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, autoScroll])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setAutoScroll(nearBottom)
  }

  function loadOlder() {
    if (!nextCursor) return
    startTransition(() => {
      const url = new URL(window.location.href)
      url.searchParams.set("cursor", nextCursor)
      router.push(url.pathname + url.search)
    })
  }

  const handleOptimistic = useCallback((body: string) => {
    const temp: UIMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      body,
      senderId: currentUserId,
      senderRole: currentRole,
      createdAt: new Date().toISOString(),
      readAt: null,
      pending: true,
    }
    setMessages((prev) => [...prev, temp])
    scheduleFailure(temp.id)
    return temp.id
  }, [currentUserId, currentRole])

  const handleSent = useCallback((tempId: string, realId?: string) => {
    const timeout = retryTimeouts.current.get(tempId)
    if (timeout) { clearTimeout(timeout); retryTimeouts.current.delete(tempId) }
    if (realId) setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: realId, pending: false } as any : m))
  }, [])

  const handleFailed = useCallback((tempId: string) => {
    const timeout = retryTimeouts.current.get(tempId)
    if (timeout) { clearTimeout(timeout); retryTimeouts.current.delete(tempId) }
    setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, pending: false, failed: true } : m))
  }, [])

  const grouped = (() => {
    const map = new Map<string, typeof messages>()
    for (const m of messages) {
      const d = new Date(m.createdAt)
      const key = d.toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return Array.from(map.entries())
  })()

  function dayLabel(iso: string) {
    const d = new Date(iso)
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (iso === today) return t.client.messages.today
    if (iso === yesterday) return t.client.messages.yesterday
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "2-digit", month: "short" }).format(d)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--msg-paper)]">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 overflow-y-auto overscroll-contain bg-[var(--msg-paper)]"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
          {nextCursor ? (
            <div className="flex justify-center py-2">
              <Button variant="outline" size="sm" onClick={loadOlder} disabled={isPending} className="rounded-full border-[var(--msg-mist)] bg-[var(--msg-paper)] font-[var(--font-barlow)] text-xs hover:bg-[var(--msg-steel)] hover:text-[var(--msg-text-on-steel)]">
                {t.client.messages.loadMore}
              </Button>
            </div>
          ) : null}

          {messages.length === 0 ? (
            <div className="rounded-2xl py-16 text-center">
              <p className="font-[var(--font-barlow-condensed)] text-lg tracking-wide text-[var(--msg-text-on-paper)]">No messages yet</p>
              <p className="mt-1 font-[var(--font-barlow)] text-sm text-[var(--msg-text-muted)]">{t.client.messages.noMessages}</p>
            </div>
          ) : (
            grouped.map(([day, msgs]) => (
              <div key={day} className="space-y-2">
                <div className="text-center text-[11px] text-[var(--msg-text-muted)] font-[var(--font-barlow-condensed)] tracking-wide">
                  {(() => { const d = new Date(day); const today = new Date().toISOString().slice(0, 10); const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10); if (day === today) return t.client.messages.today; if (day === yesterday) return t.client.messages.yesterday; return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "2-digit", month: "short" }).format(new Date(day)) })()}
                </div>
                {msgs.map((m) => (
                  <MessageBubble key={m.id} message={m as any} isOwn={m.senderId === currentUserId} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <MessageComposer
        conversationId={conversationId}
        clientId={clientId}
        archived={archived}
        value={composerText}
        onChange={setComposerText}
        onOptimistic={handleOptimistic}
        onSent={handleSent}
        onFailed={handleFailed}
      />
    </div>
  )
}