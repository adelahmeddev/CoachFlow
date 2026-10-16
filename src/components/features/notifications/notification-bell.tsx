"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"

/** Bell with unread badge. If count is provided by parent, avoids duplicate polling. */
export function NotificationBell({
  href,
  count: propCount,
}: {
  href: string
  count?: number
}) {
  const { t } = useI18n()
  const [internalCount, setInternalCount] = useState(0)
  const isControlled = typeof propCount === "number"
  const count = isControlled ? propCount : internalCount

  useEffect(() => {
    if (isControlled) return

    let cancelled = false
    let id: NodeJS.Timeout | undefined
    let lastFetched = 0

    const fetchCount = () => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (now - lastFetched < 45_000) return
      lastFetched = now

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
          if (!cancelled && typeof data?.count === "number") setInternalCount(data.count)
        })
        .catch(() => {})
    }
    fetchCount()
    id = setInterval(fetchCount, 90_000)

    const markHandler = (e: Event) => {
      if (e instanceof CustomEvent && e.detail && typeof e.detail.count === "number") {
        setInternalCount(e.detail.count)
      } else {
        lastFetched = 0
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
  }, [isControlled])

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
