"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"

/** Bell with unread badge. Polls every 60s (visible tab only), like messages. */
export function NotificationBell({ href }: { href: string }) {
  const { t } = useI18n()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    let id: NodeJS.Timeout | undefined
    const fetchCount = () => {
      if (document.visibilityState !== "visible") return
      fetch("/api/notifications/unread-count", {
        credentials: "include",
        cache: "no-store" as RequestCache,
      })
        .then((r) => {
          if (r.status === 401) {
            if (id) clearInterval(id)
            return Promise.reject("unauthorized")
          }
          return r.ok ? r.json() : Promise.reject()
        })
        .then((data) => {
          if (!cancelled) setCount(data.count ?? 0)
        })
        .catch(() => {})
    }
    fetchCount()
    id = setInterval(fetchCount, 60000)
    
    const markHandler = (e: Event) => {
      if (e instanceof CustomEvent && e.detail && typeof e.detail.count === "number") {
        setCount(e.detail.count)
      } else {
        // Fallback to fetch if no count provided
        fetchCount()
      }
    }
    
    const visHandler = () => {
      if (document.visibilityState === "visible") fetchCount()
    }
    window.addEventListener("notifications:read", markHandler)
    document.addEventListener("visibilitychange", visHandler)
    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener("notifications:read", markHandler)
      document.removeEventListener("visibilitychange", visHandler)
    }
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative size-8 shrink-0 rounded-full border border-white/10 bg-white/5 p-2 transition-all duration-200 hover:bg-white/10 active:scale-95 dark:bg-white/5 dark:hover:bg-white/10"
      aria-label={t.nav.notifications}
      title={t.nav.notifications}
      asChild
    >
      <Link href={href}>
        <Bell className="size-4" aria-hidden="true" />
        <span
          className={`absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white tabular-nums ${
            count > 0 ? "bg-muscle-500" : "bg-muted-foreground/50"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      </Link>
    </Button>
  )
}
